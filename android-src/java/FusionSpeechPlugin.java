package za.co.fusionlabs.sleep;

import android.media.AudioAttributes;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Story narration with the phone's own text-to-speech engine.
 *
 * Free, works offline and needs no API key. The story is sent once as a list
 * of short chunks; this class speaks them one after another on its own, so the
 * story keeps going with the screen off even if the web view is throttled.
 *
 * Events to JS: "progress" {index}, "end" {reason: finished|timer}, "error" {message}.
 */
@CapacitorPlugin(name = "FusionSpeech")
public class FusionSpeechPlugin extends Plugin {

    private TextToSpeech tts;
    private boolean ready = false;
    private boolean initFailed = false;
    private final List<PluginCall> waiting = new ArrayList<>();
    private final Handler main = new Handler(Looper.getMainLooper());

    private List<String> chunks = new ArrayList<>();
    private int index = 0;
    private int session = 0;
    private boolean speaking = false;
    private float rate = 0.9f;
    private float pitch = 0.95f;
    private float volume = 1f;

    // fade-out (sleep timer)
    private long fadeStartAt = 0;   // elapsedRealtime ms
    private long fadeEndAt = 0;
    private final Runnable stopAtEnd = () -> {
        stopInternal();
        JSObject e = new JSObject();
        e.put("reason", "timer");
        emit("end", e);
    };

