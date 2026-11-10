// Risposte finte di TMDB per i test (nessuna rete): titoli, generi, servizi, stagioni, immagini colorate.
const TITLES = ["La città dei sogni", "Notte a Roma", "Il ladro gentile", "Orizzonti", "Cuore di ferro", "Stelle cadenti", "Il segreto del lago", "Vento d'estate", "Ultimo treno", "Casa dolce casa", "Il giardino", "Mare nostrum", "Rosso sangue", "Il codice", "Voci", "L'ultima onda", "Frammenti", "Sotto il sole", "Eclissi", "Tempesta"];
const GEN = [[10770, "Film TV"], [28, "Azione"], [35, "Commedia"], [18, "Dramma"], [878, "Fantascienza"], [27, "Horror"], [53, "Thriller"], [16, "Animazione"], [10749, "Romance"], [12, "Avventura"], [14, "Fantasy"], [9648, "Mistero"], [80, "Crime"], [10751, "Famiglia"], [99, "Documentario"]].map(([id, name]) => ({ id, name }));
const PROV = [[8, "Netflix"], [119, "Amazon Prime Video"], [337, "Disney Plus"], [1899, "Max"], [531, "Paramount Plus"]].map(([provider_id, provider_name]) => ({ provider_id, provider_name, logo_path: "/l" + provider_id + ".jpg" }));
export function item(i, m) {
  const t = TITLES[i % 20] + (i >= 20 ? " " + (Math.floor(i / 20) + 1) : "");
  const d = { id: 1000 + i, overview: "Una storia avvincente che ti tiene incollato allo schermo.", poster_path: "/p" + i + ".jpg", backdrop_path: "/b" + i + ".jpg", genre_ids: [GEN[i % 14].id, GEN[(i + 3) % 14].id], original_language: i % 3 ? "it" : "en", vote_average: 6 + (i % 30) / 10, vote_count: 900 };
  const y = "20" + String(10 + (i % 15)).padStart(2, "0") + "-05-01";
  return m === "movie" ? Object.assign(d, { title: t, release_date: y }) : Object.assign(d, { name: t, first_air_date: y });
}
export function api(url) {
  const u = new URL(url), p = u.pathname.replace(/^\/3/, ""), q = u.searchParams;
  if (/\/genre\/(movie|tv)\/list/.test(p)) return { genres: GEN };
  if (p === "/watch/providers/movie" || p === "/watch/providers/tv") return { results: PROV };
  let m;
  if ((m = p.match(/^\/discover\/(movie|tv)/))) { const pg = +(q.get("page") || 1); return { page: pg, total_pages: 20, results: Array.from({ length: 20 }, (_, i) => item((pg - 1) * 20 + i, m[1])) }; }
  if (p.startsWith("/trending")) return { results: Array.from({ length: 8 }, (_, i) => Object.assign(item(i + 4, i % 2 ? "movie" : "tv"), { media_type: i % 2 ? "movie" : "tv" })) };
  if (p.startsWith("/search/")) return { results: Array.from({ length: 5 }, (_, i) => Object.assign(item(i, "movie"), { media_type: "movie" })) };
  if ((m = p.match(/^\/(movie|tv)\/(\d+)\/season\/(\d+)/))) return { episodes: Array.from({ length: 5 }, (_, k) => ({ episode_number: k + 1, name: "Episodio " + (k + 1), air_date: "2024-0" + (k + 1) + "-10", runtime: 45, still_path: "/s" + k + ".jpg" })) };
  if ((m = p.match(/^\/(movie|tv)\/(\d+)\/recommendations/))) return { results: Array.from({ length: 8 }, (_, i) => item(+m[2] - 1000 + i + 3, m[1])) };
  if ((m = p.match(/^\/(movie|tv)\/(\d+)\/watch\/providers/))) return { results: { IT: { link: "https://example.org", flatrate: [PROV[+m[2] % 5]] } } };
  if ((m = p.match(/^\/(movie|tv)\/(\d+)$/))) {
    const i = +m[2] - 1000, d = item(i, m[1]);
    return Object.assign(d, { genres: [GEN[i % 14], GEN[(i + 3) % 14]], runtime: 110, number_of_seasons: 2, number_of_episodes: 10, episode_run_time: [45], seasons: [{ season_number: 1, episode_count: 5 }, { season_number: 2, episode_count: 5 }],
      credits: { cast: Array.from({ length: 6 }, (_, k) => ({ id: i * 10 + k, name: "Attore " + k, character: "Ruolo", profile_path: null })), crew: [{ job: "Director", id: i, name: "Regista" }] },
      videos: { results: [] }, keywords: { keywords: [] }, "watch/providers": { results: { IT: { link: "https://example.org", flatrate: [PROV[i % 5], PROV[(i + 1) % 5]] } } } });
  }
  return { results: [] };
}
export function img(url) {
  let h = 0; for (const c of url) h = (h * 31 + c.charCodeAt(0)) % 360;
  const [w, hh] = /\/p\d|w342/.test(url) ? [300, 450] : [1280, 720];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hh}"><rect width="100%" height="100%" fill="hsl(${h},55%,40%)"/></svg>`;
}
