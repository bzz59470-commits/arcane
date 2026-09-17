/**
 * Playlist for the Xbox-style music toast.
 *
 * Only audio that ships with the repo is referenced: the score of the hero
 * clip, extracted with ffmpeg from
 * public/media/arcane-animation-00m08s5-to-00m22s-fullhd.mp4 (no re-encode of
 * anything we do not already host). `syncVideo: true` keeps the hero video in
 * lock-step with the track so picture and sound match.
 *
 * Add more tracks by dropping MP3s in public/media/audio/ and listing them
 * here; they do not need `syncVideo`.
 */
export const TRACKS = [
  {
    id: "clip-score",
    title: "Enemy — Arcane Opening Cut",
    artist: "Score from the hero clip · Riot Games",
    src: "/media/audio/arcane-clip-score.mp3",
    cover: "/media/jinx-web-cutout.png",
    syncVideo: true,
  },
];
