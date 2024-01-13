const fs = require('fs');

const envFile = process.argv[2] === 'production' ? '.env.production' : '.env.development';

fs.copyFileSync(envFile, '.env');
console.log(`${envFile} was copied to .env`);
