# RandMU Technical Breakdown

A detailed walkthrough of every individual part of the RandMU codebase: what it does, how it works internally, and how it connects to the rest of the system.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Backend](#3-backend)
   - 3.1 [Types (`types.ts`)](#31-types)
   - 3.2 [Database (`db.ts`)](#32-database)
   - 3.3 [Library (`library.ts`)](#33-library)
   - 3.4 [Payments (`payments.ts`)](#34-payments)
   - 3.5 [Server (`server.ts`)](#35-server--api-routes)
   - 3.6 [Seed Data (`seedData.ts`)](#36-seed-data)
   - 3.7 [Seed Script (`seed.ts`)](#37-seed-script)
   - 3.8 [Catalogue Store (`catalogStore.ts`)](#38-catalogue-store)
   - 3.9 [Description Store (`descriptionStore.ts`)](#39-description-store)
   - 3.10 [LLM Client (`llm.ts`)](#310-llm-client)
   - 3.11 [Grounding / RAG (`grounding.ts`)](#311-grounding--rag)
   - 3.12 [Description Orchestrator (`descriptions.ts`)](#312-description-orchestrator)
   - 3.13 [Background Worker (`worker.ts`)](#313-background-worker)
   - 3.14 [Ingestion Pipeline (`ingest.ts`)](#314-ingestion-pipeline)
   - 3.15 [Ingest Seeds (`ingestSeeds.ts`)](#315-ingest-seeds)
   - 3.16 [Harvest CLI (`harvest.ts`)](#316-harvest-cli)
4. [Backend Sources](#4-backend-sources-backendsrcsources)
   - 4.1 [Source Types (`types.ts`)](#41-source-types)
   - 4.2 [HTTP Helper (`http.ts`)](#42-http-helper)
   - 4.3 [Reference Data (`refdata.ts`)](#43-reference-data)
   - 4.4 [Context / Description Templates (`context.ts`)](#44-context--description-templates)
   - 4.5 [MusicBrainz Harvester (`musicbrainz.ts`)](#45-musicbrainz-harvester)
   - 4.6 [Wikidata Harvester (`wikidata.ts`)](#46-wikidata-harvester)
   - 4.7 [Reddit Harvester (`reddit.ts`)](#47-reddit-harvester)
   - 4.8 [Source Aggregator (`index.ts`)](#48-source-aggregator)
5. [Frontend](#5-frontend-web)
   - 5.1 [Entry Point (`main.tsx`)](#51-entry-point)
   - 5.2 [App Shell (`App.tsx`)](#52-app-shell)
   - 5.3 [API Client (`api.ts`)](#53-api-client)
   - 5.4 [Types (`types.ts`)](#54-types)
   - 5.5 [Internationalisation (`i18n.tsx`)](#55-internationalisation)
   - 5.6 [iDEAL Modal (`IdealModal.tsx`)](#56-ideal-modal)
   - 5.7 [Song Card (`SongCard.tsx`)](#57-song-card)
   - 5.8 [Spotify Player (`SpotifyPlayer.tsx`)](#58-spotify-player)
   - 5.9 [Rating Slider (`RatingSlider.tsx`)](#59-rating-slider)
   - 5.10 [World Map (`WorldMap.tsx`)](#510-world-map)
   - 5.11 [Country Mini Map (`CountryMiniMap.tsx`)](#511-country-mini-map)
   - 5.12 [Centroids (`centroids.ts`)](#512-centroids)
   - 5.13 [Vite Configuration (`vite.config.ts`)](#513-vite-configuration)
6. [Infrastructure](#6-infrastructure)
   - 6.1 [Dockerfile](#61-dockerfile)
   - 6.2 [Render Deployment (`render.yaml`)](#62-render-deployment)
7. [Data Flow Diagrams](#7-data-flow-diagrams)

---

## 1. Project Overview

RandMU is a music discovery platform that surfaces non-Western-centric tracks through a mock iDEAL payment flow. Users pay a simulated EUR 0.10 and receive a random song from a curated catalogue spanning 270+ countries, 130+ languages, and 12 broad genre families. Each recommendation includes metadata (country, language, genre), multi-paragraph editorial descriptions, artist/album imagery, and an embedded Spotify player.

**Key technologies:** TypeScript, React 18, Node.js, Express, SQLite (better-sqlite3), Vite, Spotify Web API, MusicBrainz API, Wikidata SPARQL, LLMs (Anthropic Claude, OpenAI, OpenRouter free models, Ollama local).

---

## 2. Repository Structure

```
RandMU/
├── backend/
│   ├── package.json              # Node/Express backend
│   ├── tsconfig.json
│   ├── data/
│   │   ├── catalog.ndjson.gz     # Resolved Spotify catalogue (committed, gzipped NDJSON)
│   │   ├── candidates.ndjson     # Harvested raw candidates (committed, plain NDJSON)
│   │   └── descriptions.ndjson   # Durable LLM description overlay (committed, plain NDJSON)
│   └── src/
│       ├── server.ts             # Express API server
│       ├── db.ts                 # SQLite schema + migrations
│       ├── types.ts              # Shared TypeScript interfaces
│       ├── library.ts            # Song CRUD + ratings + stats queries
│       ├── payments.ts           # Mock iDEAL payment logic
│       ├── seed.ts               # DB seeder (loads seeds + catalogue)
│       ├── seedData.ts           # 51 hand-curated seed songs with descriptions
│       ├── catalogStore.ts       # Read/write catalog.ndjson.gz
│       ├── descriptionStore.ts   # Read/write descriptions.ndjson overlay
│       ├── descriptions.ts       # Orchestrates LLM description generation
│       ├── llm.ts                # Provider-agnostic LLM client
│       ├── grounding.ts          # RAG: Wikipedia + MusicBrainz fact-finding
│       ├── worker.ts             # Background description pre-generator
│       ├── ingest.ts             # Spotify ingestion pipeline (multi-mode)
│       ├── ingestSeeds.ts        # Genre queries, markets, country queries for Spotify search
│       ├── harvest.ts            # CLI: harvest candidates from open sources
│       └── sources/
│           ├── index.ts          # Source aggregator + de-duplication
│           ├── types.ts          # Candidate interface
│           ├── http.ts           # Throttled HTTP/JSON helper
│           ├── refdata.ts        # 150+ countries, 170+ genres (reference data)
│           ├── context.ts        # Genre/country context + template description generators
│           ├── musicbrainz.ts    # MusicBrainz artist/recording harvester
│           ├── wikidata.ts       # Wikidata SPARQL harvester
│           └── reddit.ts         # Reddit subreddit harvester (opt-in)
├── web/
│   ├── package.json              # React/Vite frontend
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx              # React root + LanguageProvider
│       ├── App.tsx               # App shell: state machine (idle/paying/revealing/result)
│       ├── api.ts                # Typed fetch wrapper for all API endpoints
│       ├── types.ts              # Song, Payment, Stats interfaces (mirrors backend)
│       ├── i18n.tsx              # EN/NL internationalisation via React context
│       ├── index.css             # Styles
│       └── components/
│           ├── IdealModal.tsx    # Mock iDEAL bank-selection + payment flow
│           ├── SongCard.tsx      # Full song reveal card with all metadata
│           ├── SpotifyPlayer.tsx # Spotify oEmbed iframe or search fallback
│           ├── RatingSlider.tsx  # 0-10 rating with community comparison
│           ├── WorldMap.tsx      # SVG dot-map of catalogue countries
│           ├── CountryMiniMap.tsx# Zoomed mini-map on song card showing origin
│           └── centroids.ts     # Country name -> [lon, lat] lookup table
├── Dockerfile                    # Multi-stage build (frontend + backend)
├── render.yaml                   # Render.com deployment config
└── docs/
    └── HOW_IT_WORKS.md           # High-level system overview
```

---

## 3. Backend

### 3.1 Types

**File:** `backend/src/types.ts`

Defines the two core domain interfaces shared across the backend:

**`Song`** — the full shape of a library entry as returned by the API:
- Identity: `id` (UUID), `title`, `artist`
- Prose: `artistDescription`, `songDescription`, `albumDescription` (multi-paragraph editorial text)
- Metadata: `country`, `language`, `genre`, `subgenre`, `albumName`, `albumType` (`"album"` | `"ep"` | `"single"` | `null`), `year`
- Spotify: `spotifyTrackId`, `spotifyUrl`, `artistImageUrl`, `albumImageUrl`
- Community: `ratingAverage` (0-10 float, null if unrated), `ratingCount`
- Provenance: `descriptionSource` — `"curated"` (hand-written seed), `"template"` (metadata-generated), or `"llm"` (model-written)

**`Payment`** — a mock iDEAL payment record:
- `id` (UUID), `amountCents`, `currency` (`"EUR"`), `method` (`"ideal"`)
- `status`: `"pending"` | `"paid"` | `"expired"` | `"failed"`
- `songId` — foreign key to the song drawn on confirmation
- `createdAt`, `paidAt` (ISO timestamps)

### 3.2 Database

**File:** `backend/src/db.ts`

Creates and configures the SQLite database using `better-sqlite3`:

**Initialisation:**
- Opens `randmu.db` in the `backend/` directory (overridable via `RANDMU_DB_PATH` env var).
- Sets `journal_mode = WAL` for concurrent read/write performance.
- Creates two tables via `CREATE TABLE IF NOT EXISTS`:
  - **`songs`** — all 17 Song columns in snake_case, plus `rating_sum` and `rating_count` for incremental rating math. The `spotify_track_id` column has a `UNIQUE` index for de-duplication. Indexes on `country` and `genre` for filtered queries.
  - **`payments`** — all Payment columns with a foreign key from `song_id` to `songs.id`.

**Lightweight migrations:**
- On startup, inspects existing columns via `PRAGMA table_info(songs)`.
- Runs `ALTER TABLE ... ADD COLUMN` for columns added after the initial schema (`artist_image_url`, `album_image_url`, `rating_sum`, `rating_count`, `description_source`).
- This means older DB files created before these columns existed are silently upgraded without data loss.

The `db` object is exported as a singleton used by all other modules.

### 3.3 Library

**File:** `backend/src/library.ts`

The data-access layer for the `songs` table. All functions operate synchronously via `better-sqlite3`'s sync API:

**Row mapping:**
- `rowToSong(row)` converts a snake_case DB row into a camelCase `Song` object. Computes `ratingAverage` on-the-fly as `rating_sum / rating_count` (or `null` if `rating_count === 0`).

**Query functions:**
- `getRandomSong()` — `SELECT * FROM songs ORDER BY RANDOM() LIMIT 1`. Used to draw a song when a payment is confirmed.
- `getSongById(id)` — exact lookup by UUID.
- `getNextTemplateSong()` — returns one random song where `description_source = 'template'`. Used by the background worker to find the next song needing LLM upgrade.
- `countBySource()` — `GROUP BY description_source`, returns `{ curated: N, template: N, llm: N }`.
- `getStats()` — aggregate counts: total songs, distinct countries, genres, languages.
- `getCountryStats()` — `GROUP BY country ORDER BY count DESC`, returns `[{ country, count }]` for the world map.

**Mutation functions:**
- `rateSong(id, value)` — atomically increments `rating_sum` and `rating_count` in a single UPDATE, then reads back the new average. Returns `{ average, count }`.
- `setSongDescriptions(id, descriptions)` — updates `song_description`, `artist_description`, `album_description` and sets `description_source = 'llm'`.
- `seedRatingBaselines()` — gives every un-rated song (`rating_count = 0`) a randomised "community baseline" (12-252 ratings with an average between 5.4 and 8.6) so the rating comparison UI always has something to show. Idempotent; runs in a transaction for speed.

### 3.4 Payments

**File:** `backend/src/payments.ts`

Implements the mock iDEAL payment lifecycle:

- **`PRICE_CENTS = 10`** — the EUR 0.10 price, exported for the stats endpoint.
- **`createPayment()`** — inserts a row with `status = 'pending'`, EUR 0.10, method `ideal`, timestamped `created_at`. Returns the Payment object.
- **`confirmPayment(id)`** — simulates a successful bank redirect. If the payment is `pending`:
  1. Calls `getRandomSong()` to draw a random song from the library.
  2. Updates the payment to `status = 'paid'`, sets `paid_at` and pins the `song_id`.
  3. If already `paid`, returns the existing payment (idempotent). If `failed`/`expired`, returns as-is.
- **`failPayment(id)`** — sets `status = 'failed'` if currently `pending`.
- **`getPayment(id)`** — lookup by UUID.
- **`getPaymentSong(id)`** — returns the linked Song only if the payment is `paid` and has a `songId`.

The design is structured so a real payment provider (e.g. Mollie) can replace `createPayment`/`confirmPayment` with webhook-driven logic without touching the frontend.

### 3.5 Server / API Routes

**File:** `backend/src/server.ts`

The Express HTTP server — the single runtime entry point for the backend.

**Setup:**
- CORS enabled globally.
- JSON body parsing.
- Port defaults to `4000` (overridable via `PORT`).

**Routes:**

| Method | Path | Handler |
|--------|------|---------|
| `GET` | `/api/health` | Returns `{ ok: true }` |
| `GET` | `/api/stats` | Returns library counts (total, countries, genres, languages) + `priceCents` |
| `GET` | `/api/countries` | Returns country-by-count array for the world map |
| `POST` | `/api/payments` | Creates a pending payment, returns it |
| `GET` | `/api/payments/:id` | Returns payment + song (if paid) |
| `POST` | `/api/payments/:id/confirm` | Mock bank approval; draws random song |
| `POST` | `/api/payments/:id/fail` | Mock cancellation |
| `POST` | `/api/songs/:id/rate` | Accepts `{ value: 0-10 }`, validates, records rating |
| `GET` | `/api/recommendation/:paymentId` | The reveal endpoint: returns the payment's song with LLM-upgraded descriptions |

**The reveal endpoint (`/api/recommendation/:paymentId`)** is the most complex:
1. Looks up the payment's song via `getPaymentSong()`.
2. Returns `402 Payment Required` if unpaid.
3. Calls `ensureSongDescribed(song)` which triggers on-demand LLM description generation (if the song is still on template text).
4. Returns the fully-described Song.

**Startup sequence (`main()`):**
1. `await initLlm()` — probes whether Ollama is running locally.
2. Starts the HTTP listener.
3. Logs library stats and LLM availability.
4. `startDescriptionWorker()` — launches the background pre-generation loop.

**Static file serving:** If `web/dist/` exists (production build), serves it as static files with SPA fallback (any non-`/api` route serves `index.html`).

### 3.6 Seed Data

**File:** `backend/src/seedData.ts`

Contains **51 hand-curated seed songs** as a TypeScript array. Each song has:
- Accurate metadata (title, artist, country, language, genre, subgenre, album, year)
- Multi-paragraph, hand-written `artistDescription`, `songDescription`, and `albumDescription`
- Real research: career context, cultural significance, historical facts

Examples include Mory Kante's "Yeke Yeke" (Guinea, Mande/Afro-pop), Cesaria Evora's "Sodade" (Cape Verde, Morna), Fela Kuti's "Zombie" (Nigeria, Afrobeat), Ravi Shankar's Sitar music (India, Hindustani), and 47 others spanning every major world region.

The `SeedSong` type omits runtime-only fields (id, Spotify IDs, images, ratings, descriptionSource) — those are filled in by `seed.ts` and `ingest.ts`.

### 3.7 Seed Script

**File:** `backend/src/seed.ts`

Run via `npm run seed`. Rebuilds the SQLite database from committed data files:

**Step 1 — Insert curated seeds:**
- The 51 songs from `seedData.ts` are inserted with `description_source = 'curated'`, a generated UUID, and a Spotify search URL as a fallback link.
- Runs in a transaction for atomicity.

**Step 2 — Load the resolved catalogue:**
- Reads `catalog.ndjson.gz` via `readCatalog()`.
- For each catalogue song, checks the **description overlay** (`descriptions.ndjson`): if a previously-generated LLM description exists for that song (matched by Spotify track ID), it is applied and the song is marked `description_source = 'llm'`; otherwise it enters as `'template'`.
- Uses `ON CONFLICT(spotify_track_id) DO NOTHING` to prevent duplicates.
- Logs how many overlay descriptions were restored.

**Step 3 — Seed rating baselines:**
- Calls `seedRatingBaselines()` to give every un-rated song a randomised community score.

**Idempotency:** If songs already exist in the DB, the script logs the count and skips unless `--force` is passed.

### 3.8 Catalogue Store

**File:** `backend/src/catalogStore.ts`

Manages the persistent, committed catalogue file at `backend/data/catalog.ndjson.gz`:

**`CatalogSong` interface** — mirrors the `songs` table columns in camelCase (without rating/descriptionSource fields). This is the on-disk representation of a resolved Spotify track.

**`readCatalog()`** — reads and gunzips `catalog.ndjson.gz`, parses each line as JSON, returns an array of `CatalogSong`. Returns empty array if file doesn't exist.

**`writeCatalog(songs)`** — serialises songs as newline-delimited JSON, gzip-compresses, and writes atomically to `catalog.ndjson.gz`. Creates the `data/` directory if needed.

The gzip compression reduces a ~5MB NDJSON file to ~500KB, making it practical to commit to git.

### 3.9 Description Store

**File:** `backend/src/descriptionStore.ts`

A durable NDJSON overlay that makes LLM-generated descriptions survive DB rebuilds:

**Problem:** The SQLite DB is gitignored and rebuilt by `npm run seed`. Without persistence, every previously-generated description would be lost and need re-generation (expensive LLM calls).

**Solution:** Every generated description is appended to `backend/data/descriptions.ndjson` (committed to git). When `seed.ts` rebuilds the DB, it reads this file and pre-applies the cached descriptions.

**`StoredDescription`** — contains:
- `key` — stable identifier (see below)
- `songDescription`, `artistDescription`, `albumDescription` — the generated text
- `model` — which model produced it (e.g. `"openai/gpt-4o"`, `"ollama:qwen2.5:3b-instruct"`)
- `generatedAt` — ISO timestamp

**`descriptionKey(opts)`** — produces a stable key for de-duplication:
- If the song has a `spotifyTrackId`: `"sp:{trackId}"`
- Otherwise: `"at:{normalized_artist}|{normalized_title}"`

**`loadDescriptionOverlay()`** — reads the file into a `Map<key, StoredDescription>`. Last-write-wins for duplicate keys. Tolerates malformed lines.

**`recordDescription(d)`** — appends one JSON line to the file. Called after every successful generation.

### 3.10 LLM Client

**File:** `backend/src/llm.ts`

A provider-agnostic LLM client that generates unique, story-driven "liner notes" for songs. No SDK dependencies; raw `fetch` to HTTP APIs.

**Provider resolution (`resolveProvider()`):**
1. Check `LLM_PROVIDER` env var for forced selection.
2. Auto-detect: `ANTHROPIC_API_KEY` present -> `"anthropic"`; `OPENAI_API_KEY` starting with `sk-or-` -> `"openrouter"`; other `OPENAI_API_KEY` -> `"openai"`.
3. If no key at all -> `null` (remote unavailable).

**Model selection (`modelsFor(provider)`):**
- Overridable via `LLM_MODEL` (comma-separated).
- Defaults: Anthropic -> `claude-3-5-sonnet-latest`; OpenAI -> `gpt-4o`; OpenRouter -> a list of 4 free models tried in sequence.

**Local fallback (Ollama):**
- `initLlm()` probes `http://localhost:11434/api/tags` at startup to detect local Ollama.
- Default model: `qwen2.5:3b-instruct` (small, fast, free).
- Used as last resort when all remote models fail, or first when `preferLocal` is set.

**Prompt engineering:**
- System prompt: poses as a "knowledgeable world-music journalist writing liner notes for RandMU".
- User prompt: provides track metadata as JSON + optional grounding facts, asks for a JSON response with three keys (`songDescription`, `artistDescription`, `albumDescription`).
- Accuracy rules: must only state facts it's confident about; must not fabricate; must fall back to genre/region/era truths when the specific artist is unknown.
- Requests `response_format: { type: "json_object" }` for structured output.
- Max tokens capped at 1500 to control cost.

**Provider-specific calls:**
- `callOpenAICompatible(provider, input, grounding, signal)` — works for both OpenAI and OpenRouter (same chat-completions shape). Tries each model in the list; on 429 from one model, falls through to the next.
- `callAnthropic(input, grounding, signal)` — uses Anthropic's Messages API with `anthropic-version: 2023-06-01`.
- `callOllama(input, grounding, signal)` — hits Ollama's OpenAI-compatible `/v1/chat/completions` endpoint. Retries up to `OLLAMA_ATTEMPTS` (default 3), rejecting "weak" results (too short or just echoing the title).

**Response parsing (`extractJson`):**
- Extracts the first `{...}` from the response text (models sometimes prefix with reasoning).
- Validates that `songDescription` and `artistDescription` are non-empty strings.

**Verification pass (`verify`):**
- Scans generated text for specific years (e.g. "1987", "2003") not backed by the song's metadata year or grounding facts.
- Drops sentences containing unsupported years (the most common hallucination on small models).
- Decade references ("1970s") are left untouched.
- If stripping reduces word count below threshold (30 for song, 25 for artist), the generation is rejected entirely.

**Top-level `generateDescriptions(input, grounding, opts)`:**
- Each phase (remote, local) gets its own abort timeout (default 60s each) so a remote timeout never starves the local fallback.
- Order: remote-first by default; local-first when `opts.preferLocal` is set (used by the background worker for throughput).
- Returns `null` on complete failure so callers can fall back to existing text.

### 3.11 Grounding / RAG

**File:** `backend/src/grounding.ts`

Fetches verified facts about an artist/song from free, credential-less sources before calling the LLM. This is a lightweight RAG (Retrieval-Augmented Generation) system.

**`gatherGrounding(input: FactInput)`** runs three lookups in parallel:

1. **Wikipedia artist summary (`wikipediaArtist`):**
   - Searches Wikipedia for `"{artist} {country} musician"`.
   - Validates the result: must mention a music-related word (singer, songwriter, band, etc.); must mention the artist's name; must not be a disambiguation page or a non-musical topic (award, festival, province, etc.).
   - Returns up to 600 chars of the article extract.

2. **MusicBrainz artist record (`musicbrainzArtist`):**
   - Searches the MusicBrainz API for the artist name.
   - Picks the highest-scoring match (>=90) that passes a country-consistency check (guards against same-name artists from different countries).
   - Extracts structured data: type (solo artist/group), area, life-span begin year, disambiguation note, top tags.
   - Returns a formatted summary string like `"solo artist; from Mali; born/active from 1968; tags: afrobeat, funk"`.

3. **Wikipedia song summary (`wikipediaSong`):**
   - Searches for `"{title} {artist} song"`.
   - Validates: must mention "song", "single", "track", "album", or "recording"; must mention the artist.
   - Returns up to 500 chars.

**Country consistency check (`countryConsistent`):**
- Guards against false positives when multiple artists share a name.
- Compares the song's country against the MusicBrainz artist's country/area.
- Only rejects on a clear country-vs-country mismatch; if the candidate has no country info, allows it through.

**Output:**
- `Grounding.text` — formatted fact block injected into the LLM prompt (e.g. `"- Artist (Wikipedia): Fela Kuti was a Nigerian multi-instrumentalist..."`).
- `Grounding.years` — all years extracted from the fact text. Used by `llm.ts`'s verification pass to whitelist trustworthy years.
- `Grounding.sources` — which sources contributed (`["wikipedia", "musicbrainz"]`).
- Returns `null` when no trustworthy facts were found.

### 3.12 Description Orchestrator

**File:** `backend/src/descriptions.ts`

Ties together grounding, LLM generation, DB persistence, and overlay persistence into a single flow:

**`ensureSongDescribed(song)`** — the entry point called by the reveal API:
1. Checks if the song needs generation (`descriptionSource` is not `curated` or `llm`).
2. De-duplicates concurrent requests: if a generation for the same song ID is already in-flight, returns the same promise (avoids double-generating when two users reveal the same song simultaneously).
3. Delegates to `describeSong()`.

**`describeSong(song, opts)`** — the core generation pipeline:
1. Calls `gatherGrounding()` to fetch Wikipedia/MusicBrainz facts.
2. Calls `generateDescriptions()` from `llm.ts` with the song metadata + grounding.
3. If generation succeeds:
   - Writes to the DB via `setSongDescriptions()` (marks `description_source = 'llm'`).
   - Appends to the durable overlay via `recordDescription()`.
   - Re-fetches the song from the DB to return the fully-updated object.
4. If generation fails (all models unavailable or verification failed), returns the song unchanged (template text is still served).

### 3.13 Background Worker

**File:** `backend/src/worker.ts`

A long-running background loop that pre-generates LLM descriptions for all template-sourced songs, so reveals become instant:

**Startup:** `startDescriptionWorker()` is called once at server boot. Guards against double-start. Skips if `DESCRIPTION_WORKER=off` or no LLM is available.

**Loop:**
1. Waits 5 seconds after startup for the server to settle.
2. Picks one random template-sourced song via `getNextTemplateSong()`.
3. If no template songs remain, idles for 10 minutes (`WORKER_IDLE_MS`) then re-checks.
4. Calls `describeSong(song, { preferLocal: true })` — prefers the local Ollama model for throughput (fast, free, unlimited).
5. On success: logs the song, resets backoff to `BASE_DELAY_MS` (12 seconds), sleeps 12 seconds.
6. On failure: exponential backoff (doubles each time, capped at `MAX_BACKOFF_MS` = 5 minutes). This usually means every free model is temporarily rate-limited.
7. Repeats forever. Never throws into the server.

**Configuration env vars:**
- `WORKER_DELAY_MS` — base delay between songs (default 12s)
- `WORKER_MAX_BACKOFF_MS` — max backoff on failure (default 5 min)
- `WORKER_IDLE_MS` — idle re-scan interval when all songs are done (default 10 min)

### 3.14 Ingestion Pipeline

**File:** `backend/src/ingest.ts`

The largest file in the codebase (~974 lines). Resolves harvested candidates and other sources into playable Spotify-linked songs. Supports multiple modes selectable via CLI flags:

**Spotify authentication:**
- Uses the Client Credentials flow (no user login). Sends Base64-encoded `client_id:client_secret` to `https://accounts.spotify.com/api/token`.
- Token is cached in memory and refreshed 30 seconds before expiry.
- Requires `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` env vars.

**Rate-limiting and hardening:**
- `MIN_GAP_MS` (default 250ms, tunable via `SPOTIFY_MIN_GAP_MS`) — minimum time between any two Spotify API calls.
- On HTTP 429: reads `retry-after` header. If retry > `MAX_RETRY_AFTER_S` (60 seconds), throws `RateLimitedError` to abort cleanly rather than wait 24 hours. Otherwise sleeps and retries.
- On HTTP 401: clears the cached token and retries (token may have expired).
- Maximum 5 retries per request.
- `searchCap` auto-adjusts: starts at 50, halves on "Invalid limit" errors (some app tiers reject large limits).

**`RateLimitedError`** — custom error class. When caught at the top level, prints a user-friendly message ("Spotify rate-limited; retry-after ~86069s (~24h). Try again later.") and exits with code 2. Already-saved progress is preserved.

**Shared helpers:**
- `pickImage(images)` — from Spotify's image array, prefers a medium-sized image (~200-400px width) for the card UI.
- `deriveGenre(genres)` — maps Spotify's granular genre tags (e.g. "ethiopian hip hop") to one of 11 broad buckets (Jazz, Hip-Hop, Classical, Folk, Rock, Electronic, Latin, African, Pop, Soul/R&B, Reggae) with "World" as fallback. The first raw tag becomes the `subgenre`.
- `makeDescriptions(track, opts)` — builds template descriptions via the `context.ts` functions. These are the initial "placeholder" texts before LLM upgrade.
- `normName(s)` — NFD-normalizes, lowercases, strips diacritics and non-alphanumeric characters. Used for fuzzy artist name matching.

**Mode 1: `--resolve` (Resolve seed songs)**
- Finds songs in the DB with `spotify_track_id IS NULL`.
- For each, searches Spotify for `"${title} ${cleanArtist}"` (strips features/separators from artist name).
- Updates the DB row with the resolved track ID, Spotify URL, artist image, and album image.

**Mode 2: `--from-candidates` (Resolve harvested candidates)**
The primary catalogue-growth mode. Processes the candidates from `candidates.ndjson`:

1. **Resume:** Reads existing catalogue from `catalog.ndjson.gz` into a Map keyed by Spotify track ID. Builds a set of already-resolved artist names and artist+title pairs.
2. **Interleaving:** `interleaveByCountry()` reorders candidates round-robin across countries so partial runs (stopped by rate limits) still achieve geographic diversity. Within each country, candidates with a song title are tried first (higher match rate than artist-only).
3. **Candidate resolution:** For each candidate:
   - Skips if the artist (or artist+title) is already covered.
   - Calls `resolveCandidateTracks()` which searches Spotify in the candidate's market, fuzzy-matches artist names, de-dupes by title.
   - For each resolved track, calls `buildCatalogSong()` to fetch artist details (genres, image) and build the full `CatalogSong`.
   - Inserts into both the in-memory Map and the SQLite DB.
4. **Periodic flush:** Every 200 candidates, writes the catalogue to disk and logs progress.
5. **Final flush:** Always writes the catalogue in a `finally` block, ensuring progress is saved even on rate-limit abort.

**Mode 3: `--from-playlists` (Bulk playlist harvest)**
50-100x more efficient than individual searches:
1. Iterates through `PLAYLIST_MARKETS` (40 countries).
2. For each market, fetches featured playlists and playlists from 5 rotating categories (`PLAYLIST_CATEGORIES`).
3. For each playlist, fetches up to 100 tracks in a single API call.
4. For fresh tracks (not already in catalogue), fetches artist details and builds catalogue songs.
5. Flushes every 5 playlists.

**Mode 4: `--from-musicbrainz` (MusicBrainz + ISRC hybrid)**
Near-100% Spotify hit rate per API call:
1. Queries MusicBrainz for artists by country (free, 1 req/s).
2. For each artist, gets recordings with ISRCs (International Standard Recording Codes).
3. Searches Spotify by `isrc:{ISRC}` — near-guaranteed 1:1 match.
4. The expensive Spotify calls are only used for confirmed real tracks.

**Mode 5: `--catalog` (Direct Spotify search)**
The original simple approach:
1. Combines genre queries, market-specific queries, and country-specific queries from `ingestSeeds.ts`.
2. Shuffles for diversity.
3. Searches Spotify directly, filters out already-seen tracks, fetches artist details.

**CLI flags:**
- `--target N` — stop when catalogue reaches N songs (default 10000).
- `--tracks-per-artist N` — max tracks per artist-only candidate (default 3).
- Modes can be combined.

### 3.15 Ingest Seeds

**File:** `backend/src/ingestSeeds.ts`

Reference data for the Spotify ingestion pipeline. Three exported arrays:

**`GENRE_QUERIES`** (90+ entries) — broad genre/style search terms:
- African: `"afrobeat"`, `"amapiano"`, `"highlife"`, `"soukous"`, `"mbalax"`, ...
- South Asian: `"qawwali"`, `"ghazal"`, `"bhangra"`, `"bollywood"`, ...
- East Asian: `"cpop"`, `"mandopop"`, `"cantopop"`, `"kpop"`, `"jpop"`, `"city pop"`, ...
- Latin: `"samba"`, `"bossa nova"`, `"cumbia"`, `"tango"`, `"reggaeton"`, ...
- European: `"fado"`, `"flamenco"`, `"rebetiko"`, `"klezmer"`, ...
- Oceanic/global: `"hawaiian"`, `"polynesian"`, `"world jazz"`, ...

**`MARKETS`** (80+ entries) — Spotify market codes (ISO 3166-1 alpha-2) spanning every inhabited region.

**`COUNTRY_QUERIES`** (80+ entries) — country-specific searches like:
- `{ query: "afrobeats naija", market: "NG", country: "Nigeria" }`
- `{ query: "fado", market: "PT", country: "Portugal" }`
- `{ query: "mongolian folk", market: "MN", country: "Mongolia" }`

These ensure the recommendation carries an accurate `country` tag and surfaces genuinely local repertoire rather than just whatever is globally popular.

### 3.16 Harvest CLI

**File:** `backend/src/harvest.ts`

Run via `npm run harvest`. Orchestrates candidate collection from all open sources:

1. Parses CLI arguments for tunable parameters (artists per country, recordings per artist, max artists, etc.).
2. Calls `harvestAll()` from `sources/index.ts`, which runs MusicBrainz, Wikidata, and Reddit harvesters in sequence.
3. Writes deduplicated candidates to `backend/data/candidates.ndjson`.
4. Prints summary statistics: distinct countries, genres, languages, sources, and how many candidates have a song title vs. artist-only.

---

## 4. Backend Sources (`backend/src/sources/`)

### 4.1 Source Types

**File:** `sources/types.ts`

**`Candidate`** — a raw song/artist pair harvested from an open data source:
- `artist` — artist name
- `title` — song title (null for artist-only candidates from Wikidata)
- `country` — display name (e.g. "Mali")
- `countryCode` — ISO 3166-1 alpha-2 code, reused as the Spotify market
- `language` — primary language of the music
- `genre` — genre/style tag
- `source` — `"musicbrainz"` | `"wikidata"` | `"reddit"`

**`candidateKey(c)`** — produces a normalized `"artist::title"` string for de-duplication.

### 4.2 HTTP Helper

**File:** `sources/http.ts`

A throttled, retry-capable HTTP JSON fetcher shared by all open-data harvesters:

**Per-host throttling:** Each host has a configurable minimum gap between requests:
- `musicbrainz.org`: 1300ms (their rate limit is ~1 req/s)
- `query.wikidata.org`: 1500ms
- `www.wikidata.org`: 300ms
- `en.wikipedia.org`: 250ms
- `oauth.reddit.com`: 700ms
- `www.reddit.com`: 1500ms
- Default: 500ms

**`getJson<T>(url, headers)`:**
1. Waits for the host-specific throttle gap.
2. Sends a GET request with a descriptive `User-Agent` header.
3. On HTTP 429 or 503: reads `retry-after`, sleeps (capped at 30s), retries.
4. On network error: backs off and retries.
5. Up to 5 attempts total.

### 4.3 Reference Data

**File:** `sources/refdata.ts`

Static reference tables driving the diversity of the harvest:

**`COUNTRIES`** (150+ entries) — each with:
- `code` — ISO 3166-1 alpha-2 (used as Spotify market code and MusicBrainz country filter)
- `name` — display name
- `languages` — array of primary local languages (English omitted unless it's the dominant local language)

Covers every inhabited region: Africa (55 countries), Middle East (15), Central/South Asia (17), East/Southeast Asia (19), Europe (37), Americas (26), Oceania (8).

**`GENRE_TAGS`** (170+ entries) — a wide spread of genres/styles deliberately weighted toward non-Western and regional traditions:
- African: afrobeat, amapiano, soukous, mbalax, ethio-jazz, raï, gnawa, morna, ...
- Middle Eastern: arabic pop, dabke, mizrahi, classical arabic, anatolian rock, ...
- Asian: qawwali, bhangra, dangdut, city pop, k-pop, gamelan, khmer rock, ...
- Latin: cumbia, salsa, bossa nova, tango, huayno, reggaeton, kompa, ...
- European: fado, flamenco, rebetiko, klezmer, balkan brass, sevdah, ...
- Oceanic/fusion: world fusion, global bass, island reggae, ...

**`COUNTRY_BY_CODE`** — a `Map<string, CountryRef>` for O(1) lookup by ISO code.

### 4.4 Context / Description Templates

**File:** `sources/context.ts`

Generates multi-paragraph template descriptions for harvested catalogue songs. Contains two massive dictionaries of editorial context:

**`GENRE_CONTEXT`** (~100 entries) — maps each genre tag to a one-sentence noun phrase describing its character and origin. Examples:
- `afrobeat`: "a politically charged Nigerian style pioneered in the 1970s that welds Yoruba rhythms and chant to long, horn-driven funk and jazz grooves"
- `morna`: "the melancholy national song-form of Cape Verde, a slow, bittersweet expression of longing known as sodade"
- `city pop`: "the glossy, urbane Japanese pop of the late 1970s and 80s, evoking neon nightdrives and bubble-era leisure"

**`COUNTRY_CONTEXT`** (~50 entries) — maps country names to one-sentence musical landscape descriptions. Examples:
- `Nigeria`: "Africa's most populous nation and a powerhouse of afrobeat, juju and modern afrobeats"
- `Japan`: "a nation spanning ancient min'yo folk, sentimental enka and the neon glow of city pop"

**Region tagging (`REGION_BY_CODE`)** — maps ISO country codes to broad regions ("Africa", "the Middle East", "Latin America & the Caribbean", etc.) for countries not individually in `COUNTRY_CONTEXT`.

**Template functions:**

`describeSong(input: DescInput)` — generates a 3-paragraph song description:
1. Paragraph 1: Names the track, style, artist, country, album, year, and any featured artists.
2. Paragraph 2: Pulls genre context to explain the tradition the song belongs to.
3. Paragraph 3: Adds country context, language note (if non-English), and the RandMU mission statement.

`describeArtist(input: DescInput)` — generates a 3-paragraph artist description:
1. Paragraph 1: Names the artist, country, and up to 3 genre/subgenre styles they work in.
2. Paragraph 2: Uses genre context to describe the tradition they're rooted in.
3. Paragraph 3: Country context + language note + RandMU mission statement.

`describeAlbum(input: DescInput)` — generates a 1-paragraph album description (returns null for singles).

These templates are true but generic — the LLM upgrade path replaces them with unique, fact-rich liner notes.

### 4.5 MusicBrainz Harvester

**File:** `sources/musicbrainz.ts`

The primary and most authoritative candidate source.

**How it works:**
1. Builds a queue of artist searches: one for each of the 150+ countries (`country:{ISO_CODE}`) and one for each of the 170+ genres (`tag:{genre}`).
2. For each search, fetches up to `artistsPerCountry` (default 12) or `artistsPerGenre` (default 12) artists.
3. For each unique artist (tracked by MusicBrainz ID), fetches their recordings and extracts clean song titles:
   - Requests 3x the desired recording count to have room for filtering.
   - `cleanTitles()` strips live, remix, karaoke, instrumental, demo, and duplicate versions.
4. Emits a `Candidate` for each (artist, title) pair with accurate country, genre, and language metadata.

**Country resolution:** Prefers the search context's country code, falls back to the artist's own `country` or `area.name` from MusicBrainz.

**Genre resolution:** For genre-tag searches, uses the tag. For country searches, uses the artist's own top-weighted tag.

**Language:** Derived from the country reference data (`pickLanguage`), cycling through the country's languages for variety.

**Progress logging:** Every 10 searches, logs progress (searches done, artists processed, candidates emitted).

### 4.6 Wikidata Harvester

**File:** `sources/wikidata.ts`

A SPARQL-based harvester that queries Wikidata's knowledge graph for musical performers:

**Two-step resolution:**
1. `genreQid(genre)` — resolves a genre name (e.g. "afrobeat") to its Wikidata entity ID (QID) via the `wbsearchentities` API. Prefers hits whose description mentions "music" or "genre".
2. `buildQuery(qid, limit)` — constructs a SPARQL query that finds performers whose genre property (P136) matches the QID, along with their country of origin (P495) or citizenship (P27).

**SPARQL query structure:**
```sparql
SELECT DISTINCT ?artistLabel ?countryLabel WHERE {
  ?artist wdt:P136 wd:{QID} .
  VALUES ?type { wd:Q5 wd:Q215380 wd:Q2088357 }  # person, band, duo
  ?artist wdt:P31 ?type .
  OPTIONAL { ?artist wdt:P495 ?c1 . }
  OPTIONAL { ?artist wdt:P27 ?c2 . }
  BIND(COALESCE(?c1, ?c2) AS ?country)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT {limit}
```

**Output:** Artist-only candidates (no song title) — titles are resolved later against Spotify. Country matching uses the `COUNTRIES` reference data with alias handling (e.g. "People's Republic of China" -> "China").

**Progress logging:** Every 20 genres.

### 4.7 Reddit Harvester

**File:** `sources/reddit.ts`

An optional harvester that reads music subreddits. Requires `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` (app-only OAuth); skipped gracefully if not provided.

**Subreddits (27):** Curated list of global/regional music subreddits:
- General: r/listentothis, r/worldmusic
- African: r/AfricanMusic, r/afrobeats, r/Ethiopiques
- Middle Eastern: r/arabicmusic, r/turkishmusic, r/persian_music
- South Asian: r/indianmusic, r/bollywoodmusic
- East Asian: r/citypop, r/japanesemusic, r/kpop, r/Cpop
- Southeast Asian: r/thaimusic, r/indonesia, r/vietnam
- Latin: r/latinmusic, r/cumbia, r/brasil, r/Tropicalia
- Caribbean: r/reggae
- European: r/Fado, r/flamenco, r/balkanmusic, r/greekmusic, r/klezmer, r/GypsyJazz

Each subreddit has a default genre and country tag.

**Submission parsing (`parseSubmission`):**
- Strips bracketed/parenthesised suffixes (genre tags, years).
- Removes "[Fresh]"/"[FRESH]" prefixes.
- Splits on ` - ` / ` -- ` / ` — ` to extract `artist` and `title`.
- Rejects overly long strings.

**Process:**
1. Gets an app-only OAuth token.
2. For each subreddit, fetches top-of-all-time posts (up to `postsPerSub`, default 100).
3. Skips NSFW and stickied posts.
4. Parses each submission title into (artist, title) candidates with the subreddit's genre/country context.

### 4.8 Source Aggregator

**File:** `sources/index.ts`

Orchestrates all three harvesters and manages the candidate file:

**`harvestAll(opts)`:**
1. Runs MusicBrainz harvester -> Wikidata harvester -> Reddit harvester (sequentially).
2. Merges all results.
3. De-duplicates via `dedupe()`: keyed by normalized `(artist, title)`, keeps the record with the most metadata (country + language + genre).
4. Logs the merge ratio.

**File I/O:**
- `writeCandidates(candidates)` — writes to `backend/data/candidates.ndjson` (plain NDJSON, not gzipped).
- `readCandidates()` — reads and parses the file. Called by `ingest.ts` to feed the Spotify resolve step.

---

## 5. Frontend (`web/`)

### 5.1 Entry Point

**File:** `web/src/main.tsx`

Standard React 18 entry point:
- Renders `<App />` wrapped in `<React.StrictMode>` and `<LanguageProvider>`.
- `LanguageProvider` provides the i18n context to all children.
- Imports `index.css` for global styles.

### 5.2 App Shell

**File:** `web/src/App.tsx`

The top-level component implementing a simple state machine:

**View states (`View` discriminated union):**
1. `idle` — landing page with hero section, CTA button, and world map.
2. `paying` — the iDEAL bank-selection modal is open.
3. `revealing` — spinner shown while the backend generates/fetches the song's descriptions.
4. `result` — the full SongCard is displayed.

**State flow:**
```
idle --[click "Surprise me"]--> POST /api/payments --> paying
paying --[pick bank, click pay]--> POST /api/payments/:id/confirm --> revealing
revealing --[GET /api/recommendation/:paymentId]--> result
result --[click "Get another"]--> POST /api/payments (back to paying)
```

**Stats bar:** On mount, fetches `/api/stats` and displays total songs, countries, genres, languages in the header.

**Language toggle:** `LangToggle` component renders EN/NL buttons, calling `setLang()` from the i18n context.

**Error handling:** Errors from API calls are captured in state and displayed as red text. The `onPaid` callback gracefully falls back to the song from the payment confirmation if the recommendation endpoint fails.

### 5.3 API Client

**File:** `web/src/api.ts`

A typed `fetch` wrapper for all backend endpoints:

**`req<T>(path, init?)`** — base function:
- Prepends `VITE_API_BASE` (empty in dev, since Vite proxies `/api` to port 4000).
- Sets `Content-Type: application/json`.
- On non-OK response, throws an `Error` with the status code and response body.

**Exported `api` object:**
- `stats()` — `GET /api/stats` -> `Stats`
- `countries()` — `GET /api/countries` -> `CountryStat[]`
- `createPayment()` — `POST /api/payments` -> `{ payment }`
- `confirmPayment(id)` — `POST /api/payments/:id/confirm` -> `{ payment, song }`
- `failPayment(id)` — `POST /api/payments/:id/fail` -> `{ payment }`
- `recommendation(paymentId)` — `GET /api/recommendation/:paymentId` -> `{ song }`
- `rateSong(id, value)` — `POST /api/songs/:id/rate` with `{ value }` -> `{ average, count }`

### 5.4 Types

**File:** `web/src/types.ts`

Mirrors the backend types exactly:
- `Song` — 20 fields including all metadata, Spotify IDs, images, ratings
- `Payment` — id, amount, status, songId, timestamps
- `PaymentStatus` — `"pending" | "paid" | "expired" | "failed"`
- `Stats` — total, countries, genres, languages, priceCents

### 5.5 Internationalisation

**File:** `web/src/i18n.tsx`

A lightweight i18n system supporting English (EN) and Dutch (NL):

**Architecture:**
- `LanguageProvider` — React context provider that holds the current language state.
- `useI18n()` — hook returning `{ lang, setLang, t }`.
- `t(key, vars?)` — looks up a key in the current language's dictionary, falls back to English, then to the raw key. Interpolates `{varName}` placeholders.

**Persistence:** Language preference is stored in `localStorage` under `randmu_lang`. The `<html lang="...">` attribute is updated on change.

**Dictionary coverage:** 45 keys covering all UI strings: stats bar, hero section, iDEAL modal, reveal spinner, song card, rating slider, footer, world map.

### 5.6 iDEAL Modal

**File:** `web/src/components/IdealModal.tsx`

Simulates the Dutch iDEAL bank payment flow:

**Bank list:** 10 Dutch banks (ABN AMRO, ING, Rabobank, SNS, ASN Bank, Bunq, Knab, Revolut, Triodos Bank, Van Lanschot).

**Phases:**
1. `select` — user picks a bank from a dropdown.
2. `processing` — simulates a 1.2-second bank redirect delay, then calls `api.confirmPayment()`.

**Actions:**
- **Pay:** Transitions to `processing`, waits 1.2s, calls confirm endpoint, invokes `onPaid(paymentId, song)` callback.
- **Cancel:** Calls `api.failPayment()` (best-effort), invokes `onCancel()` callback.

**UI elements:** iDEAL-branded header, amount display, mock disclaimer note, bank selector, pay/cancel buttons. All strings are i18n-ready.

### 5.7 Song Card

**File:** `web/src/components/SongCard.tsx`

The full song reveal card — the core UI of the product:

**Layout (top to bottom):**
1. **Header row:** Artist thumbnail (circular, with initial-letter fallback), song title, artist name, "Open in Spotify" link.
2. **Tags:** Country, language, genre, subgenre, year — each as a styled pill.
3. **Country mini-map:** Inline zoomed map showing the song's country of origin.
4. **Spotify player:** Embedded iframe or search fallback link.
5. **"About the song":** Multi-paragraph song description (renders `\n\n`-split text as separate `<p>` tags via the `Paragraphs` helper).
6. **"About {artist}":** Multi-paragraph artist description.
7. **Album section:** (Conditional) Album/EP label with year, album cover thumbnail (square), album description.
8. **"Get another song" button:** Triggers a new purchase flow.
9. **Rating slider:** Community rating comparison widget.

**`Thumb` component:** Renders either an `<img>` (when URL is available) or a fallback `<div>` with the first letter of the label. Supports circular (artist) and square (album) shapes.

**`albumLabel` helper:** Formats "Album: Name · Year" or "EP: Name · Year".

### 5.8 Spotify Player

**File:** `web/src/components/SpotifyPlayer.tsx`

Renders the inline Spotify player:

- **When `spotifyTrackId` is available:** Renders an `<iframe>` embedding `https://open.spotify.com/embed/track/{id}`. 152px tall, lazy-loaded, allows autoplay/clipboard/encrypted-media/fullscreen.
- **When no track ID** (seed songs before Spotify ingest): Renders a fallback link to the `spotifyUrl` (which is a Spotify search URL).

### 5.9 Rating Slider

**File:** `web/src/components/RatingSlider.tsx`

A 0-10 community rating widget with "your rating vs. average" comparison:

**Before rating:**
- Displays a range input slider (step 0.1) with a live numeric output.
- Help text: "Drag the slider and let go to see what everyone else thinks."
- On `pointerUp` or `keyUp`, submits the rating via `api.rateSong()`.

**After rating:**
- Displays a visual track with two markers:
  - **"You"** marker — positioned at the user's rating.
  - **"Average"** marker — positioned at the community average.
  - A filled bar showing the average percentage.
- Shows "Thanks for rating!" and the total rating count.

**Persistence:** Stores the user's rating per song in `localStorage` (`randmu_rating_{songId}`). On re-visit (same song drawn again), restores the previous rating and shows the comparison view directly.

### 5.10 World Map

**File:** `web/src/components/WorldMap.tsx`

An SVG dot-map visualisation on the landing page showing which countries are represented in the catalogue:

**Data:** Fetches `/api/countries` on mount, getting `[{ country, count }]`.

**Projection:** Simple equirectangular: `x = (lon + 180) / 360 * 900`, `y = (90 - lat) / 180 * 450`. Maps country names to (lon, lat) centroids via the `CENTROIDS` lookup table.

**Dot sizing:** Logarithmic scale: `r = 3 + norm * 9` where `norm = log(count+1) / log(maxCount+1)`. This prevents a single dominant country from dwarfing all others.

**Dot colour:** `interpolateColor(t)` produces a purple-to-coral gradient based on the normalised count.

**Grid:** Faint latitude/longitude lines at 30-degree intervals for geographic context.

**Interactivity:** Hover shows a tooltip with `"{Country}: {N} songs"`. Title text on each circle serves as native tooltip.

**Header:** "Music from everywhere" with subtitle showing total countries and songs.

### 5.11 Country Mini Map

**File:** `web/src/components/CountryMiniMap.tsx`

A zoomed-in SVG map shown on each SongCard, highlighting the song's country of origin:

**How it works:**
1. Looks up the country's centroid from the `CENTROIDS` table.
2. Uses the same equirectangular projection as the WorldMap but at 3x zoom (`scale = 3`), centered on the target country.
3. Calculates a viewBox window around the target.
4. Draws all nearby countries (within the viewport + 30px padding) as faint context dots.
5. Draws the target country with a pulsing ring animation (`minimap-pulse` CSS class) + a bright pink dot + a white label.

### 5.12 Centroids

**File:** `web/src/components/centroids.ts`

A static lookup table mapping country display names (as they appear in the database) to `[longitude, latitude]` pairs. Used by both `WorldMap` and `CountryMiniMap` for positioning. Contains entries for all countries in the catalogue.

### 5.13 Vite Configuration

**File:** `web/vite.config.ts`

- Uses `@vitejs/plugin-react` for React JSX/Fast Refresh support.
- Dev server on port 5173, bound to all interfaces (`host: true`).
- Proxies `/api` requests to the backend (`VITE_API_TARGET` env var, default `http://localhost:4000`).

---

## 6. Infrastructure

### 6.1 Dockerfile

Multi-stage Docker build:

**Stage 1 (`frontend`):**
- Base: `node:22-slim`
- Installs web dependencies (`npm ci`), copies web source, runs `npm run build` to produce static files in `web/dist/`.

**Stage 2 (runtime):**
- Base: `node:22-slim`
- Installs backend dependencies (`npm ci`).
- Copies backend source + data files.
- Copies `web/dist/` from Stage 1.
- **Seeds the database at build time** (`node --import tsx src/seed.ts`) so the image ships with a ready catalogue — no runtime seed step needed.
- Exposes port 4000.
- Sets `NODE_ENV=production`, `PORT=4000`, `OLLAMA_DISABLED=1` (no local model in container).
- Entrypoint: `node --import tsx src/server.ts` (tsx is the TypeScript runner).

### 6.2 Render Deployment

**File:** `render.yaml`

Deploys to Render.com as a Docker web service on the free plan:
- Service name: `randmu`
- Dockerfile path: `./Dockerfile`
- Environment variables:
  - `PORT=4000`
  - `OLLAMA_DISABLED=1`
  - `OPENAI_API_KEY` — marked `sync: false` (set manually in the Render dashboard for security)

---

## 7. Data Flow Diagrams

### User flow: "Pay and get a song"

```
User clicks "Surprise me · EUR 0.10"
    │
    ▼
POST /api/payments ──────────────────► createPayment()
    │                                      │
    │  ◄──────── { payment: pending } ─────┘
    │
    ▼
IdealModal: User picks bank, clicks Pay
    │
    ▼ (1.2s simulated delay)
    │
POST /api/payments/:id/confirm ──────► confirmPayment()
    │                                      │
    │                                      ├─ getRandomSong() → SELECT ... ORDER BY RANDOM()
    │                                      └─ UPDATE payments SET status='paid', song_id=...
    │  ◄──────── { payment: paid, song } ──┘
    │
    ▼
GET /api/recommendation/:paymentId ──► getPaymentSong()
    │                                      │
    │                                      ▼
    │                                 ensureSongDescribed()
    │                                      │
    │                         ┌─────────────┼─────────────┐
    │                         │ curated?    │ llm?        │ template?
    │                         │ return as-is│ return as-is│    │
    │                         │             │             ▼
    │                         │             │   gatherGrounding()
    │                         │             │      │
    │                         │             │      ├─ Wikipedia artist summary
    │                         │             │      ├─ MusicBrainz artist data
    │                         │             │      └─ Wikipedia song summary
    │                         │             │          │
    │                         │             │          ▼
    │                         │             │   generateDescriptions()
    │                         │             │      │
    │                         │             │      ├─ Remote LLM (Anthropic/OpenAI/OpenRouter)
    │                         │             │      └─ Local Ollama (fallback)
    │                         │             │          │
    │                         │             │          ▼
    │                         │             │   verify() (strip ungrounded years)
    │                         │             │          │
    │                         │             │          ▼
    │                         │             │   setSongDescriptions() → UPDATE songs
    │                         │             │   recordDescription() → append descriptions.ndjson
    │                         │             │          │
    │  ◄──────── { song } ───┴─────────────┴──────────┘
    │
    ▼
SongCard renders: metadata tags, mini-map, Spotify embed,
                  descriptions, album, rating slider
```

### Catalogue build flow

```
Phase 1: Harvest (no Spotify needed)
    │
    ├─ MusicBrainz: search artists by country (150+) and by genre tag (170+)
    │               fetch recordings → (artist, title, country, genre, language)
    │
    ├─ Wikidata: SPARQL query performers by genre QID
    │            → (artist, country) — no title
    │
    └─ Reddit (opt-in): parse subreddit submissions
                        → (artist, title, genre, country)
    │
    ▼
    dedupe() → candidates.ndjson (~21,000 candidates)

Phase 2: Resolve on Spotify (needs credentials)
    │
    ├─ --from-candidates: search Spotify by "title artist" or artist:"name"
    │                     match by fuzzy artist name, de-dupe by title
    │
    ├─ --from-playlists: fetch Browse/Featured playlists per market
    │                    100 tracks per API call (50-100x more efficient)
    │
    ├─ --from-musicbrainz: get ISRCs from MusicBrainz, search Spotify by ISRC
    │                      near-100% hit rate per Spotify call
    │
    └─ --catalog: direct Spotify search by genre/market/country queries
    │
    ▼
    For each resolved track:
        ├─ getArtists() → genre tags, artist image
        ├─ deriveGenre() → broad bucket + specific subgenre
        ├─ makeDescriptions() → template descriptions from context.ts
        └─ upsert into SQLite + write to catalog.ndjson.gz
```

### Description lifecycle

```
SEED SONGS (51):
    seedData.ts → seed.ts → DB (description_source = 'curated')
    Never regenerated. Human-written prose.

CATALOGUE SONGS (~2000+):
    ingest.ts → context.ts templates → catalog.ndjson.gz → seed.ts → DB (description_source = 'template')
        │
        ▼ (on first reveal OR background worker)
    grounding.ts (Wikipedia + MusicBrainz facts)
        │
        ▼
    llm.ts (remote LLM or local Ollama)
        │
        ▼
    verify() (strip ungrounded years)
        │
        ▼
    DB (description_source = 'llm') + descriptions.ndjson (durable overlay)
        │
        ▼ (on DB rebuild via npm run seed)
    descriptions.ndjson → seed.ts → DB (description_source = 'llm', pre-applied)
```
