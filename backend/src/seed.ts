import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { SEED_SONGS } from "./seedData.js";
import { readCatalog } from "./catalogStore.js";
import { seedRatingBaselines } from "./library.js";

function spotifySearchUrl(artist: string, title: string): string {
  const q = encodeURIComponent(`${artist} ${title}`);
  return `https://open.spotify.com/search/${q}`;
}

const insert = db.prepare(`
  INSERT INTO songs (
    id, title, artist, artist_description, song_description,
    country, language, genre, subgenre,
    album_name, album_type, album_description, year,
    spotify_track_id, spotify_url, artist_image_url, album_image_url
  ) VALUES (
    @id, @title, @artist, @artistDescription, @songDescription,
    @country, @language, @genre, @subgenre,
    @albumName, @albumType, @albumDescription, @year,
    @spotifyTrackId, @spotifyUrl, @artistImageUrl, @albumImageUrl
  )
`);

const insertMany = db.transaction((rows: typeof SEED_SONGS) => {
  for (const s of rows) {
    insert.run({
      id: randomUUID(),
      ...s,
      spotifyTrackId: null,
      // until a real track id is resolved, link to a Spotify search
      spotifyUrl: spotifySearchUrl(s.artist, s.title),
      // images are populated by `npm run ingest -- --resolve`
      artistImageUrl: null,
      albumImageUrl: null,
    });
  }
});

// Load the large resolved catalogue (if present) on top of the curated seeds.
const catalog = readCatalog();
const catalogInsert = db.prepare(`
  INSERT INTO songs (
    id, title, artist, artist_description, song_description,
    country, language, genre, subgenre,
    album_name, album_type, album_description, year,
    spotify_track_id, spotify_url, artist_image_url, album_image_url
  ) VALUES (
    @id, @title, @artist, @artistDescription, @songDescription,
    @country, @language, @genre, @subgenre,
    @albumName, @albumType, @albumDescription, @year,
    @spotifyTrackId, @spotifyUrl, @artistImageUrl, @albumImageUrl
  )
  ON CONFLICT(spotify_track_id) DO NOTHING
`);
const insertCatalog = db.transaction((rows: typeof catalog) => {
  for (const r of rows) catalogInsert.run(r);
});

const existing = (db.prepare("SELECT COUNT(*) AS c FROM songs").get() as { c: number }).c;
if (existing > 0 && !process.argv.includes("--force")) {
  console.log(`Library already has ${existing} songs. Use --force to add the seed set again.`);
} else {
  insertMany(SEED_SONGS);
  if (catalog.length) insertCatalog(catalog);
  const total = (db.prepare("SELECT COUNT(*) AS c FROM songs").get() as { c: number }).c;
  console.log(
    `Seeded ${SEED_SONGS.length} curated songs` +
      (catalog.length ? ` + ${catalog.length} catalogue songs` : "") +
      `. Library now has ${total}.`,
  );
}

// Always give any song without ratings a community baseline (idempotent).
const rated = seedRatingBaselines();
if (rated > 0) console.log(`Assigned community-rating baselines to ${rated} songs.`);
