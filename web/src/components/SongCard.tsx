import type { Song } from "../types";
import { SpotifyPlayer } from "./SpotifyPlayer";
import { RatingSlider } from "./RatingSlider";
import { CountryMap, hasCountryGeometry } from "./CountryMap";
import { useI18n } from "../i18n";

function Paragraphs({ text }: { text: string }) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return <p>—</p>;
  return (
    <>
      {parts.map((p, idx) => (
        <p key={idx}>{p}</p>
      ))}
    </>
  );
}

function albumLabel(song: Song): string | null {
  if (!song.albumName) return null;
  const kind = song.albumType === "ep" ? "EP" : song.albumType === "album" ? "Album" : null;
  const yr = song.year ? ` · ${song.year}` : "";
  return kind ? `${kind}: ${song.albumName}${yr}` : `${song.albumName}${yr}`;
}

function Thumb({
  url,
  label,
  shape,
}: {
  url: string | null;
  label: string;
  shape: "circle" | "square";
}) {
  const cls = shape === "circle" ? "thumb thumb-circle" : "thumb thumb-square";
  if (url) {
    return <img className={cls} src={url} alt={label} loading="lazy" />;
  }
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={`${cls} thumb-fallback`} aria-hidden="true">
      {initial}
    </div>
  );
}

// "World" is the catch-all the ingest assigns when no real style is known; it
// carries no information, so we don't surface it as a tag. Likewise a few
// non-musical Spotify "genres" leak through as subgenres.
const NON_GENRE = /^(world|world music)$/i;
const JUNK_STYLE = /covid|audiobook/i;

function styleTags(song: Song): string[] {
  const out: string[] = [];
  for (const v of [song.genre, song.subgenre]) {
    const s = v?.trim();
    if (s && !NON_GENRE.test(s) && !JUNK_STYLE.test(s) && !out.includes(s)) out.push(s);
  }
  return out;
}

export function SongCard({ song, onAgain }: { song: Song; onAgain: () => void }) {
  const { t } = useI18n();
  const album = albumLabel(song);
  const styles = styleTags(song);
  return (
    <div className="card song-card">
      <div className="song-head">
        <Thumb url={song.artistImageUrl} label={song.artist} shape="circle" />
        <div className="song-head-text">
          <h2 className="song-title">{song.title}</h2>
          <p className="song-artist">{song.artist}</p>
        </div>
        {song.spotifyUrl && (
          <a className="spotify-link" href={song.spotifyUrl} target="_blank" rel="noreferrer">
            {t("card.openSpotify")}
          </a>
        )}
      </div>

      <div className="tags">
        {song.country && <span className="tag tag-country">{song.country}</span>}
        {song.language && <span className="tag">{song.language}</span>}
        {styles.map((s, i) => (
          <span key={s} className={i === 0 ? "tag tag-genre" : "tag"}>
            {s}
          </span>
        ))}
        {song.year && <span className="tag tag-year">{song.year}</span>}
      </div>

      <SpotifyPlayer song={song} />

      <div className="desc-block">
        <h3>{t("card.aboutSong")}</h3>
        <Paragraphs text={song.songDescription || "—"} />
      </div>

      <div className="desc-block">
        <h3>{t("card.aboutArtist", { artist: song.artist })}</h3>
        <Paragraphs text={song.artistDescription || "—"} />
      </div>

      {album && (
        <div className="desc-block">
          <h3>{song.albumType === "ep" ? t("card.ep") : t("card.album")}</h3>
          <div className="album-row">
            <Thumb url={song.albumImageUrl} label={song.albumName ?? "?"} shape="square" />
            <div>
              <p className="album-name">{album}</p>
              {song.albumDescription && <p>{song.albumDescription}</p>}
            </div>
          </div>
        </div>
      )}

      {song.country && hasCountryGeometry(song.countryCode) && (
        <div className="desc-block">
          <h3>{t("card.origin", { country: song.country })}</h3>
          <CountryMap code={song.countryCode} country={song.country} />
        </div>
      )}

      <RatingSlider
        songId={song.id}
        initialAverage={song.ratingAverage}
        initialCount={song.ratingCount}
      />

      <button className="btn btn-secondary again-btn" onClick={onAgain}>
        {t("card.again", { price: "€0,10" })}
      </button>
    </div>
  );
}
