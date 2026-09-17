export function Brand({ onOpen }) {
  return (
    <button className="brand" type="button" onClick={onOpen} aria-label="Open Vault Index">
      <img className="brand__riot-logo" src="/media/riot-games-logo.png" alt="Riot Games" />
      <span className="brand__arcane">A</span>
    </button>
  );
}

export function DoodleVideo({ src, className = "" }) {
  return (
    <video
      className={`doodle-video ${className}`}
      src={src}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}
