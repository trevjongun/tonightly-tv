# Tonightly: guida alla pubblicazione

Tonightly unisce il tracking di una libreria (in corso, watchlist, visti, episodi) con lo swipe per scegliere cosa guardare, anche in gruppo. Funziona su PC e Android e si installa come app (PWA).

## Come si usa
- **Primo accesso**: scegli i servizi a cui sei abbonato, i generi preferiti e se preferisci film, serie o entrambi. Poi 12 titoli da valutare con 3 tasti (Visto, Non mi interessa, Watchlist) e parte la tua Home.
- **Home** (stile streaming): copertina a rotazione, righe "Continua a guardare", "La mia lista", "Scelti per te", popolari, **"Su servizi che non hai"** e righe per genere, che continuano a caricarsi scorrendo. Passando il mouse su una locandina: ✓ visto, ＋ watchlist, ✕ non mi interessa, ⓘ dettagli.
- **Film / Serie TV**: tutto il catalogo con filtri per genere e ordinamento.
- **Quanto tempo?**: scegli i minuti che hai (30 min, 1 h, 90 min…) e ottieni film di quella durata e serie con episodi adatti.
- **Altri servizi**: titoli inclusi in servizi a cui non sei abbonato, filtrabili per servizio.
- **Link alla piattaforma**: sotto ogni titolo compaiono i loghi dei servizi; un clic apre il servizio (Netflix e Prime Video sulla ricerca del titolo, gli altri sulla pagina di JustWatch con il collegamento diretto).
- **Swipe**: funzione secondaria, si apre dal riquadro in Home. Destra = Watchlist, sinistra = Non mi interessa, su = Visto (chiede le stelle).
- **La mia lista**: In corso, Watchlist, Visti, Preferiti. **Profilo**: statistiche, DNA dei gusti, badge e Impostazioni.
- **Ricerca e filtri**: in alto a destra.

## 1. Chiave TMDB (gratuita)
1. Crea un account su https://www.themoviedb.org e richiedi una chiave API (uso personale) in Impostazioni → API.
2. Apri `config.js` e incolla la chiave al posto di `INCOLLA_QUI_LA_CHIAVE_TMDB`.

Con solo questo passaggio l’app funziona in **modalità locale** (dati salvati nel browser, niente stanze di gruppo).

## 2. Account e sincronizzazione con Supabase (gratuito)
1. Crea un progetto su https://supabase.com.
2. Apri **SQL Editor**, incolla tutto `supabase.sql` e premi **Run**. Si può rieseguire senza problemi anche se hai già le tabelle: **è necessario anche per chi aveva la versione precedente**, perché aggiunge watchlist, episodi, commenti della community, foto (bucket `comment-photos`) e i dati per l’algoritmo.
3. In **Project Settings → API** copia il **Project URL** (finisce con `.supabase.co`, senza nulla dopo) e la chiave **anon public** (o "Publishable"). Mai la chiave segreta.
4. Incollali in `config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
5. In **Authentication → Providers → Email** puoi disattivare "Confirm email" per entrare subito dopo la registrazione.

## 3. Pubblicazione
1. Estrai lo zip e controlla `config.js`.
2. Vai su https://app.netlify.com/drop e trascina l’intera cartella.
3. Con la conferma email attiva, imposta in Supabase → Authentication → URL Configuration il "Site URL" con l’indirizzo ottenuto.

## 4. Installazione
- **Android (Chrome)**: menu ⋮ → "Installa app".
- **PC (Chrome o Edge)**: icona di installazione nella barra dell’indirizzo.

## 5. Accesso con Google (facoltativo)
1. Su console.cloud.google.com crea un progetto e configura la schermata di consenso OAuth ("Esterno"; se resta "in test" aggiungi la tua email tra gli utenti di test).
2. In Credenziali crea un "ID client OAuth" di tipo "Applicazione web": come origine JavaScript inserisci l’indirizzo del sito; come URI di reindirizzamento il Callback URL che trovi in Supabase, in Authentication → Providers → Google (`https://CODICE.supabase.co/auth/v1/callback`).
5. Per il pulsante bianco con il logo: scarica il logo dalle linee guida ufficiali di Google (cerca "Google Sign-In branding guidelines"), salvalo come `google-logo.svg` nella cartella del sito (è l’icona "G" che compare a sinistra del testo).
3. Incolla ID client e Segreto client in Supabase (Authentication → Providers → Google), attiva il provider e salva.
4. In Authentication → URL Configuration imposta "Site URL" e aggiungi lo stesso indirizzo tra i "Redirect URLs".