    @Override
    public void load() {
        tts = new TextToSpeech(getContext(), status -> main.post(() -> {
            if (status == TextToSpeech.SUCCESS) {
                ready = true;
                tts.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());
                tts.setOnUtteranceProgressListener(listener);
            } else {
                initFailed = true;
            }
            for (PluginCall c : waiting) handleWhenReady(c);
            waiting.clear();
        }));
    }

    private void handleWhenReady(PluginCall call) {
        switch (call.getMethodName()) {
            case "getVoices": getVoicesNow(call); break;
            case "speak": speakNow(call); break;
            default: call.resolve();
        }
    }

    private boolean deferIfNotReady(PluginCall call) {
        if (ready) return false;
        if (initFailed) {
            call.reject("No text-to-speech engine is available on this phone.");
            return true;
        }
        waiting.add(call);
        return true;
    }

    // ---------- methods ----------

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", !initFailed);
        r.put("ready", ready);
        call.resolve(r);
    }

    @PluginMethod
    public void getVoices(PluginCall call) {
        if (deferIfNotReady(call)) return;
        getVoicesNow(call);
    }

    private void getVoicesNow(PluginCall call) {
        JSArray list = new JSArray();
        try {
            Set<Voice> voices = tts.getVoices();
            if (voices != null) {
                for (Voice v : voices) {
                    Locale l = v.getLocale();
                    if (l == null || !"en".equals(l.getLanguage())) continue;
                    Set<String> features = v.getFeatures();
                    if (features != null && features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                    JSObject o = new JSObject();
                    o.put("id", v.getName());
                    o.put("locale", l.toLanguageTag());
                    o.put("language", l.getDisplayName(Locale.ENGLISH));
                    o.put("quality", v.getQuality());
                    o.put("network", v.isNetworkConnectionRequired());
                    list.put(o);
                }
            }
        } catch (Exception ignored) { }
        JSObject r = new JSObject();
        r.put("voices", list);
        Voice def = null;
        try { def = tts.getDefaultVoice(); } catch (Exception ignored) { }
        r.put("defaultId", def != null ? def.getName() : null);
        call.resolve(r);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        if (deferIfNotReady(call)) return;
        speakNow(call);
    }

    private void speakNow(PluginCall call) {
        JSArray arr = call.getArray("chunks");
        List<String> list = new ArrayList<>();
        try {
            if (arr != null) for (int i = 0; i < arr.length(); i++) list.add(arr.getString(i));
        } catch (JSONException e) {
            call.reject("Story text could not be read.");
            return;
        }
        if (list.isEmpty()) { call.reject("This story has no text."); return; }

        stopInternal();
        session++;
        chunks = list;
        index = Math.max(0, Math.min(call.getInt("start", 0), list.size() - 1));
        rate = call.getFloat("rate", 0.9f);
        pitch = call.getFloat("pitch", 0.95f);
        volume = call.getFloat("volume", 1f);

        String voiceId = call.getString("voiceId");
        if (voiceId != null) {
            try {
                for (Voice v : tts.getVoices()) if (v.getName().equals(voiceId)) { tts.setVoice(v); break; }
            } catch (Exception ignored) { }
        }
        tts.setSpeechRate(rate);
        tts.setPitch(pitch);
        speaking = true;
        speakCurrent();
        call.resolve();
    }

    /** Stop speaking and report the chunk to resume from. */
    @PluginMethod
    public void pause(PluginCall call) {
        stopInternal();
        JSObject r = new JSObject();
        r.put("index", index);
        call.resolve(r);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopInternal();
        call.resolve();
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        volume = call.getFloat("volume", 1f);
        call.resolve(); // applied from the next sentence
    }

    /** Fade gradually over the last fadeMs of endMs, then stop and fire "end". */
    @PluginMethod
    public void fadeOut(PluginCall call) {
        long now = SystemClock.elapsedRealtime();
        long endMs = Math.max(0, call.getLong("endMs", 0L));
        long fadeMs = Math.max(0, Math.min(call.getLong("fadeMs", 0L), endMs));
        main.removeCallbacks(stopAtEnd);
        if (endMs <= 0) { fadeStartAt = 0; fadeEndAt = 0; call.resolve(); return; }
        fadeEndAt = now + endMs;
        fadeStartAt = fadeEndAt - fadeMs;
        main.postDelayed(stopAtEnd, endMs);
        call.resolve();
    }

    @PluginMethod
    public void cancelFade(PluginCall call) {
        main.removeCallbacks(stopAtEnd);
        fadeStartAt = 0;
        fadeEndAt = 0;
        call.resolve();
    }

    // ---------- internals ----------

    private float currentVolume() {
        if (fadeEndAt == 0) return volume;
        long now = SystemClock.elapsedRealtime();
        if (now <= fadeStartAt) return volume;
        if (now >= fadeEndAt) return 0f;
        float k = (float) (fadeEndAt - now) / (float) Math.max(1, fadeEndAt - fadeStartAt);
        return Math.max(0.05f, volume * k);
    }

    private void speakCurrent() {
        if (!speaking || index >= chunks.size()) return;
        Bundle params = new Bundle();
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, currentVolume());
        String id = "fs-" + session + "-" + index;
        int res = tts.speak(chunks.get(index), TextToSpeech.QUEUE_FLUSH, params, id);
        if (res == TextToSpeech.ERROR) {
            speaking = false;
            JSObject e = new JSObject();
            e.put("message", "The phone's voice engine could not read this story.");
            emit("error", e);
            return;
        }
        JSObject p = new JSObject();
        p.put("index", index);
        emit("progress", p);
    }

    private void stopInternal() {
        speaking = false;
        session++;
        main.removeCallbacks(stopAtEnd);
        fadeStartAt = 0;
        fadeEndAt = 0;
        if (tts != null) tts.stop();
    }

    private void emit(String event, JSObject data) {
        main.post(() -> notifyListeners(event, data, true));
    }

    private boolean isCurrent(String utteranceId, int[] outIndex) {
        if (utteranceId == null || !utteranceId.startsWith("fs-")) return false;
        String[] parts = utteranceId.split("-");
        if (parts.length != 3) return false;
        try {
            int s = Integer.parseInt(parts[1]);
            outIndex[0] = Integer.parseInt(parts[2]);
            return s == session;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private final UtteranceProgressListener listener = new UtteranceProgressListener() {
        @Override public void onStart(String utteranceId) { }

        @Override public void onDone(String utteranceId) {
            main.post(() -> {
                int[] i = new int[1];
                if (!speaking || !isCurrent(utteranceId, i) || i[0] != index) return;
                index++;
                if (index >= chunks.size()) {
                    speaking = false;
                    main.removeCallbacks(stopAtEnd);
                    JSObject e = new JSObject();
                    e.put("reason", "finished");
                    emit("end", e);
                } else {
                    speakCurrent();
                }
            });
        }

        @Override public void onError(String utteranceId) {
            main.post(() -> {
                int[] i = new int[1];
                if (!speaking || !isCurrent(utteranceId, i)) return;
                speaking = false;
                JSObject e = new JSObject();
                e.put("message", "Narration stopped because the voice engine reported an error.");
                emit("error", e);
            });
        }

        @Override public void onStop(String utteranceId, boolean interrupted) { }
    };

    @Override
    protected void handleOnDestroy() {
        main.removeCallbacksAndMessages(null);
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
    }
}
