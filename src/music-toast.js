const MUSIC_SRC = '/media/arcane-animation-00m08s5-to-00m22s-fullhd.mp4';

function mountMusicToast(toast) {
  if (toast.dataset.musicReady) return;
  toast.dataset.musicReady = 'true';
  const close = toast.querySelector('button');
  const audio = document.createElement('audio');
  audio.src = MUSIC_SRC;
  audio.preload = 'metadata';

  const icon = document.createElement('div');
  icon.className = 'xbox-toast__icon';
  icon.textContent = 'X';
  const copy = document.createElement('div');
  copy.className = 'xbox-toast__copy';
  copy.innerHTML = '<span>ARCANE</span><b>Jinx — Get Jinxed</b><small>Arcane / League of Legends</small>';
  const controls = document.createElement('div');
  controls.className = 'xbox-toast__controls';
  controls.innerHTML = '<button type="button" data-action="previous" aria-label="Previous track">◀</button><button type="button" data-action="play" aria-label="Play">▶</button><button type="button" data-action="next" aria-label="Next track">▶</button>';
  const progress = document.createElement('input');
  progress.className = 'xbox-toast__progress';
  progress.type = 'range';
  progress.min = '0';
  progress.max = '100';
  progress.value = '0';
  progress.setAttribute('aria-label', 'Track progress');

  toast.querySelectorAll(':scope > *').forEach((child) => {
    if (child !== close) child.remove();
  });
  toast.append(icon, copy, controls, progress, audio);
  if (close) {
    close.className = 'xbox-toast__close';
    close.textContent = '×';
    toast.append(close);
  }
  const play = controls.querySelector('[data-action="play"]');
  play.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
      play.textContent = 'Ⅱ';
      play.setAttribute('aria-label', 'Pause');
    } else {
      audio.pause();
      play.textContent = '▶';
      play.setAttribute('aria-label', 'Play');
    }
  });
  controls.querySelector('[data-action="previous"]').addEventListener('click', () => { audio.currentTime = 0; });
  controls.querySelector('[data-action="next"]').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
  audio.addEventListener('timeupdate', () => { progress.value = audio.duration ? String((audio.currentTime / audio.duration) * 100) : '0'; });
  progress.addEventListener('input', () => { if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration; });
}

new MutationObserver(() => document.querySelectorAll('.inventory-toast').forEach(mountMusicToast)).observe(document.body, { childList: true, subtree: true });
