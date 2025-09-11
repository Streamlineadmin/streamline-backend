// express endpoint snippet
const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const { postToTally, escapeXml } = require('../tally/tally-client');
require("dotenv").config();

const crypto = require('crypto');


async function createLedger(req, res) {
  try {
    const ledgers = req.body.ledgers || []; // [{name, parent, openingBalance}]
    const fragments = ledgers.map(l => `
      <TALLYMESSAGE>
        <LEDGER NAME="${escapeXml(l.name)}" ACTION="Create">
          <NAME>${escapeXml(l.name)}</NAME>
          <PARENT>${escapeXml(l.parent)}</PARENT>
          <OPENINGBALANCE TYPE="Amount">${escapeXml(String(l.openingBalance || 0))}</OPENINGBALANCE>
        </LEDGER>
      </TALLYMESSAGE>
    `).join('');

    const envelope = `<?xml version="1.0" encoding="utf-8"?>
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Import</TALLYREQUEST>
          <TYPE>Data</TYPE>
          <ID>All Masters</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVCURRENTCOMPANY>${escapeXml('EaseMargin Test')}</SVCURRENTCOMPANY>
              <IMPORTDUPS>@@DUPIGNORE</IMPORTDUPS>
            </STATICVARIABLES>
          </DESC>
          <DATA>${fragments}</DATA>
        </BODY>
      </ENVELOPE>`;

    const resp = await postToTally(envelope);
    return res.json({ ok: true, tally: resp });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ ok: false, error: err.message, detail: err.response?.data });
  }
}


module.exports = {
    createLedger: createLedger,
}