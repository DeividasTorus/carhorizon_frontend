const fs = require('fs');

// 1x1 transparent PNG base64
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
const buffer = Buffer.from(pngBase64, 'base64');

const files = [
  './assets/icon.png',
  './assets/splash.png',
  './assets/adaptive-icon.png'
];

files.forEach(file => {
  try {
    fs.writeFileSync(file, buffer);
    console.log('Wrote placeholder', file);
  } catch (e) {
    console.error('Failed to write', file, e.message);
  }
});
