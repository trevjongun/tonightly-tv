# tonightly-tv

Tonightly: il sito (app installabile per telefono e PC), la versione TV del sito e l'app Android TV.

## Il sito (`sito/`)
- Si modifica in `sito/`. A ogni modifica su `main`, GitHub › Actions › "Sito – prova e pubblica":
  1. controlla che le classi CSS nuove non si scontrino con gli stili vecchi (`tools/check-classes.mjs`);
  2. prepara la versione compattata in `dist/` (`tools/build.mjs`; la versione della cache dell'app si calcola da sola);
  3. apre tutte le schermate su telefono, PC e TV con dati finti e si ferma se c'è un errore (`test/smoke.mjs`);
  4. pubblica `dist/` su Cloudflare Pages.
- Per la pubblicazione servono i segreti `CLOUDFLARE_API_TOKEN` (permesso "Cloudflare Pages: Edit") e `CLOUDFLARE_ACCOUNT_ID`. Se il progetto Pages non si chiama `cinematch`, imposta la variabile `CF_PAGES_PROJECT`.
- In locale: `npm install`, poi `npm run controlla`, `npm run build`, `npm run prova`.
- `server/`: database Supabase (`*.sql`) e funzioni (`supabase/functions`). Le chiavi delle notifiche stanno nel Vault di Supabase, mai qui.

## App Android TV
App Android TV di Tonightly: mostra la versione TV del sito (`tv.html`) a tutto schermo e apre le app dei servizi.

- Codice: `app/src/main/` (l'unico che viene compilato).
- Costruzione: GitHub › Actions › "Costruisci l'app TV" › Run workflow. Il risultato è una release con `tonightly-tv.apk` e la sua impronta SHA-256.
- Firma: imposta i segreti `KEYSTORE_B64` (il file .jks in base64) e `KS_PASS`. Senza, l'APK è firmato con una chiave di prova e gli aggiornamenti dalla TV non si installano.

## Sicurezza
- Il ponte `TonightlyTV` risponde solo alle pagine del sito scelto in costruzione; gli altri indirizzi si aprono fuori dall'app (solo http/https).
- Il WebView non può leggere file del dispositivo; niente backup dei dati dell'app.
- Gli aggiornamenti si scaricano solo dalle release di questo repository e si installano solo se firmati con la stessa chiave dell'app già installata.
- Non mettere mai nel repository il file `.jks` né la password.
