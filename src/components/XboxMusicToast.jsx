import { useCallback, useEffect, useRef, useState } from "react";
import { TRACKS } from "../lib/tracks.js";

const BAR_COUNT = 24;
const SYNC_TOLERANCE_S = 0.25;
const PHASES = ["hidden", "pop", "unlock", "player"];

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Short two-note "achievement" chime synthesised with Web Audio. */
function playChime(context) {
  const now = context.currentTime;
  [
    [659.25, 0],
    [987.77, 0.11],
  ].forEach(([freq, offset]) => {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.45);
    osc.connect(gain).connect(context.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.5);
  });
}

/**
 * Xbox-style "Achievement unlocked" notification that turns into a music
 * player for the Arcane clip score, with a live Web-Audio visualiser and
 * optional picture/sound sync with the hero video.
 */
export function XboxMusicToast({ videoRef }) {
  const [phase, setPhase] = useState("hidden");
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });
  const [error, setError] = useState("");
  const audioRef = useRef(null);
  const barsRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const track = TRACKS[trackIndex];

  /* Xbox reveal choreography: circle pops → banner unlocks → morphs into player. */
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase("pop"), 1300),
      window.setTimeout(() => setPhase("unlock"), 1900),
      window.setTimeout(() => setPhase("player"), 4600),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioCtxRef.current) return audioCtxRef.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      const context = new Ctx();
      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser).connect(context.destination);
      audioCtxRef.current = context;
      analyserRef.current = analyser;
      return context;
    } catch {
      return null;
    }
  }, []);

  /* Visualiser loop (only while playing). */
  useEffect(() => {
    if (!playing) {
      barsRef.current.forEach(
        (bar) => bar && bar.style.setProperty("--level", "0.08"),
      );
      return undefined;
    }
    const analyser = analyserRef.current;
    let frame = 0;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const tick = () => {
      if (analyser && data) {
        analyser.getByteFrequencyData(data);
        const step = Math.max(1, Math.floor((data.length * 0.7) / BAR_COUNT));
        barsRef.current.forEach((bar, i) => {
          if (!bar) return;
          let sum = 0;
          for (let k = 0; k < step; k += 1) sum += data[i * step + k] ?? 0;
          const level = Math.max(0.08, sum / step / 255);
          bar.style.setProperty("--level", level.toFixed(3));
        });
      } else {
        // No AnalyserNode available: fall back to a gentle synthetic sway.
        const t = performance.now() / 1000;
        barsRef.current.forEach((bar, i) => {
          if (bar)
            bar.style.setProperty(
              "--level",
              (0.3 + 0.25 * Math.sin(t * 4 + i * 0.6)).toFixed(3),
            );
        });
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing]);

  /* Keep the hero video locked to the audio while a synced track plays. */
  useEffect(() => {
    const audio = audioRef.current;
    const video = videoRef?.current;
    if (!playing || !audio || !video || !track.syncVideo) return undefined;
    const align = () => {
      if (Math.abs(video.currentTime - audio.currentTime) > SYNC_TOLERANCE_S) {
        video.currentTime = audio.currentTime;
      }
      if (video.paused) video.play().catch(() => {});
    };
    align();
    audio.addEventListener("timeupdate", align);
    return () => audio.removeEventListener("timeupdate", align);
  }, [playing, track, videoRef]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");
    if (audio.paused) {
      const context = ensureAudioGraph();
      try {
        if (context?.state === "suspended") await context.resume();
        await audio.play();
        if (context) playChime(context);
        setPlaying(true);
      } catch (err) {
        setError(
          err?.name === "NotSupportedError"
            ? "Track file missing"
            : "Playback blocked",
        );
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const skip = (delta) => {
    if (TRACKS.length < 2) {
      const audio = audioRef.current;
      if (audio)
        audio.currentTime = Math.max(
          0,
          Math.min(audio.duration || 0, audio.currentTime + delta * 5),
        );
      return;
    }
    setTrackIndex((i) => (i + delta + TRACKS.length) % TRACKS.length);
  };

  /* Restart playback when the track changes while playing. */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    if (playing) audio.play().catch(() => setPlaying(false));
  }, [trackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const seek = (event) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    audio.currentTime = ratio * audio.duration;
  };

  const progress = time.duration ? (time.current / time.duration) * 100 : 0;
  const phaseIndex = PHASES.indexOf(phase);

  return (
    <>
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        loop
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (!el) return;
          setTime({
            current: el.currentTime,
            duration: Number.isFinite(el.duration) ? el.duration : 0,
          });
        }}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          if (!el) return;
          const duration = Number.isFinite(el.duration) ? el.duration : 0;
          setTime((t) => ({ ...t, duration }));
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onError={() => setError("Track file missing")}
        hidden
      />
      {phase !== "hidden" && (
        <aside
          className={`xbox-toast xbox-toast--${phase}${playing ? " is-playing" : ""}`}
          data-toast
          aria-live="polite"
        >
          <button
            className="xbox-toast__orb"
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="xbox-toast__logo"
            >
              <path
                fill="currentColor"
                d="M12 2.3c1.9 0 3.7.6 5.2 1.6-2.2 1-4.1 2.7-5.2 3.9-1.1-1.2-3-2.9-5.2-3.9A9.6 9.6 0 0 1 12 2.3Zm-6.7 3c2.4 1 5.1 4 6.7 6.5-1.9 3-4.9 6.3-7.9 7.5A9.7 9.7 0 0 1 2.3 12c0-2.6 1-4.9 3-6.7Zm13.4 0c2 1.8 3 4.1 3 6.7 0 2.8-1.1 5.3-3.8 7.3-3-1.2-6-4.5-7.9-7.5 1.6-2.5 4.3-5.5 6.7-6.5Z"
              />
            </svg>
            <span className="xbox-toast__ring" />
          </button>
          <div className="xbox-toast__panel">
            {phaseIndex < 3 ? (
              <div className="xbox-toast__unlock">
                <span>Achievement unlocked · 20G</span>
                <b>Arcane Official Playlist</b>
              </div>
            ) : (
              <div className="xbox-toast__player">
                <img className="xbox-toast__cover" src={track.cover} alt="" />
                <div className="xbox-toast__meta">
                  <span className="xbox-toast__kicker">
                    {playing ? "NOW PLAYING" : "ARCANE OFFICIAL PLAYLIST /"}
                  </span>
                  <strong className="xbox-toast__title">{track.title}</strong>
                  <small className="xbox-toast__artist">
                    {error || track.artist}
                  </small>
                  <div className="xbox-toast__bars" aria-hidden="true">
                    {Array.from({ length: BAR_COUNT }, (_, i) => (
                      <i
                        key={i}
                        ref={(node) => {
                          barsRef.current[i] = node;
                        }}
                        style={{ "--i": i }}
                      />
                    ))}
                  </div>
                  <div className="xbox-toast__controls">
                    <button
                      type="button"
                      onClick={() => skip(-1)}
                      aria-label="Previous"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="xbox-toast__play"
                      onClick={toggle}
                      aria-label={playing ? "Pause" : "Play"}
                    >
                      {playing ? (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => skip(1)}
                      aria-label="Next"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
                      </svg>
                    </button>
                    <div
                      className="xbox-toast__progress"
                      role="slider"
                      aria-label="Track progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(progress)}
                      tabIndex={0}
                      onClick={seek}
                      onKeyDown={(e) => {
                        const audio = audioRef.current;
                        if (!audio) return;
                        if (e.key === "ArrowRight")
                          audio.currentTime = Math.min(
                            audio.duration || 0,
                            audio.currentTime + 2,
                          );
                        if (e.key === "ArrowLeft")
                          audio.currentTime = Math.max(
                            0,
                            audio.currentTime - 2,
                          );
                      }}
                    >
                      <i style={{ width: `${progress}%` }} />
                    </div>
                    <span className="xbox-toast__time">
                      {formatTime(time.current)} / {formatTime(time.duration)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
