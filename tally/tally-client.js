// tally-client.js
const axios = require('axios');
const xml2js = require('xml2js');

const TALLY_HOST = '127.0.0.1';
const TALLY_PORT = 9000;
const TALLY_URL = (host = TALLY_HOST, port = TALLY_PORT) => `http://${host}:${port}`;

function escapeXml(s = '') {
  return s.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'})[c]);
}

async function postToTally(envelope) {
  const { data } = await axios.post("http://localhost:9000", envelope, {
    headers: { "Content-Type": "text/xml" },
  });

  // Convert XML → JSON
  const parser = new xml2js.Parser({ explicitArray: false });
  const json = await parser.parseStringPromise(data);

  return json;
}

module.exports = { postToTally, escapeXml };
