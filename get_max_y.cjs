const fs = require('fs');
const content = fs.readFileSync('public/ArduinoUno.svg', 'utf8');
const regexY = /y="([0-9.]+)"/g;
const regexCy = /cy="([0-9.]+)"/g;
const regexD = /d="[^"]*([0-9.]+)[^"]*"/g; // Need better path parsing for actual bounds
let max = 0;
let match;
while ((match = regexY.exec(content)) !== null) {
  let val = parseFloat(match[1]);
  if (val > max) max = val;
}
while ((match = regexCy.exec(content)) !== null) {
  let val = parseFloat(match[1]);
  if (val > max) max = val;
}
console.log("Max Y:", max);
