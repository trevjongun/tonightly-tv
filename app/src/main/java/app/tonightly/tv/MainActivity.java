package app.tonightly.tv;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
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
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.Normalizer;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/** Tonightly per Android TV: mostra la versione TV del sito a tutto schermo e apre le app dei servizi. */
public class MainActivity extends Activity {
    private WebView web;
    private FrameLayout root;
    private View fullView;
    private WebChromeClient.CustomViewCallback fullCb;
    // aggiornamenti dell'app
    private volatile String updUrl;
    private volatile int updVer;
    private boolean updChecked, updWaitPerm, updBusy;
    // il ponte TonightlyTV risponde solo alle pagine del tuo sito, non a quelle di altri indirizzi
    private static final String SITE = origin(BuildConfig.TV_URL);
    private volatile boolean trusted;

    private static String origin(String url) {
        try { Uri u = Uri.parse(url); return u.getScheme() == null || u.getHost() == null ? "" : (u.getScheme() + "://" + u.getHost() + (u.getPort() > 0 ? ":" + u.getPort() : "")).toLowerCase(); }
        catch (Exception e) { return ""; }
    }
    /* fuori dall'app si aprono solo indirizzi web normali, non altri schemi (file:, intent:, market:…) */
    private static boolean web(String url) { return url != null && (url.startsWith("https://") || url.startsWith("http://")); }
    private static boolean mine(String url) { return url != null && !SITE.isEmpty() && SITE.equals(origin(url)); }

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
        // il WebView non deve leggere file o contenuti del dispositivo: mostra solo il sito
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setGeolocationEnabled(false);
        s.setSavePassword(false);
        if (Build.VERSION.SDK_INT >= 26) s.setSafeBrowsingEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setUserAgentString(s.getUserAgentString() + " TonightlyTV/1");
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.addJavascriptInterface(new Bridge(), "TonightlyTV");

