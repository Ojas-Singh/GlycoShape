// setBuildDir.js
const fs = require('fs');

const buildDir = process.env.BUILD_DIR || 'build';
if (!fs.existsSync(buildDir)){
    fs.mkdirSync(buildDir);
}

process.env.REACT_APP_BUILD_DIR = buildDir;