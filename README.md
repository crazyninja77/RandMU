# RandMU

> Pay 10 cents, get one random song — from a highly specialised, deliberately
> non-Western-centric library of music from around the world.

RandMU surprises you with a single song drawn at random from a large, diverse
catalogue. For each recommendation you get the **country, language, genre,
subgenre, the artist and a description of them, a description of the song, and
the album/EP it belongs to** — plus a Spotify snippet to play and a link out.

Payment is via **iDEAL** (currently mocked — no real money is charged).

## Structure

```
randmu/
├── backend/   Express + SQLite API: song library, random recommendation, mock iDEAL payments
└── web/       React + Vite website: landing page, iDEAL flow, song reveal with Spotify embed
```

## Running locally

Two processes. In one terminal:

```bash
cd backend
npm install
npm run seed      # load the curated starter library (~50 songs)
npm start         # http://localhost:4000
```

In another:

```bash
cd web
npm install
npm run dev       # http://localhost:5173  (proxies /api to :4000)
```

Open http://localhost:5173 and click **Surprise me**.

### Demo catalogue mode

Set `RANDMU_DEMO_MODE=1` to expose only songs with curated generated-description
overlays through recommendations, statistics, and the map. The complete catalogue
remains seeded and can be activated later by removing the variable.

Set `DESCRIPTION_WORKER=off` with demo mode to keep the visible collection fixed
instead of generating and exposing additional descriptions in the background.

## The song library

The starter library in `backend/src/seedData.ts` is a small, hand-curated set of
real, diverse songs with accurate metadata and descriptions. The full vision is a
~10,000-song catalogue spanning 100+ countries and 100+ genres, built from the
**Spotify Web API**.

### Building the large catalogue (needs Spotify credentials)

Create a free app at https://developer.spotify.com/dashboard to get a Client ID
and Secret (the Client Credentials flow is used — no user login required).

```bash
cd backend
export SPOTIFY_CLIENT_ID=...
export SPOTIFY_CLIENT_SECRET=...

# 1) Resolve the curated seed songs to real Spotify track ids (enables embeds):
npm run ingest -- --resolve

# 2) Build the large diverse catalogue:
npm run ingest -- --catalog --target 10000
```

Search seeds (genres, markets, country-specific queries) live in
`backend/src/ingestSeeds.ts`.

> Note: Spotify does not expose an artist's country, so `country` is derived from
> the search market for country-specific queries, and genre/subgenre come from the
> artist's Spotify genre tags. Descriptions for ingested tracks are generated from
> the available metadata; the curated seed songs have richer, hand-written ones.

## Payments

The iDEAL flow is mocked end-to-end (create → bank approval → confirm) in
`backend/src/payments.ts` and `web/src/components/IdealModal.tsx`. It is structured
so a real provider (e.g. **Mollie**) can drop in: replace `createPayment` /
`confirmPayment` with provider calls + a webhook that flips the payment to `paid`
and reserves the song.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/stats` | Library counts + price |
| POST | `/api/payments` | Create a pending iDEAL payment |
| GET | `/api/payments/:id` | Payment status (+ song if paid) |
| POST | `/api/payments/:id/confirm` | Mock bank approval; reserves a random song |
| POST | `/api/payments/:id/fail` | Mock cancellation |
| GET | `/api/recommendation/:paymentId` | The reserved song (402 if unpaid) |
