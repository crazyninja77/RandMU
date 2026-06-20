import type { Song } from "../types";

export function SpotifyPlayer({ song }: { song: Song }) {
  if (song.spotifyTrackId) {
    return (
      <iframe
        title={`Spotify preview of ${song.title}`}
        className="spotify-embed"
        src={`https://open.spotify.com/embed/track/${song.spotifyTrackId}?utm_source=randmu`}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    );
  }
  // No resolved track id yet (seed library before Spotify ingest): link to a search.
  return (
    <a className="spotify-fallback" href={song.spotifyUrl ?? "#"} target="_blank" rel="noreferrer">
      Find this song on Spotify ↗
    </a>
  );
}