        // file di un aggiornamento già installato (più vecchio di un'ora, per non toccare un'installazione in corso): non serve più
        try { File old = ApkProvider.file(this); if (old.exists() && System.currentTimeMillis() - old.lastModified() > 3600000L) old.delete(); } catch (Exception e) { /* niente da pulire */ }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView v, String url, android.graphics.Bitmap icon) { trusted = mine(url); }
            /* nel WebView restano solo le pagine del sito; gli altri indirizzi si aprono fuori (se la TV ha un browser) */
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest req) {
                if (!req.isForMainFrame()) return false;
                String url = req.getUrl().toString();
                if (mine(url)) return false;
                if (web(url)) try { startActivity(new Intent(Intent.ACTION_VIEW, req.getUrl()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (Exception e) { /* nessuna app per aprirlo */ }
                return true;
            }
            /* la stessa regola su Android 5 e 6, che usano solo questa versione */
            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                if (mine(url)) return false;
                if (web(url)) try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (Exception e) { /* nessuna app per aprirlo */ }
                return true;
            }
            @Override
            public void onPageFinished(WebView v, String url) {
                if (!updChecked && url != null && url.startsWith("http")) { updChecked = true; checkUpdate(false); }
            }
            @Override
            public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) {
                    // riprova da sola ogni 15 secondi, così quando torna la rete non serve toccare il telecomando
                    final String u = JSONObject.quote(BuildConfig.TV_URL).replace("<", "\\u003c").replace("'", "\\u0027");
                    v.loadDataWithBaseURL(null, "<html><body style='background:#07080c;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center'><div><h1>Nessuna connessione</h1><p>Controlla che la TV sia collegata a Internet, poi premi OK. Riprovo da solo ogni 15 secondi.</p><button autofocus onclick='location.href=" + u + "' style='font-size:22px;padding:14px 28px;border-radius:12px;border:0'>Riprova</button></div><script>setInterval(function(){if(navigator.onLine!==false)location.href=" + u + "},15000)</script></body></html>", "text/html", "utf-8", null);
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
        // tornato dalle impostazioni dopo aver dato il permesso: riparto con l'installazione
        if (updWaitPerm && canInstall()) { updWaitPerm = false; install(); }
    }

    @Override
    protected void onPause() { if (web != null) web.onPause(); super.onPause(); }

    @Override
    protected void onDestroy() { if (web != null) { web.destroy(); } super.onDestroy(); }

    private void js(final String code) { runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); }); }

    /** Chiede a GitHub qual è l'ultima versione; se è più nuova la pagina mostra "Aggiornamento disponibile". */
    private void checkUpdate(final boolean manual) {
        final String repo = BuildConfig.UPDATE_REPO;
        if (repo == null || !repo.contains("/")) { if (manual) js("window.tvUpdate&&tvUpdate({none:1,err:1})"); return; }
        new Thread(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL("https://api.github.com/repos/" + repo + "/releases/latest").openConnection();
                c.setRequestProperty("Accept", "application/vnd.github+json");
                c.setRequestProperty("User-Agent", "TonightlyTV");
                c.setConnectTimeout(10000); c.setReadTimeout(15000);
                if (c.getResponseCode() != 200) { if (manual) js("window.tvUpdate&&tvUpdate({none:1,err:2})"); return; }
                InputStream in = c.getInputStream(); java.io.ByteArrayOutputStream b = new java.io.ByteArrayOutputStream(); byte[] buf = new byte[8192]; int n;
                while ((n = in.read(buf)) > 0) b.write(buf, 0, n); in.close();
                JSONObject r = new JSONObject(b.toString("UTF-8"));
                int v = 0; try { v = Integer.parseInt(r.optString("tag_name", "").replaceAll("[^0-9]", "")); } catch (Exception e) { /* tag senza numero */ }
                String url = null; JSONArray as = r.optJSONArray("assets");
                if (as != null) for (int i = 0; i < as.length(); i++) { JSONObject a = as.getJSONObject(i); if (a.optString("name", "").endsWith(".apk")) { url = a.optString("browser_download_url", null); break; } }
                // solo file pubblicati nelle release del tuo repository
                if (url != null && !url.startsWith("https://github.com/" + repo + "/releases/download/")) url = null;
                if (url != null && v > BuildConfig.VERSION_CODE) { updUrl = url; updVer = v; js("window.tvUpdate&&tvUpdate({v:" + v + ",cur:" + BuildConfig.VERSION_CODE + (manual ? ",manual:1" : "") + "})"); }
                else if (manual) js("window.tvUpdate&&tvUpdate({none:1})");
            } catch (Exception e) { if (manual) js("window.tvUpdate&&tvUpdate({none:1,err:3})"); }
        }).start();
    }

    /** Scarica l'aggiornamento mostrando l'avanzamento, poi apre l'installatore di Android. */
    private void downloadUpdate() {
        if (updBusy || updUrl == null) return; updBusy = true;
        new Thread(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(updUrl).openConnection();
                c.setInstanceFollowRedirects(true); c.setRequestProperty("User-Agent", "TonightlyTV"); c.setConnectTimeout(15000); c.setReadTimeout(30000);
                if (c.getResponseCode() != 200) throw new java.io.IOException("HTTP " + c.getResponseCode());
                if (!"https".equals(c.getURL().getProtocol())) throw new java.io.IOException("non https");
                long tot = c.getContentLength(), got = 0; int last = -1;
                if (tot > MAX_APK) throw new java.io.IOException("file troppo grande");
                File f = ApkProvider.file(this); InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(f); byte[] buf = new byte[65536]; int n;
                while ((n = in.read(buf)) > 0) { out.write(buf, 0, n); got += n; if (got > MAX_APK) { out.close(); in.close(); f.delete(); throw new java.io.IOException("file troppo grande"); } int p = tot > 0 ? (int) (got * 100 / tot) : 50; if (p != last) { last = p; js("window.tvUpdProg&&tvUpdProg(" + Math.min(p, 99) + ")"); } }
                out.close(); in.close();
                // l'aggiornamento deve essere Tonightly, più nuovo, e firmato con la stessa chiave dell'app installata
                if (!sameSigner(f)) { f.delete(); throw new SecurityException("firma diversa"); }
                js("window.tvUpdProg&&tvUpdProg(100)");
                runOnUiThread(this::install);
            } catch (Exception e) { js("window.tvUpdProg&&tvUpdProg(-1)"); }
            updBusy = false;
        }).start();
    }

    private static final long MAX_APK = 100L * 1024 * 1024;

    @SuppressWarnings("deprecation")
    private boolean sameSigner(File apk) {
        try {
            PackageManager pm = getPackageManager();
            int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
            PackageInfo nu = pm.getPackageArchiveInfo(apk.getAbsolutePath(), flags), me = pm.getPackageInfo(getPackageName(), flags);
            if (nu == null || me == null || !getPackageName().equals(nu.packageName)) return false;
            if (nu.versionCode <= BuildConfig.VERSION_CODE) return false;
            Signature[] a, b;
            if (Build.VERSION.SDK_INT >= 28) {
                a = nu.signingInfo == null ? null : nu.signingInfo.getApkContentsSigners(); b = me.signingInfo == null ? null : me.signingInfo.getApkContentsSigners();
            } else { a = nu.signatures; b = me.signatures; }
            // alcune versioni di Android non leggono la firma dal file: in quel caso controlla comunque l'installatore
            if (a == null || b == null || a.length == 0 || b.length == 0) return true;
            List<String> x = new ArrayList<>(), y = new ArrayList<>();
            for (Signature g : a) x.add(g.toCharsString());
            for (Signature g : b) y.add(g.toCharsString());
            java.util.Collections.sort(x); java.util.Collections.sort(y);
            return x.equals(y);
        } catch (Exception e) { return false; }
    }

    private boolean canInstall() { return Build.VERSION.SDK_INT < 26 || getPackageManager().canRequestPackageInstalls(); }

    private void install() {
        if (!canInstall()) {
            // la prima volta Android chiede di permettere a Tonightly di installare app
            updWaitPerm = true; js("window.tvUpdProg&&tvUpdProg(-2)");
            try { startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()))); }
            catch (Exception e) { try { startActivity(new Intent(Settings.ACTION_SECURITY_SETTINGS)); } catch (Exception e2) { /* niente impostazioni */ } }
            return;
        }
        try {
            Intent i = new Intent(Intent.ACTION_VIEW).setDataAndType(ApkProvider.uri(), "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) { js("window.tvUpdProg&&tvUpdProg(-1)"); }
    }

    private static String norm(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
        return n.replace("+", "plus").replaceAll("[^a-z0-9]", "");
    }

    /** Funzioni che la pagina può chiamare. */
    private class Bridge {
        @JavascriptInterface
        public boolean openApp(String service, String title) {
            if (!trusted || service == null) return false;
            PackageManager pm = getPackageManager();
            String want = norm(service);
            if (want.startsWith("amazon")) want = want.substring(6);
            if (want.length() < 3 || want.length() > 40) return false; // un nome vuoto aprirebbe un'app qualsiasi
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

        @JavascriptInterface
        public void checkUpdate() { if (trusted) MainActivity.this.checkUpdate(true); }

        @JavascriptInterface
        public void installUpdate() { if (trusted) runOnUiThread(MainActivity.this::downloadUpdate); }
    }
}
