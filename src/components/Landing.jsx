import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { animate, scrambleText } from "animejs";
import { Brand } from "./Brand.jsx";
import { XboxMusicToast } from "./XboxMusicToast.jsx";
import { SCENES, VIDEO_DURATION, pulseAt, sceneAt } from "../lib/sceneCues.js";

export const VIDEO_SRC = "/media/arcane-animation-00m08s5-to-00m22s-fullhd.mp4";
const LETTERS = ["A", "R", "C", "A", "N", "E"];
const LETTER_LAG = 0.07; // seconds of audio-envelope lag between consecutive letters

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Numeric stat that re-counts to its value every time `trigger` changes,
 * so the header figures "breathe" with each cut of the video.
 */
function StatCounter({ value, trigger, digits = 2 }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const target = Number(value) || 0;
    if (prefersReducedMotion()) {
      node.textContent = String(target).padStart(digits, "0");
      return undefined;
    }
    const proxy = { n: Math.max(0, target - Math.ceil(target * 0.6)) };
    const tween = gsap.to(proxy, {
      n: target,
      duration: 0.9,
      ease: "power3.out",
      onUpdate: () => {
        node.textContent = String(Math.round(proxy.n)).padStart(digits, "0");
      },
    });
    return () => tween.kill();
  }, [value, trigger, digits]);
  return <b ref={ref}>{String(value).padStart(digits, "0")}</b>;
}

