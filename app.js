const express = require('express');
const bodyParser = require('body-parser');

const authenticationRoute = require('./routes/authentication');

const app = express();

// Apply body-parser middleware to handle JSON request bodies
app.use(bodyParser.json());

// Define route for the root URL
app.get('/', (req, res) => {
    res.send("Welcome to EaseMargin APIs !");
});

// Use authentication routes for `/authentication` path
app.use('/authentication', authenticationRoute);

module.exports = app;