## Pagine legali (da completare prima di pubblicare)
Il sito include `privacy.html`, `termini.html` e `cookie.html`. Apri `config.js` e compila `LEGAL_NAME`, `LEGAL_EMAIL` e `LEGAL_ADDRESS`: compaiono in automatico nelle tre pagine. Sono modelli scritti per questa app (nessun cookie di profilazione, nessuna analisi): rileggili, e se cambi fornitori o aggiungi strumenti aggiornali. Non sostituiscono la consulenza di un legale.
- Il link ai Termini e alla Privacy compare nella schermata di accesso e nel Profilo; la registrazione con email richiede di spuntare età (14+), Termini e Privacy.
- Eliminazione dell'account e scarico dei dati sono nelle Impostazioni → Altro.
- Il pulsante "Invia di nuovo la mail" compare dopo la registrazione (attesa di 60 secondi tra un invio e l'altro).
- Attribuzione: il testo su TMDB e JustWatch è nel Profilo e nei Termini. TMDB richiede anche il suo logo in una pagina "Crediti": aggiungilo se pubblichi l'app al pubblico.

## Ordine dei servizi
L'elenco dei servizi segue l'ordine in `PROV_ORDER` in `config.js`. È una stima della diffusione in Italia, non un dato ufficiale: i servizi non pubblicano il numero di abbonati per paese in modo confrontabile. Puoi cambiare l'ordine modificando l'elenco degli ID.

## Limiti da conoscere
- I servizi non offrono la sincronizzazione automatica: la cronologia si importa da file (Impostazioni → Importa CSV).
- I link diretti ai singoli film sulle piattaforme non sono disponibili da TMDB: ogni servizio apre la propria pagina di ricerca con il titolo già inserito (indirizzi indicati in `app.js`, correggibili da `SVC_SEARCH` in `config.js`; non sono stati verificati uno per uno). Per i servizi senza indirizzo si usa la ricerca di JustWatch.
- Commenti: solo per utenti con account; puoi vedere le segnalazioni nella tabella `comment_reports` di Supabase (3 segnalazioni nascondono il commento) e cancellare a mano commenti o foto dal pannello Supabase.
- La sezione "Altri servizi" mostra titoli presenti sui servizi non tuoi; qualcuno può essere disponibile anche sui tuoi.
- Le vibrazioni funzionano su Android; su iPhone il sistema non le permette.
- Niente avvisi push e niente profili multipli nello stesso account.
- Questo prodotto usa le API di TMDB ma non è approvato né certificato da TMDB. Disponibilità dei titoli fornita da JustWatch.


## Cambiare il nome dell'app

1. In `config.js` cambia `APP_NAME`: aggiorna interfaccia, pagine legali e crediti.
2. In `manifest.webmanifest` cambia `name` e `short_name` (è il nome sotto l'icona sul telefono).
3. Ripubblica e, sul telefono, reinstalla l'app dal browser per vedere il nuovo nome.
Prima di scegliere un nome controlla che sia libero (ricerca marchi UIBM/EUIPO, App Store, Google Play, dominio).

## Aggiornare dopo ogni modifica

1. Esegui di nuovo `supabase.sql` in Supabase (si può rilanciare senza problemi).
2. Ricarica la cartella sul tuo hosting, mantenendo il tuo `config.js`.
3. Sul telefono chiudi e riapri l'app (o svuota la cache del sito) per prendere la nuova versione.

## Se un giorno vuoi pubblicarla davvero (checklist)

- **Nome e marchio**: nome libero, dominio, eventuale registrazione del marchio.
- **TMDB**: l'uso gratuito delle API è per progetti non commerciali. Se l'app ha pubblicità, abbonamenti o scopo commerciale serve una licenza commerciale TMDB. Metti il logo ufficiale TMDB in `crediti.html` (vedi `TMDB_LOGO` in `config.js`).
- **JustWatch**: l'attribuzione è già in `crediti.html`; l'accesso ai dati di disponibilità segue le condizioni di TMDB.
- **Privacy e termini**: compila `LEGAL_NAME`, `LEGAL_EMAIL`, `LEGAL_ADDRESS` e fai rivedere le pagine a un professionista prima del lancio pubblico. Se raccogli più dati o c'è un'attività commerciale servono anche registri e informative aggiornate.
- **Commenti e foto**: servono moderazione, segnalazione, blocco utenti e cancellazione (già presenti); controlla periodicamente la tabella `comment_reports` e rimuovi i contenuti illeciti. Vale anche per le regole degli store (Apple 1.2, Google UGC policy).
- **Store (opzionale)**: Google Play 25 $ una tantum, App Store 99 $ l'anno, Mac con Xcode per iOS, “Accedi con Apple” se c'è l'accesso con Google su iOS.
- **Sicurezza**: nel browser va solo la chiave pubblica (anon) di Supabase; mantieni attive le regole RLS di `supabase.sql`.
- **Notifiche sui nuovi episodi**: non incluse; richiedono un server e su iPhone sono limitate. Il calendario nella sezione Serie TV mostra i prossimi episodi.


## Sicurezza: cosa c'è già e cosa devi impostare tu

**Già nell'app**
- Ogni utente vede e modifica solo i propri dati (regole RLS in `supabase.sql`; esegui il file aggiornato in Supabase).
- I dati importati da file di backup o da CSV vengono ripuliti prima dell'uso; i testi degli utenti sono sempre "disinnescati" prima di mostrarli.
- Intestazioni di sicurezza e Content-Security-Policy (file `_headers`, valide su Cloudflare Pages; la stessa policy è anche in `index.html`).
- Commenti: limite di 5 al minuto e 100 al giorno per utente, controlli sul formato di titolo e foto, segnalazioni e blocco utenti.
- Password: almeno 8 caratteri in registrazione, email controllata, età minima 14 anni dichiarata.

**Da impostare nel pannello Supabase (Authentication)**
1. *Providers → Email*: attiva "Confirm email" e imposta lunghezza minima password a 8.
2. *Attack Protection*: attiva CAPTCHA (Cloudflare Turnstile, gratuito) e la protezione contro le password già compromesse ("Leaked password protection").
3. *Rate Limits*: lascia i limiti predefiniti o abbassali.
4. *URL Configuration*: nel campo "Site URL" e "Redirect URLs" metti solo l'indirizzo reale dell'app.
5. Non usare mai la chiave `service_role` nell'app: nel file `config.js` va solo la chiave `anon`.
6. *Database → Backups*: attiva i backup (a pagamento) oppure scarica ogni tanto un export.
7. In *Authentication → Providers → Google* tieni solo gli indirizzi autorizzati dell'app.

**Cose da sapere**
- La chiave TMDB e la chiave `anon` di Supabase sono visibili a chiunque apra l'app: è normale e non è un problema, perché la protezione dei dati è fatta dalle regole del database. Se la chiave TMDB viene abusata, puoi rigenerarla dal tuo account TMDB.
- Lo script di Supabase viene caricato da una rete di distribuzione (jsDelivr) con versione fissata. Per eliminare anche questo rischio, puoi scaricare il file `supabase.min.js` e metterlo nella cartella dell'app.
- Prima di una pubblicazione vera fai controllare privacy e termini da un professionista e valuta un controllo di sicurezza esterno.

## Novità: Insieme, importazioni, promemoria

1. **Supabase**: riesegui tutto `supabase.sql` nell'SQL Editor (aggiunge note/tag, stanze, amici, notifiche). Senza questo passaggio "Insieme" e le note non funzionano.
2. **Importazioni** (Impostazioni → Importa CSV): Netflix/CSV, TV Time, Trakt, Letterboxd, anche in ZIP. I parser sono tolleranti ma **non sono stati provati su file reali**. TV Time ha chiuso il 15 luglio 2026: funziona solo con un'esportazione salvata in passato.
3. **Promemoria**: senza configurazione l'app avvisa quando la apri (uscite di oggi/domani). Per notifiche anche ad app chiusa serve un server:
   - genera le chiavi VAPID (`npx web-push generate-vapid-keys`), metti la chiave pubblica in `config.js` come `VAPID_PUBLIC: "..."`;
   - pubblica `supabase/functions/notify` (Supabase CLI: `supabase functions deploy notify`) con i segreti TMDB_KEY, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT;
   - programmala una volta al giorno (Supabase → Integrations → Cron).
   Questa parte **non è stata testata**.
4. **Privacy**: con Insieme, nome e voti di stanza sono visibili ai membri; gli amici vedono i tuoi "visti" solo se attivi "Mostra cosa guardo". Aggiorna l'informativa prima di pubblicare.

## Amici, consigli e serata in due (aggiornamento)
- Riesegui `supabase.sql`: aggiunge messaggi tra amici (consigli e inviti), "chi l'ha visto" e il contributo di ogni partecipante al mazzo della serata.
- Il link `?t=movie:123` apre direttamente la scheda di un titolo; `?friend=CODICE` invia una richiesta di amicizia.
- Sull'app Android i pulsanti dei servizi provano ad aprire l'app (Netflix, Prime Video, Disney+, Max, Paramount+, YouTube); se non è installata si apre il sito. Apre la ricerca del titolo nell'app, non la pagina esatta. Non provato su un telefono reale.

## Novità: serata di gruppo, super-voto/veto, roulette, avvisi di arrivo
- **Serata di gruppo**: da Insieme › Serata in due › "Serata di gruppo (fino a 6)". Si invita con amici o con link/codice. Ognuno ha 1 super-voto e 1 veto a serata. Serve rieseguire `supabase.sql` (il limite passa a 6 persone).
- **Roulette**: "Scegli per me" in La mia lista e "Dalla mia lista" in Stasera: 3 titoli dalla lista per tempo e umore.
- **Avvisami quando arriva**: nella scheda di un titolo che non è nei tuoi abbonamenti. Il controllo avviene quando apri l'app (ogni 3 ore al massimo).
- Non incluse: "Ultimi giorni su…" e prezzi di noleggio (TMDB/JustWatch non forniscono scadenze né prezzi), filtri 4K/Atmos (dato non disponibile) e deep link `netflix://title/ID` (servono gli ID interni dei servizi).


## Come funzionano i consigli (motore v2, file `reco.js`)

Tutto il calcolo avviene sul dispositivo, con i dati di TMDB (disponibilità di JustWatch).

1. **Cosa impara da te**: stelle (corrette in base a come voti tu: se dai sempre 4, un 4 vale "nella media"), preferiti, lista, serie finite (piaciute) o abbandonate presto (non piaciute), "Non mi interessa", schede aperte. I segnali vecchi contano meno (si dimezzano in circa un anno). All'inizio usa i generi scelti nel primo accesso.
2. **Cosa guarda di ogni titolo**: generi e combinazioni di generi, parole chiave della trama (le più rare contano di più), regista o ideatore, sceneggiatori, attori principali, studi e reti TV, saga, lingua e paese, decennio, età, durata, popolarità e voto medio.
3. **Affinità prudente**: con poche prove una preferenza resta vicina a zero; impara anche quanto conta per te ogni aspetto (c'è chi segue i registi, chi i generi), con una verifica che esclude ogni titolo mentre lo prevede.
4. **Da dove pesca**: "chi ha amato X ha amato anche Y" (raccomandazioni di TMDB) dai tuoi titoli migliori, con penalità per ciò che somiglia a quelli bocciati; parole chiave, persone, studi e generi preferiti; gioielli nascosti; novità; il seguito delle saghe che ti sono piaciute; i titoli con 4-5 stelle dei tuoi amici; le ricorrenze (Halloween, Natale). Solo titoli inclusi nei tuoi abbonamenti.
5. **Punteggio**: affinità + segnale collaborativo + qualità con media bayesiana (pochi voti = prudenza) + amici + novità + contesto (a tarda notte meno film lunghissimi) − titoli che ti vengono mostrati da giorni e che ignori. Un pizzico di variazione al giorno, più ampia quando ti conosce poco.
6. **Varietà**: riordino che evita titoli troppo simili, bilancia film e serie secondo le tue abitudini, al massimo 3 consigli dallo stesso titolo di partenza, e 3 posti "Da scoprire".
7. **Perché**: ogni consiglio ha un motivo ("Perché ti è piaciuto…", "Dal regista di…", "Il seguito di…", "A Marco è piaciuto (5★)").

**Prestazioni**: la prima volta servono circa 200-250 richieste a TMDB (qualche secondo); i caratteri dei titoli restano salvati sul dispositivo e i consigli del giorno vengono mostrati subito alle aperture successive, mentre quelli nuovi si preparano dietro le quinte.

**Collaudo**: su un catalogo simulato di 900 titoli con gusti nascosti, 10 utenti finti con 45 voti: titoli consigliati tra il 10% migliore per l'utente dal 40% al 64%; qualità della classifica (NDCG@20) da 0,25 a 0,44; generi diversi nei primi 20 da 7 a 11. Senza voti (solo generi iniziali) il 10% migliore passa dal 15% al 30%. Sono prove su dati simulati, non su utenti veri.


## Username e richieste di amicizia

- Ogni utente ha uno **username** unico (3-20 caratteri: lettere minuscole, numeri, punto, trattino basso). Chi è già registrato lo sceglie alla prima apertura dopo l'aggiornamento; i nuovi utenti subito dopo la registrazione. Si corregge liberamente nella prima ora, poi si cambia al massimo una volta ogni 14 giorni.
- In **Insieme › Amici** si cerca per username (almeno 3 caratteri, massimo 10 risultati) e si manda la richiesta dall'app; il codice amico e il link restano come alternativa.
- In **Impostazioni › Amici e richieste** ognuno sceglie chi può mandargli richieste: *Tutti*, *Solo chi ha il mio codice o link* (non compare nella ricerca) o *Nessuno*. Le persone bloccate non compaiono e non possono scrivere.
- Limiti contro gli abusi: massimo 20 richieste in attesa e 30 richieste al giorno.
- **Da fare in Supabase**: riesegui tutto `supabase.sql` nell'editor SQL (aggiunge username, preferenze e nuove funzioni; è stato provato due volte di fila su PostgreSQL 16 senza errori).


## Il motore impara di più (aggiornamento)

- **Più così / Non per me** sui consigli (pulsanti sulla copertina e nel menu “⋯” delle locandine). “Non per me” chiede il motivo: se è *il genere*, *troppo lungo* o *gli attori*, penalizza solo quell'aspetto; *L'ho già visto* apre il voto.
- **Fonti che funzionano**: ogni consiglio ricorda da dove nasce (titoli simili, temi, registi, gioielli nascosti, amici, community…). Se apri, salvi, guardi e voti bene i consigli di una fonte, quella fonte pesa di più per te; se li ignori, pesa meno (stima prudente, serve un po' di storia).
- **Voto più ricco**: mezze stelle (tocca due volte la stessa stella) e i motivi facoltativi (*Storia, Attori, Regia, Atmosfera, Ritmo…* oppure *Storia debole, Troppo lento, Non il mio genere…*), che dicono all'algoritmo quali aspetti hanno contato. “L'ho rivisto” per i titoli già visti.
- **Gesti di interesse**: trailer avviato, “Guarda su…”, tempo passato sulla scheda (oltre 25 secondi).
- **Serate di gruppo**: super-voto, “mi piace”, “passo” e veto insegnano i tuoi gusti.
- **Serie divorate**: più episodi segnati nello stesso giorno = la serie ti ha preso.
- **Il momento**: impara cosa scegli di giorno, di sera e di notte, nei feriali e nel weekend, e gli umori che usi in “Stasera”.
- **Community**: titoli amati da chi ha i tuoi stessi titoli preferiti (solo se piaciuti ad almeno 3 persone, mai chi sono). Si disattiva in Impostazioni › Dati e privacy.
- Nel **Profilo › Gusti, statistiche e badge** c'è “Come ti conosce l'algoritmo”, con il pulsante per azzerare ciò che ha imparato.
- **Da fare in Supabase**: riesegui tutto `supabase.sql` (mezze stelle, motivi del voto, funzione della community). Se non lo fai, l'app continua a salvare arrotondando le stelle e senza motivi.


## Novità: installazione, affinità, storie, diario, liste automatiche, ricerca per trama, sera

- **Installa con un tocco**: su Android (Chrome, Edge, Samsung Internet) e su PC (Chrome/Edge) il tasto “Scarica l’app” apre direttamente l’installazione del browser. Su iPhone/iPad Apple non lo permette: compare una guida di due gesti (Condividi › Aggiungi alla schermata Home). Il tasto è fisso in cima alle Impostazioni.
- **Scorciatoie**: tenendo premuta l’icona dell’app (Android) compaiono Stasera, La mia lista, Cerca, Amici.
- **Affinità con gli amici**: percentuale accanto a ogni amico che condivide cosa guarda; toccandola vedi cosa amate entrambi, dove non siete d’accordo e cosa ha amato lui che tu non hai visto. La “Serata insieme” parte anche da questi titoli.
- **Il tuo anno in storie**: in Profilo › Gusti, statistiche e badge, “Crea le storie da condividere” genera 5-6 immagini 1080×1920 (Instagram, WhatsApp…).
- **Calendario degli abbonamenti**: in “Quale abbonamento ti basta?” i prossimi 4 mesi con le uscite delle tue serie e il servizio da tenere.
- **Diario di visione**: nella scheda di un titolo visto (dove, con chi, com’è stato, una foto) e la vista “Il mio diario” (La mia lista › Altro). Le foto, se hai un account, vanno in uno spazio privato di Supabase Storage (bucket `diary`, creato da `supabase.sql`).
- **Liste automatiche**: Pronti per stasera, Sotto i 100 minuti, Iniziate e mai finite, Comincia questa serie, Da vedere con (l’amico più affine), Classici che ti mancano.
- **Ricerca per trama**: scrivi “film dove uno rivive lo stesso giorno”, “horror coreano”, “serie con i draghi anni 90”… Riconosce circa 70 temi, i generi, la lingua e il decennio.
- **Suggerimento della sera** (Impostazioni › Avvisi e spoiler): tre titoli ogni sera all’ora scelta. Con le notifiche push configurate arriva anche ad app chiusa tramite la funzione `supabase/functions/evening` (NON testata end-to-end): pubblicala come `notify` e pianificala ogni ora al minuto 30 (Supabase › Integrations › Cron) con l’intestazione `Authorization: Bearer <service role key>`. Senza server, su Android con l’app installata prova la sincronizzazione periodica del browser (orario non garantito); altrimenti i tre titoli compaiono quando apri l’app la sera.
- **Da fare in Supabase**: riesegui tutto `supabase.sql` (affinità, tabella della sera, diario, bucket delle foto).


## Speciali di stagione

Nelle pagine **Film** e **Serie TV** (quando non è scelto un genere) compare in automatico una fila speciale, discreta e con colori propri, e un pulsante in cima ai generi:
- **Halloween** 🎃 dal 1° ottobre al 1° novembre (arancione e viola);
- **Natale** 🎄 dall’8 dicembre al 6 gennaio (rosso e verde);
- **San Valentino** 💘 dal 7 al 14 febbraio (rosa).

Mostra solo titoli inclusi nei tuoi abbonamenti. Per vederne una in anteprima fuori periodo apri l’app con `?fest=natale` (oppure `halloween`, `sanvalentino`). Periodi, colori e sezioni si cambiano nell’elenco `FEST` in `more.js`.


## Prime Video: un solo nome, più noleggio e acquisto

- “Amazon Prime Video” e “Amazon Prime Video with Ads” (e in generale le versioni dello stesso servizio, con o senza pubblicità) compaiono ovunque come una sola voce: **Prime Video**.
- Se sei abbonato a Prime Video, nelle pagine **Film** e **Serie TV** compaiono anche i titoli a **noleggio o in vendita** su Prime Video, segnati sulla locandina con il simbolo **€**. Si spengono col pulsante “€ Noleggio e acquisto” accanto a Per te / Popolari / Novità / Più votati. Home, consigli, Stasera e “Quale abbonamento ti basta?” restano solo sui titoli inclusi negli abbonamenti.
- Nella scheda di un titolo compare “€ Noleggia o acquista su Prime Video” quando è disponibile. TMDB/JustWatch non forniscono i prezzi: il prezzo lo vedi su Prime Video.

## Novità di novembre: menu, schede, voto stile TV Time, uscite, amici consigliati
- **Menu a capsula** sul telefono: Home, Scopri, Stasera, Lista, Tu. La voce attiva si allarga e mostra il nome.
- **Scopri** riunisce Film, Serie TV e Uscite.
- **Uscite** divise in "Al cinema" (ora in sala e in arrivo) e "In streaming" (le tue serie e le novità sui tuoi servizi).
- **Scheda più snella**: dove guardarlo in cima, 4 azioni, il resto nelle schede Info · Cast · Simili · Diario · Commenti (per le serie anche Episodi, con "Visto" sul prossimo episodio).
- **Voto stile TV Time**: stelle anche mezze, come ti ha fatto sentire, dove l'hai visto (solo le opzioni possibili: cinema se è uscito da poco, i servizi dove è in abbonamento, noleggio, sempre 🏴‍☠️ Pirata), con chi, commento. "Salva e crea la storia" prepara un'immagine 9:16 da pubblicare.
- **🏴‍☠️ Guardo tutto** (Impostazioni › Abbonamenti): consigli e liste senza il filtro dei servizi. Vale anche per la TV.
- **Amici consigliati** in Insieme › Amici. Serve rieseguire `supabase.sql` (funzione `friend_suggest`).

## Sicurezza: aggiornamento di novembre 2026

**Struttura delle cartelle**
- `sito/` è l'unica cartella da pubblicare (Cloudflare Pages / Netlify). Non contiene più lo schema del database, le funzioni del server e questa guida, che prima finivano online.
- `server/` resta sul tuo computer: `supabase.sql`, `sicurezza-2026-11.sql`, `supabase/functions/`, questa guida.

**Cosa è cambiato**
- La libreria di Supabase (`supabase.min.js`, versione 2.45.4) è nella cartella del sito: la CSP non permette più script da jsDelivr.
- Il service worker salva in cache solo risposte riuscite e le notifiche aprono solo pagine dell'app.
- "Consigli della community": titolo e locandina arrivano da TMDB, non dai dati degli altri utenti.
- All'uscita dall'account si cancella la cache del suggerimento della sera.
- Database (`sicurezza-2026-11.sql`, già in fondo a `supabase.sql`): chi non ha fatto l'accesso non può chiamare le funzioni (tranne il QR della TV); username e codice amico si cambiano solo dall'app; nome e avatar dei commenti li mette il server; limiti di lunghezza sul profilo; QR della TV con numero casuale sicuro e massimo 20 QR ogni 10 minuti per indirizzo IP.
- Funzioni `notify` ed `evening`: il cron si autentica con un segreto dedicato `CRON_SECRET` (almeno 32 caratteri, es. `openssl rand -hex 32`), non più con la chiave service_role. Pubblicale con "Verify JWT" disattivato (il controllo lo fa il segreto).
