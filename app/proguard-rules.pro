# Il sito chiama questi metodi per nome (window.TonightlyTV.openApp, version, checkUpdate, installUpdate)
-keepclassmembers class app.tonightly.tv.MainActivity$Bridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keep class app.tonightly.tv.ApkProvider { *; }
