const fs = require('fs');

const envFile = process.argv[2] === 'production' ? '.production' : '.development';
console.log(`Copying ${envFile} to .env`);

fs.copyFileSync(envFile, '.env');
console.log(`${envFile} was copied to .env`);
