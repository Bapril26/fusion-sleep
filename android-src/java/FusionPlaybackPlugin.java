package za.co.fusionlabs.sleep;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridge between the web app and PlaybackService.
 * JS: FusionPlayback.start / update / stop, and the "action" event
 * (play | pause | stop) fired from the notification buttons.
 */
@CapacitorPlugin(name = "FusionPlayback")
public class FusionPlaybackPlugin extends Plugin {

    private static FusionPlaybackPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    static void emitAction(String action) {
        if (instance == null) return;
        JSObject data = new JSObject();
        data.put("action", action);
        instance.notifyListeners("action", data, true);
    }

    @PluginMethod
    public void start(PluginCall call) {
        maybeAskNotificationPermission();
        Intent intent = new Intent(getContext(), PlaybackService.class);
        intent.setAction(PlaybackService.ACTION_START);
        intent.putExtra("title", call.getString("title", "Fusion Sleep"));
        intent.putExtra("subtitle", call.getString("subtitle", ""));
        intent.putExtra("playing", call.getBoolean("playing", true));
        try {
            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not start background playback: " + e.getMessage());
        }
    }

    @PluginMethod
    public void update(PluginCall call) {
        PlaybackService.updateNotification(
            getContext(),
            call.getString("title", "Fusion Sleep"),
            call.getString("subtitle", ""),
            call.getBoolean("playing", true)
        );
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), PlaybackService.class);
        getContext().stopService(intent);
        call.resolve();
    }

    private void maybeAskNotificationPermission() {
        if (Build.VERSION.SDK_INT < 33 || getActivity() == null) return;
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[] { Manifest.permission.POST_NOTIFICATIONS }, 7301);
        }
    }
}
