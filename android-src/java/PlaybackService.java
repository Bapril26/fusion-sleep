package za.co.fusionlabs.sleep;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/**
 * Foreground "media playback" service.
 * Keeps the app process (and its WebView audio) alive while the screen is off,
 * holds a partial wake lock so the sleep timer keeps running, and shows a
 * notification with Play / Pause / Stop controls.
 */
public class PlaybackService extends Service {

    static final String ACTION_START = "za.co.fusionlabs.sleep.START";
    static final String ACTION_PLAY = "za.co.fusionlabs.sleep.PLAY";
    static final String ACTION_PAUSE = "za.co.fusionlabs.sleep.PAUSE";
    static final String ACTION_STOP = "za.co.fusionlabs.sleep.STOP";
    static final String ACTION_FOCUS = "za.co.fusionlabs.sleep.FOCUS";

    private static final String CHANNEL_ID = "fusion_sleep_playback";
    private static final int NOTIFICATION_ID = 7300;
    private static final long MAX_WAKE_MS = 12L * 60L * 60L * 1000L; // safety limit: 12 hours

    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private boolean hasFocus = false;
    private boolean resumeOnFocusGain = false;
    private boolean noisyRegistered = false;

    /** Phone calls, alarms and other apps: pause, then resume after short interruptions. */
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {
        switch (change) {
            case AudioManager.AUDIOFOCUS_LOSS:
                hasFocus = false;
                resumeOnFocusGain = false;
                FusionPlaybackPlugin.emitAction("pause");
                break;
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                resumeOnFocusGain = true;
                FusionPlaybackPlugin.emitAction("pause");
                break;
            case AudioManager.AUDIOFOCUS_GAIN:
                hasFocus = true;
                if (resumeOnFocusGain) FusionPlaybackPlugin.emitAction("play");
                resumeOnFocusGain = false;
                break;
            default:
                // AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK: quiet sleep audio can keep playing.
                break;
        }
    };

    /** Headphones unplugged / Bluetooth disconnected: pause instead of playing out loud. */
    private final BroadcastReceiver noisyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                FusionPlaybackPlugin.emitAction("pause");
            }
        }
    };

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_PLAY.equals(action)) {
            FusionPlaybackPlugin.emitAction("play");
            return START_NOT_STICKY;
        }
        if (ACTION_PAUSE.equals(action)) {
            FusionPlaybackPlugin.emitAction("pause");
            return START_NOT_STICKY;
        }
        if (ACTION_FOCUS.equals(action)) {
            requestFocus();
            return START_NOT_STICKY;
        }
        if (ACTION_STOP.equals(action)) {
            FusionPlaybackPlugin.emitAction("stop");
            stopSelf();
            return START_NOT_STICKY;
        }

        String title = intent != null ? intent.getStringExtra("title") : null;
        String subtitle = intent != null ? intent.getStringExtra("subtitle") : null;
        boolean playing = intent == null || intent.getBooleanExtra("playing", true);

        Notification notification = build(this, title, subtitle, playing);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        acquireWakeLock();
        if (playing) requestFocus();
        registerNoisy();
        return START_NOT_STICKY;
    }

    private void requestFocus() {
        if (hasFocus) return;
        if (audioManager == null) audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return;
        int result;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build())
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener(focusListener)
                .build();
            result = audioManager.requestAudioFocus(focusRequest);
        } else {
            result = audioManager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
        hasFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    }

    private void abandonFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
            audioManager.abandonAudioFocusRequest(focusRequest);
        } else {
            audioManager.abandonAudioFocus(focusListener);
        }
        hasFocus = false;
    }

    private void registerNoisy() {
        if (noisyRegistered) return;
        IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(noisyReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(noisyReceiver, filter);
        }
        noisyRegistered = true;
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        abandonFocus();
        if (noisyRegistered) {
            try { unregisterReceiver(noisyReceiver); } catch (Exception ignored) { }
            noisyRegistered = false;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        super.onDestroy();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // The user swiped the app away: stop playing and clean up.
        stopSelf();
        super.onTaskRemoved(rootIntent);
    }

    static void updateNotification(Context context, String title, String subtitle, boolean playing) {
        if (playing) {
            // Ask for audio focus again when the user resumes after an interruption.
            Intent i = new Intent(context, PlaybackService.class);
            i.setAction(ACTION_FOCUS);
            try { context.startService(i); } catch (Exception ignored) { }
        }
        try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, build(context, title, subtitle, playing));
        } catch (SecurityException ignored) {
            // Notification permission not granted; playback continues without the notification update.
        }
    }

    private static Notification build(Context context, String title, String subtitle, boolean playing) {
        createChannel(context);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent contentIntent = PendingIntent.getActivity(context, 0, open, piFlags);

        NotificationCompat.Builder b = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_fusion)
            .setContentTitle(title != null && !title.isEmpty() ? title : "Fusion Sleep")
            .setContentText(subtitle != null && !subtitle.isEmpty() ? subtitle : (playing ? "Playing" : "Paused"))
            .setSubText(playing ? "Playing" : "Paused")
            .setContentIntent(contentIntent)
            .setOngoing(playing)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setShowWhen(false)
            .setCategory(NotificationCompat.CATEGORY_TRANSPORT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(0xFF1677FF)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        if (playing) {
            b.addAction(0, "Pause", actionIntent(context, ACTION_PAUSE, 1));
        } else {
            b.addAction(0, "Play", actionIntent(context, ACTION_PLAY, 2));
        }
        b.addAction(0, "Stop", actionIntent(context, ACTION_STOP, 3));
        return b.build();
    }

    private static PendingIntent actionIntent(Context context, String action, int requestCode) {
        Intent i = new Intent(context, PlaybackService.class);
        i.setAction(action);
        return PendingIntent.getService(context, requestCode, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void createChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW);
        ch.setDescription("Shows playback controls while Fusion Sleep is playing");
        ch.setShowBadge(false);
        ch.setSound(null, null);
        nm.createNotificationChannel(ch);
    }

    private void acquireWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) return;
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm == null) return;
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FusionSleep::Playback");
        wakeLock.setReferenceCounted(false);
        wakeLock.acquire(MAX_WAKE_MS);
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
    }
}
