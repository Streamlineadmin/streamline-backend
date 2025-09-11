// tally-client.js
const axios = require('axios');
const xml2js = require('xml2js');

const TALLY_HOST = '127.0.0.1';
const TALLY_PORT = 9000;
const TALLY_URL = (host = TALLY_HOST, port = TALLY_PORT) => `http://${host}:${port}`;

function escapeXml(s = '') {
  return s.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'})[c]);
}

async function postToTally(xml, host = TALLY_HOST, port = TALLY_PORT) {
  const url = TALLY_URL(host, port);
  const res = await axios.post(url, xml, {
    headers: { 'Content-Type': 'application/xml' },
    timeout: 30000
  });
  // parse response to JS object
  const parsed = await xml2js.parseStringPromise(res.data, { explicitArray: false });
  return parsed;
}

module.exports = { postToTally, escapeXml };
