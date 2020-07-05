const fs = require('fs');
module.exports = {
  // key: null,
  // cert: null
  key: fs.readFileSync('privkey.pem'),
  cert: fs.readFileSync('fullchain.pem')
};