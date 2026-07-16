# RandMU — project log & resume notes

A running log so anyone (or a fresh Devin session) can pick up work using only
what's on GitHub. For the architecture itself, read
[`HOW_IT_WORKS.md`](./HOW_IT_WORKS.md) first.

_Last updated: 2026-07-16._

---

## 1. What this project is
Pay €0,10 (mock iDEAL) → get **one random song** from a deliberately diverse,
non‑Western‑centric library. Two npm packages: `backend/` (Express + SQLite via
`better-sqlite3`) and `web/` (React + Vite). The catalogue is built offline in
two phases (harvest candidates → resolve on Spotify) and descriptions are
upgraded to grounded, LLM‑written liner notes on first reveal.

## 2. Current state (snapshot)
- **Library: ~2,672 songs** — 51 hand‑curated seeds (in `seedData.ts`) + a
  resolved catalogue (`backend/data/catalog.ndjson.gz`, ~2,362 rows) +
  descriptions overlay applied on seed.
- Diversity: ~273 countries · 137 languages · 12 broad genre buckets.
- Candidate pool: `backend/data/candidates.ndjson` (~21.5k) — plenty of runway;
  growth is gated by Spotify, not by candidates.
- Descriptions: generated on reveal, cached in `backend/data/descriptions.ndjson`
  (keyed by Spotify track id; `#<lang>` suffix for non‑English). A background
  worker pre‑generates on startup.

The SQLite DB is **gitignored** and rebuilt from committed data with
`cd backend && npm run seed`.

## 3. Branches & PRs
- `main` — production. MVP + all merged work below.
- **PR #14** — `devin/randmu-catalogue-autoresume`: the daily catalogue‑resume
  branch. Commits only `backend/data/catalog.ndjson.gz`. Keep exactly one open PR
  from this branch. **Never modify source or seed data on this branch.**
- **PR #15 (merged)** — `devin/1784242146-enrich-descriptions`: the description
  enrichment work (see §4).
- **PR #16 (merged)** — demo limited to described songs.

## 4. What PR #15 delivered (description enrichment)
Goal: gather as many trustworthy facts as possible *before* asking the model to
write, then generate grounded, verified, multilingual prose.
- **Richer grounding** (`backend/src/grounding.ts`): full Wikipedia leads
  (artist/song/album), MusicBrainz recording relations (release date, ISRC,
  credits, producers/guests/labels), Wikidata claims (genres, labels, awards,
  members, instruments, country of origin, formed/born years), plus aggregated
  entities/sources/years.
- **Acoustic profile** (`backend/src/spotifyAudio.ts`): best‑effort Spotify audio
  features → a short "what it sounds like" phrase. Degrades to `null` safely.
- **Verification** (`backend/src/llm.ts`): strips unsupported **years, awards,
  chart positions, and certifications** not backed by grounding.
- **Structured output**: strict `json_schema` (`liner_notes`), `LLM_JSON_SCHEMA=off`
  to fall back to `json_object`; **per‑model timeout** so a slow model can't
  starve fallbacks; refreshed OpenRouter free‑model list.
- **Per‑locale EN/NL** (`descriptions.ts`, `descriptionStore.ts`, `server.ts`,
  `web/src/api.ts`, `web/src/App.tsx`): reveal honors the UI language toggle via
  `?lang=nl`; Dutch cached under `#nl` keys.
- **Coverage**: ~40 world genres added to `GENRE_CONTEXT`; Reddit source refreshes
  its OAuth token on 401.

**Tested (runtime):** EN and NL reveals both produce fluent, fact‑grounded prose
end‑to‑end; backend + web typecheck and build pass. See PR #15 comment for the
recording + screenshots.

## 5. Environment / secrets
Set via org‑scoped secrets (do not hardcode):
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — catalogue ingest + (best‑effort)
  audio features. Dev‑mode apps get a ~24h rate‑limit ban after ~15 resolves.
- `OPENAI_API_KEY` — **note: this is actually an OpenRouter key** in this org, so
  the LLM client routes to OpenRouter free models. `ANTHROPIC_API_KEY` (Claude)
  and local Ollama are the other supported providers. Overridable with
  `LLM_PROVIDER` / `LLM_MODEL`.
- `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` — **optional**; the Reddit harvest
  source stays disabled without them.
- Toggles: `LLM_JSON_SCHEMA=off`, `DESCRIPTION_WORKER=off`, `SPOTIFY_MIN_GAP_MS`
  (keep ≥250), `OLLAMA_HOST`.

## 6. Known limitations / open threads
- **Spotify dev‑mode ban** caps catalogue growth at ~15 songs/run and currently
  blocks live audio‑feature testing. Bigger wins: enable `--from-playlists`
  (up to 100 tracks/call) and `--from-musicbrainz` (ISRC → near‑1:1 match).
- **Claim‑stripping is English‑centric** — the award/chart/cert keyword patterns
  are weaker for Dutch prose.
- **No future‑date filtering** — a Wikipedia lead can contain a future‑dated claim
  that isn't caught by year verification.
- **Wikidata same‑name disambiguation** is basic; can grab the wrong entity.
- **Reddit** is robustified (token refresh) but disabled without credentials.

## 7. Prioritized next steps
1. Once the Spotify ban lifts, run the catalogue resume on
   `devin/randmu-catalogue-autoresume` and, if desired, switch to
   `--from-playlists` to grow faster.
2. Live‑verify Spotify audio features feed the acoustic profile (currently only
   unit‑tested with synthetic inputs).
3. Add future‑date / current‑year sanity filtering to the verification pass.
4. Locale‑aware verification patterns (Dutch, then more locales).
5. Optionally enable Reddit by provisioning `REDDIT_CLIENT_*`.
6. Replace mock iDEAL with real Mollie integration (frontend already decoupled).

## 8. How to resume from a clean clone
```bash
git clone https://github.com/crazyninja77/RandMU.git && cd RandMU
(cd backend && npm install && npm run seed && npm start)   # API :4000
(cd web && npm install && npm run dev)                     # site :5173
```
Testing tips (reveal flow, EN/NL gotchas, slow free models) live in
`.agents/skills/testing-reveal-descriptions/SKILL.md`.
