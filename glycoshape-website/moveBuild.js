// moveBuild.js
const fs = require('fs-extra');
const path = require('path');

const targetDir = process.argv[2];

if (!targetDir) {
  console.error('No target directory specified');
  process.exit(1);
}

fs.moveSync(path.join(__dirname, 'build'), path.join(__dirname, targetDir), { overwrite: true });
