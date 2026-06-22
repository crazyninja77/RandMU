# How RandMU works

RandMU is a website where you pay €0,10 (mock iDEAL) and get **one random song**
pulled from a deliberately diverse, non‑Western‑centric library. Every
recommendation shows: artist photo, album cover, country, language, genre,
subgenre, release year, a long artist description, a long song description, and
the album/EP — plus a Spotify link and an inline 30‑second embed player.

This document explains the whole system end to end, with extra detail on
**how the descriptions are written**, since that's a common question.

---

## 1. The big picture

```
                ┌─────────────────────────────────────────────────────┐
                │                     web/ (React + Vite)             │
                │  Landing → mock iDEAL modal → song reveal card      │
                └───────────────▲─────────────────────┬───────────────┘
                                │ JSON over HTTP       │
                ┌───────────────┴─────────────────────▼───────────────┐
                │                  backend/ (Express + SQLite)         │
                │  payments + random recommendation + song library    │
                └───────────────▲─────────────────────────────────────┘
                                │ built by
   ┌────────────────────────────┴───────────────────────────────────┐
   │  Catalogue build (two phases)                                    │
   │   Phase 1: harvest candidates  (MusicBrainz / Wikidata / Reddit) │
   │   Phase 2: resolve on Spotify  (track id, images, year, genre)   │
   └─────────────────────────────────────────────────────────────────┘
```

There are two npm packages:

- **`backend/`** — Express API + a SQLite database (`better-sqlite3`).
- **`web/`** — React single‑page app built with Vite.

The SQLite file itself is **gitignored** and rebuilt on demand from two sources:
the 51 hand‑curated seed songs (in code) and the large resolved catalogue
(a committed data file). More on that below.

---

## 2. Request / payment flow

The recommendation is gated behind a (mock) payment so it mirrors the real
"pay 10 cents → get a song" product.

```
POST /api/payments              -> { payment: pending }       create a €0,10 iDEAL payment
POST /api/payments/:id/confirm  -> { payment: paid, song }    mock bank approval → reserve a RANDOM song
GET  /api/recommendation/:id    -> 402 until paid, else song  re-fetch the reserved song
```

- `payments.ts` holds the mock iDEAL logic. Creating a payment returns a
  `pending` record; confirming it simulates the bank redirect succeeding.
- **The randomness happens on confirm.** `confirmPayment` calls
  `getRandomSong()` (`SELECT … ORDER BY RANDOM() LIMIT 1`) and *pins* that song
  to the payment, so re‑fetching the recommendation always returns the same song
  for that purchase (stable on refresh) while each new purchase is independent.
- It's structured so a real **Mollie** iDEAL integration can replace the mock
  later without touching the frontend.

The web app (`web/src/App.tsx`, `IdealModal.tsx`, `SongCard.tsx`,
`SpotifyPlayer.tsx`) walks the user through: click "Surprise me · €0,10" → pick a
bank in the mock modal → reveal the song card with imagery + descriptions + the
Spotify embed.

---

## 3. The song library (the core problem)

The whole point of RandMU is the *library*: ~10k songs spanning as many
countries, languages and genres as possible — not just whatever is popular on
Spotify. We build it in **two decoupled phases** so the slow/credential‑free
scraping is separate from the rate‑limited Spotify step.

### Phase 1 — Harvest candidates (no Spotify): `npm run harvest`

Code lives in `backend/src/sources/`. Each source produces `Candidate` objects:

```ts
type Candidate = {
  artist: string;
  title: string | null;     // a real song title when the source has one
  country: string;          // display name, e.g. "Mali"
  countryCode: string;      // ISO 3166-1 alpha-2, reused as the Spotify market
  language: string;
  genre: string;
  source: "musicbrainz" | "wikidata" | "reddit";
};
```

Sources:

1. **MusicBrainz** (`musicbrainz.ts`) — the workhorse and the most authoritative.
   - Searches artists by `country:<ISO>` across a ~150‑country list and by
     `tag:<genre>` across ~170 genres (both defined in `refdata.ts`).
   - For each artist it pulls a handful of studio **recordings** (filtering out
     live/remix/karaoke/instrumental duplicates) to get real song **titles**.
   - Country and genre come straight from MusicBrainz, so they're accurate.

2. **Wikidata** (`wikidata.ts`) — a credential‑free SPARQL endpoint.
   - Resolves each genre name to its Wikidata entity id (QID), then asks for
     performers tagged with that genre (`P136`) plus their country of origin /
     citizenship (`P495` / `P27`).
   - Produces artist‑level candidates (no title yet); the title is filled in
     during Phase 2 by looking up the artist's tracks on Spotify.

3. **Reddit** (`reddit.ts`) — **opt‑in**. Reads top posts from curated
   global‑music subreddits (r/worldmusic, r/africanmusic, r/citypop, r/Fado, …)
   and parses the common `Artist - Title [genre] (year)` submission format.
   Reddit blocks datacenter IPs, so this only runs if you provide
   `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` (an app‑only OAuth token);
   otherwise it's skipped gracefully.

All three are merged in `sources/index.ts`, which **de‑duplicates** on a
normalized `(artist, title)` key (keeping the record with the most metadata) and
writes everything to a committed file: `backend/data/candidates.ndjson`
(one JSON object per line). `http.ts` throttles each host (MusicBrainz ~1.3s per
request, etc.) and retries on 429/503 so we stay polite and don't get blocked.

### Phase 2 — Resolve on Spotify: `npm run ingest -- --from-candidates --target 10000`

Code in `backend/src/ingest.ts`. For each candidate:

