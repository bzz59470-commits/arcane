const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'work', 'crops');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const runCrop = (filter, outFile) => {
  execSync(`ffmpeg -y -i "public/media/reference.png" -vf "${filter}" "${path.join(outDir, outFile)}"`);
};

runCrop('crop=120:120:130:280', 'jinx_portrait.png');
runCrop('crop=250:80:460:320', 'music_toast.png');
runCrop('crop=50:50:495:345', 'album_art.png');
runCrop('crop=80:40:5:5', 'riot_logo.png');
runCrop('crop=70:40:640:5', 'top_right.png');
runCrop('crop=300:140:210:160', 'center_hero.png');
runCrop('crop=250:100:340:10', 'top_schedule.png');
runCrop('crop=30:30:10:370', 'bottom_left_badge.png');

console.log('Crops generated:', fs.readdirSync(outDir));
