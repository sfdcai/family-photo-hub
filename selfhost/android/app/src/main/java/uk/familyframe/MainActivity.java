package uk.familyframe;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;

/**
 * Full-screen kiosk WebView for the Family Frame server.
 * - Keeps the screen on, hides system bars, survives reboots (BootReceiver).
 * - Hold the top-left corner for 4 seconds to change the server address.
 * - Reloads automatically if the server is unreachable.
 */
public class MainActivity extends Activity {
    private WebView web;
    private SharedPreferences prefs;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private long cornerDownAt = 0;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        prefs = getSharedPreferences("frame", MODE_PRIVATE);

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.setWebViewClient(new WebViewClient() {
            @Override public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) handler.postDelayed(() -> view.reload(), 15000);
            }
        });
        // Hold the top-left corner for 4 seconds to open the server address dialog.
        web.setOnTouchListener((v, e) -> {
            if (e.getX() < 120 && e.getY() < 120) {
                if (e.getAction() == android.view.MotionEvent.ACTION_DOWN) cornerDownAt = System.currentTimeMillis();
                if (e.getAction() == android.view.MotionEvent.ACTION_UP && System.currentTimeMillis() - cornerDownAt > 4000) { askForServer(); return true; }
            }
            return false;
        });
        web.addJavascriptInterface(new Object() {
            /** Called by the frame at sleep/wake time. Brightness 0 keeps touch working so a tap can wake it. */
            @JavascriptInterface public void setScreen(boolean on) {
                handler.post(() -> {
                    WindowManager.LayoutParams lp = getWindow().getAttributes();
                    lp.screenBrightness = on ? WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE : 0f;
                    getWindow().setAttributes(lp);
                });
            }
        }, "FamilyFrame");
        setContentView(web);
        hideBars();

        String url = prefs.getString("url", null);
        if (url == null) askForServer(); else web.loadUrl(url);
    }

    private void askForServer() {
        EditText input = new EditText(this);
        input.setText(prefs.getString("url", "http://192.168.1.10:8080/frame"));
        new AlertDialog.Builder(this)
            .setTitle("Family Frame server address")
            .setMessage("For example http://192.168.1.10:8080/frame")
            .setView(input)
            .setCancelable(false)
            .setPositiveButton("Save", (d, w) -> {
                String url = input.getText().toString().trim();
                prefs.edit().putString("url", url).apply();
                web.loadUrl(url);
            })
            .show();
    }

    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) { super.onWindowFocusChanged(hasFocus); if (hasFocus) hideBars(); }
    @Override public void onBackPressed() { /* kiosk: ignore back */ }
}
