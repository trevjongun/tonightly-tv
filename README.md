# tonightly-tv

App Android TV di Tonightly: mostra la versione TV del sito (`tv.html`) a tutto schermo e apre le app dei servizi.

- Codice: `app/src/main/` (l'unico che viene compilato).
- Costruzione: GitHub › Actions › "Costruisci l'app TV" › Run workflow. Il risultato è una release con `tonightly-tv.apk` e la sua impronta SHA-256.
- Firma: imposta i segreti `KEYSTORE_B64` (il file .jks in base64) e `KS_PASS`. Senza, l'APK è firmato con una chiave di prova e gli aggiornamenti dalla TV non si installano.

## Sicurezza
- Il ponte `TonightlyTV` risponde solo alle pagine del sito scelto in costruzione; gli altri indirizzi si aprono fuori dall'app (solo http/https).
- Il WebView non può leggere file del dispositivo; niente backup dei dati dell'app.
- Gli aggiornamenti si scaricano solo dalle release di questo repository e si installano solo se firmati con la stessa chiave dell'app già installata.
- Non mettere mai nel repository il file `.jks` né la password.
