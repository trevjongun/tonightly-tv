// Compila questi valori (vedi LEGGIMI.md). Lascia vuoti i campi Supabase per la modalità locale.
window.CONFIG = {
  // Nome dell'app: compare in tutta l'interfaccia e nelle pagine legali (per l'icona di installazione modifica anche manifest.webmanifest).
  APP_NAME: "Tonightly",
  TMDB_KEY: "b71eb05586a77a1e83f5f100b6ce271b",
  SUPABASE_URL: "https://dhbydbyrmjdehquygrmc.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYnlkYnlybWpkZWhxdXlncm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMzY4NDYsImV4cCI6MjEwODcxMjg0Nn0.stDNFybL08dT4j7vwcurqUgfS1tqHqsUjxj2J_LdaiE",
  REGION: "IT",
  // Chiave pubblica per le notifiche push (la privata sta nel Vault di Supabase).
  VAPID_PUBLIC: "BOvdrIRpbQxUV-8xFDDh_8vGFJsrdwU_cYWo8DWy4AZ_eBl-rjhBWYWcDkgUV591JBN-M5L3wLkxdqHrSSk9FMQ",
  // Ordine dei servizi (ID TMDB), dal più diffuso al meno. È una stima: modificala se vuoi.
  PROV_ORDER: [8, 119, 337, 39, 531, 1899, 350, 359, 222],
  // Link di ricerca per servizio (id TMDB -> URL con {q}). Facoltativo: se manca si usa la ricerca di JustWatch.
  SVC_SEARCH: {},
  // Prima di pubblicare sugli store: scarica il logo ufficiale TMDB da themoviedb.org/about/logos-attribution, mettilo nella cartella e scrivi qui il nome del file (es. "tmdb-logo.svg").
  TMDB_LOGO: "",
  // Dati del titolare del trattamento: compaiono nelle pagine Privacy, Termini e Cookie.
  LEGAL_NAME: "Niko Trevisan",      // nome e cognome (o ragione sociale)
  LEGAL_EMAIL: "trevisanniko@gmail.com",     // email per le richieste privacy
  LEGAL_ADDRESS: "Badia Polesine (RO)"    // indirizzo o città di residenza/sede
};
