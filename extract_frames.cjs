const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'work', 'video-frames');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (let s = 0; s <= 13; s++) {
  try {
    execSync(`ffmpeg -y -ss ${s} -i "public/media/arcane-animation-00m08s5-to-00m22s-fullhd.mp4" -vframes 1 -q:v 2 "work/video-frames/frame_${s}.jpg"`, { stdio: 'ignore' });
  } catch (e) {
    console.error(`Error at ${s}:`, e.message);
  }
}

console.log('Frames:', fs.readdirSync(outDir));