export function Landing({ onOpenVault, stats }) {
  const root = useRef(null);
  const videoRef = useRef(null);
  const letterRefs = useRef([]);
  const captionRef = useRef(null);
  const [scene, setScene] = useState(SCENES[0]);
  const [clock, setClock] = useState(0);
  const sceneIdRef = useRef(scene.id);

  /* Intro timeline (once). */
  useLayoutEffect(() => {
    const context = gsap.context(() => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo("[data-landing-nav]", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.08 })
        .fromTo(
          "[data-hero-copy]",
          { opacity: 0, scale: 0.92, y: 24, filter: "blur(12px)" },
          { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 1.15 },
          "-.25",
        )
        .fromTo("[data-timeline]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, "-.6");
    }, root);
    return () => context.revert();
  }, []);

  /* Video-driven loop: scene detection + audio-envelope pulse → CSS vars. */
  useEffect(() => {
    const video = videoRef.current;
    const host = root.current;
    if (!video || !host) return undefined;
    const reduced = prefersReducedMotion();
    let frame = 0;
    let lastClock = -1;
    const tick = () => {
      const t = video.currentTime || 0;
      const next = sceneAt(t);
      if (next.id !== sceneIdRef.current) {
        sceneIdRef.current = next.id;
        setScene(next);
      }
      const second = Math.floor(t);
      if (second !== lastClock) {
        lastClock = second;
        setClock(t);
      }
      if (!reduced) {
        const pulse = pulseAt(t);
        host.style.setProperty("--pulse", pulse.toFixed(3));
        host.style.setProperty("--progress", (t / VIDEO_DURATION).toFixed(4));
        letterRefs.current.forEach((letter, index) => {
          if (letter) letter.style.setProperty("--lp", pulseAt(t - index * LETTER_LAG).toFixed(3));
        });
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  /* Scene change → accent colour, caption scramble, hero "hit". */
  useEffect(() => {
    const host = root.current;
    if (!host) return undefined;
    host.style.setProperty("--accent", scene.accent);
    host.dataset.scene = scene.id;
    host.dataset.mono = scene.mono ? "true" : "false";
    if (prefersReducedMotion()) {
      if (captionRef.current) captionRef.current.textContent = scene.caption;
      return undefined;
    }
    const animations = [];
    if (captionRef.current) {
      animations.push(
        animate(captionRef.current, {
          innerHTML: scrambleText({ text: scene.caption, chars: "uppercase", revealRate: 40, settleDuration: 220 }),
          duration: 900,
          ease: "linear",
        }),
      );
    }
    const letters = letterRefs.current.filter(Boolean);
    if (letters.length) {
      animations.push(
        animate(letters, {
          scale: [{ to: 1.12, duration: 140, ease: "outQuad" }, { to: 1, duration: 520, ease: "outElastic(1, .6)" }],
          delay: (_, i) => i * 45,
        }),
      );
    }
    const flash = host.querySelector("[data-cut-flash]");
    if (flash) {
      animations.push(animate(flash, { opacity: [{ to: 0.55, duration: 60 }, { to: 0, duration: 420, ease: "outQuad" }] }));
    }
    return () => animations.forEach((a) => a.pause());
  }, [scene]);

  const seek = (time) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, time), VIDEO_DURATION - 0.05);
    video.play().catch(() => {});
  };

  return (
    <main className="landing" ref={root} data-scene={scene.id} data-mono={scene.mono ? "true" : "false"}>
      <div className="landing__media">
        <video ref={videoRef} src={VIDEO_SRC} muted loop autoPlay playsInline preload="auto" />
      </div>
      <div className="landing__wash" />
      <div className="landing__cut-flash" data-cut-flash aria-hidden="true" />
      <header className="landing__header">
        <div className="landing__header-left" data-landing-nav>
          <Brand onOpen={onOpenVault} />
        </div>
        <nav className="landing__nav" aria-label="Vault stats">
          <div className="nav-season" data-landing-nav>
            SCENE
            <br />
            <span>{String(SCENES.indexOf(scene) + 1).padStart(2, "0")}</span>
          </div>
          <button data-landing-nav onClick={onOpenVault} className="stat-btn">
            ACCOUNTS
            <br />
            <span>TOTAL</span> <StatCounter value={stats.total} trigger={scene.id} />
          </button>
          <button data-landing-nav onClick={onOpenVault} className="stat-btn">
            SALES
            <br />
            <span>READY</span> <StatCounter value={stats.ready} trigger={scene.id} />
          </button>
          <button data-landing-nav onClick={onOpenVault} className="stat-btn">
            VAULT
            <br />
            <span>VALUE $</span> <StatCounter value={Math.round(stats.value)} trigger={scene.id} digits={2} />
          </button>
        </nav>
        <div className="landing__controls">
          <button className="user-btn" aria-label="Open vault" data-landing-nav onClick={onOpenVault}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>
      <section className="landing__hero">
        <div className="landing__copy" data-hero-copy>
          <p className="scene-caption">
            <span className="scene-caption__label">{scene.label}</span>
            <span className="scene-caption__text" ref={captionRef}>
              {scene.caption}
            </span>
          </p>
          <h1 className="arcane-title" aria-label="ARCANE">
            {LETTERS.map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                ref={(node) => {
                  letterRefs.current[index] = node;
                }}
                style={{ "--i": index }}
              >
                {letter}
              </span>
            ))}
          </h1>
          <div className="hero-actions">
            <button className="btn-watch-now" onClick={onOpenVault}>
              OPEN VAULT
            </button>
            <button className="btn-netflix" onClick={onOpenVault}>
              BROWSE ACCOUNTS <span>↗</span>
            </button>
          </div>
        </div>
      </section>
      <div className="scene-timeline" data-timeline role="group" aria-label="Video scenes">
        <span className="scene-timeline__clock">{formatClock(clock)}</span>
        <div className="scene-timeline__track">
          <i className="scene-timeline__fill" />
          {SCENES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`scene-timeline__marker${item.id === scene.id ? " is-active" : ""}`}
              style={{ "--at": `${(item.at / VIDEO_DURATION) * 100}%`, "--marker-accent": item.accent }}
              onClick={() => seek(item.at)}
              aria-label={`Jump to ${item.label}`}
              aria-pressed={item.id === scene.id}
            >
              <em>{item.label}</em>
            </button>
          ))}
        </div>
        <span className="scene-timeline__clock">{formatClock(VIDEO_DURATION)}</span>
      </div>
      <XboxMusicToast videoRef={videoRef} />
    </main>
  );
}
