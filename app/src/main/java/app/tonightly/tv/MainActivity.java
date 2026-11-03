package app.tonightly.tv;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

/** Tonightly per Android TV: mostra la versione TV del sito a tutto schermo e apre le app dei servizi. */
public class MainActivity extends Activity {
    private WebView web;
    private FrameLayout root;
    private View fullView;
    private WebChromeClient.CustomViewCallback fullCb;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setUserAgentString(s.getUserAgentString() + " TonightlyTV/1");
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.addJavascriptInterface(new Bridge(), "TonightlyTV");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) {
                    v.loadDataWithBaseURL(null, "<html><body style='background:#07080c;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center'><div><h1>Nessuna connessione</h1><p>Controlla che la TV sia collegata a Internet, poi premi OK.</p><button autofocus onclick='location.href=\"" + BuildConfig.TV_URL + "\"' style='font-size:22px;padding:14px 28px;border-radius:12px;border:0'>Riprova</button></div></body></html>", "text/html", "utf-8", null);
                }
            }
        });
        // trailer a schermo intero
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback cb) {
                fullView = view; fullCb = cb;
                root.addView(view, new FrameLayout.LayoutParams(-1, -1));
                getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
            @Override
            public void onHideCustomView() { closeFull(); }
        });
        if (b != null) web.restoreState(b); else web.loadUrl(BuildConfig.TV_URL);
        web.requestFocus();
    }

    private void closeFull() {
        if (fullView != null) { root.removeView(fullView); fullView = null; if (fullCb != null) fullCb.onCustomViewHidden(); fullCb = null; }
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    /** Indietro: prima lo gestisce la pagina (chiude la scheda, torna su…); se non ha niente da chiudere, esce. */
    @Override
    public void onBackPressed() {
        if (fullView != null) { closeFull(); return; }
        web.evaluateJavascript("(function(){try{return window.tvBack?String(window.tvBack()):'false'}catch(e){return 'false'}})()", value -> {
            if (value == null || !value.contains("true")) finish();
        });
    }

    /** Al ritorno da Netflix & co. la pagina può chiedere "Com'era?". */
    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) { web.onResume(); web.evaluateJavascript("window.tvResume&&window.tvResume()", null); }
    }

    @Override
    protected void onPause() { if (web != null) web.onPause(); super.onPause(); }

    @Override
    protected void onDestroy() { if (web != null) { web.destroy(); } super.onDestroy(); }

    private static String norm(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
        return n.replace("+", "plus").replaceAll("[^a-z0-9]", "");
    }

    /** Funzioni che la pagina può chiamare. */
    private class Bridge {
        @JavascriptInterface
        public boolean openApp(String service, String title) {
            PackageManager pm = getPackageManager();
            String want = norm(service);
            if (want.startsWith("amazon")) want = want.substring(6);
            List<ResolveInfo> all = new ArrayList<>();
            all.addAll(pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER), 0));
            all.addAll(pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER), 0));
            for (ResolveInfo ri : all) {
                String pkg = ri.activityInfo.packageName;
                if (pkg.equals(getPackageName())) continue;
                String label = norm(String.valueOf(ri.loadLabel(pm)));
                if (label.isEmpty()) continue;
                if (label.contains(want) || want.contains(label)) {
                    Intent it = pm.getLeanbackLaunchIntentForPackage(pkg);
                    if (it == null) it = pm.getLaunchIntentForPackage(pkg);
                    if (it == null) continue;
                    it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    try { startActivity(it); return true; } catch (Exception e) { /* prova la prossima */ }
                }
            }
            return false;
        }

        @JavascriptInterface
        public String version() { return BuildConfig.VERSION_NAME; }
    }
}