- Searches Spotify with `"${title} ${artist}"` (or `artist:"${artist}"` for
  title‑less candidates) in the candidate's market, and matches results by
  **normalized artist name** so we don't grab the wrong song.
- Pulls the real **track id**, **artist photo**, **album cover**, and
  **release year** (`pickImage()` prefers a ~300px image variant).
- Derives **genre/subgenre** from the candidate's genre (bucketed by
  `deriveGenre`), falling back to the Spotify artist's own genres.
- Keeps **country/language** from the harvest, because Spotify does **not**
  expose an artist's country — this is exactly why the harvest step matters.

Resolved songs are written to a committed, gzipped file
`backend/data/catalog.ndjson.gz` (incrementally and resumably). The 51 curated
seed songs are **not** stored there — they always come from code.

#### Spotify hardening
The first naïve "just search Spotify" approach tripped a ~24h rate‑limit ban, so
the ingest now:
- enforces a 150ms minimum gap between calls,
- auto‑lowers the page size if the app rejects `limit=50` ("Invalid limit"),
- fetches artists one at a time (the batch `/artists` endpoint is forbidden for
  this app tier),
- and throws a `RateLimitedError` to **abort cleanly** on a long ban instead of
  hammering the API. Already‑saved progress is kept and the run is resumable.

### Loading it all: `npm run seed`
`seed.ts` rebuilds the SQLite DB from **(a)** the 51 curated seed songs in
`seedData.ts` and **(b)** the resolved catalogue in `catalog.ndjson.gz` (if
present), de‑duplicating on `spotify_track_id`. Because the DB is gitignored,
anyone can regenerate the full library from the committed data files.

---

## 4. How the descriptions are written

There are **two kinds** of descriptions, by design:

### (a) The 51 seed songs — hand‑written
In `backend/src/seedData.ts`, every seed song has **hand‑authored, multi‑paragraph**
`artistDescription`, `songDescription`, and `albumDescription`. These are real,
researched blurbs — not generated — covering the artist's background and cultural
context, what makes the specific track notable, and the album it's from. Example
(Mory Kanté – "Yeke Yeke"):

> *"Mory Kanté was a Guinean singer and kora virtuoso born into a celebrated
> family of griots… Nicknamed the 'electronic griot', he spent his career fusing
> the centuries‑old Mandinka kora tradition with electric instrumentation…"*

This is why the seed catalogue reads richly even before any Spotify data exists.

### (b) The harvested catalogue songs — generated from metadata templates
For the thousands of songs that come from the harvest, hand‑writing prose isn't
feasible, so `ingest.ts` **generates** the descriptions from the real metadata it
collected (country, genre/subgenre, album type, year, featured artists). Two
helpers do this:

- `describeSong(track, country, genre, subgenre)` produces something like:

  > *"'Tezeta' is an Ethio‑jazz track by Mulatu Astatke from Ethiopia. It appears
  > on the album 'Mulatu of Ethiopia' (1972), and is part of RandMU's deliberately
  > diverse, non‑Western‑centric library."*

  It adapts to the data: singles say *"released as a standalone single"* vs.
  *"appears on the album/EP …"*, the year is included only when known, and any
  featured artists are appended (*"It features …"*).

- `describeArtist(name, country, genres)` produces something like:

  > *"Mulatu Astatke is an artist from Ethiopia whose music spans Ethio‑jazz,
  > Jazz, Funk. They are part of a global music landscape that RandMU surfaces
  > beyond the Western mainstream, representing the sounds and traditions of their
  > region."*

  If no genres are known it falls back to a shorter, still‑sensible sentence.

The genre/subgenre that these templates use comes from `deriveGenre()`, which
maps specific tags (e.g. `ethio-jazz`, `amapiano`, `morna`) into a broad bucket
(African, Jazz, Latin, Electronic, …) for the `genre` field while keeping the
specific tag as the `subgenre`.

So: **seed songs = curated human prose; catalogue songs = templated prose filled
from authoritative metadata.** Both end up in the same `songs` table with the
same shape, so the UI renders them identically.

---

## 5. Data model

The `songs` table (see `db.ts`) stores, per song: `id`, `title`, `artist`,
`artist_description`, `song_description`, `country`, `language`, `genre`,
`subgenre`, `album_name`, `album_type`, `album_description`, `year`,
`spotify_track_id`, `spotify_url`, `artist_image_url`, `album_image_url`.

`db.ts` also runs lightweight in‑code migrations (e.g. `ALTER TABLE … ADD COLUMN`
for the image columns) so older databases keep working.

---

## 6. Running it locally

```bash
# backend
cd backend
npm install
npm run seed         # build the SQLite DB from seeds (+ catalogue if present)
npm run dev          # API on http://localhost:4000

# web (separate terminal)
cd web
npm install
npm run dev          # site on http://localhost:5173
```

Building / growing the catalogue (needs SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET):

```bash
cd backend
npm run harvest                              # Phase 1: write candidates.ndjson
npm run ingest -- --from-candidates --target 10000   # Phase 2: resolve + catalog.ndjson.gz
npm run seed                                 # reload DB with the new catalogue
```

Optional Reddit source: also set `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET`
before `npm run harvest`.

---

## 7. Current status / follow‑ups

- Payments are **mocked** (no real money). Real iDEAL via Mollie is the next step.
- The Spotify resolve step (Phase 2) is gated by a temporary ~24h Spotify
  rate‑limit ban; a one‑time scheduled session runs it automatically once the ban
  lifts, then commits `catalog.ndjson.gz` and updates the PR with final counts.
