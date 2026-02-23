// express endpoint snippet
const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const { postToTally, escapeXml } = require('../tally/tally-client');
require("dotenv").config();

const crypto = require('crypto');

async function connectToTally(req, res) {
  try {
    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
      <ENVELOPE>
        <HEADER>
          <VERSION>1</VERSION>
          <TALLYREQUEST>Export</TALLYREQUEST>
          <TYPE>Collection</TYPE>
          <ID>Company Collection</ID>
        </HEADER>
        <BODY>
          <DESC>
            <STATICVARIABLES>
              <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <TDL>
              <TDLMESSAGE>
                <COLLECTION NAME="Company Collection" ISINITIALIZE="Yes">
                  <TYPE>Company</TYPE>
                  <FETCH>Name,GUID,RemoteCompanyID</FETCH>
                </COLLECTION>
              </TDLMESSAGE>
            </TDL>
          </DESC>
        </BODY>
      </ENVELOPE>`;

    const resp = await postToTally(envelope);

    const companies = resp?.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE || [];

    return res.json({
      ok: true,
      message: companies.length
        ? "Connected to Tally and fetched companies"
        : "Connected to Tally but no companies returned",
      companies
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({
      ok: false,
      message: "Failed to connect to Tally",
      error: err.message,
      detail: err.response?.data
    });
  }
}

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
              <SVCURRENTCOMPANY>${escapeXml('Test Company')}</SVCURRENTCOMPANY>
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

async function getAllLedgers(req, res) {
  try {
    const company = req.query.company || "Test Company";

    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>All Ledgers</ID>
      </HEADER>
      <BODY>
        <DESC>
          <STATICVARIABLES>
            <SVCURRENTCOMPANY>${escapeXml(company)}</SVCURRENTCOMPANY>
            <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          </STATICVARIABLES>
          <TDL>
            <TDLMESSAGE>
              <COLLECTION NAME="All Ledgers" ISINITIALIZE="Yes">
                <TYPE>Ledger</TYPE>
                <FETCH>Name,Parent,Alias,OpeningBalance,ClosingBalance,GUID</FETCH>
              </COLLECTION>
            </TDLMESSAGE>
          </TDL>
        </DESC>
      </BODY>
    </ENVELOPE>`;

    const resp = await postToTally(envelope);

    let tallyMessages = resp?.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE;

    let ledgers = [];
    if (Array.isArray(tallyMessages)) {
      ledgers = tallyMessages.map(msg => msg.LEDGER);
    } else if (tallyMessages?.LEDGER) {
      ledgers = [tallyMessages.LEDGER];
    }

    return res.json({ ok: true, count: ledgers.length, ledgers });
  } catch (err) {
    console.error("Error fetching ledgers:", err.message);
    return res.status(500).json({ ok: false, message: "Failed to fetch ledgers", error: err.message });
  }
}




module.exports = {
  connectToTally: connectToTally,
  createLedger: createLedger,
  getAllLedgers: getAllLedgers
}