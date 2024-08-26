const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const authenticationRoute = require('./routes/authentication');
const imageRoute = require('./routes/images');
const blogRoute = require('./routes/blogs');
const teamRoute = require('./routes/teams');
const userRoute = require('./routes/users');
const storeRoute = require('./routes/stores');

const app = express();

// Apply body-parser middleware to handle JSON request bodies
app.use(bodyParser.json());

// Define the CORS options
const corsOptions = {
    origin: '*',
    credentials: true, // Allow credentials (e.g., cookies, authorization headers)
};

// Use the cors middleware with your options
app.use(cors(corsOptions));

// Define route for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
    //res.send("Welcome to EaseMargin APIs !");
});

// Use authentication routes for `/authentication` path
app.use('/authentication', authenticationRoute);
app.use('/images', imageRoute);
app.use('/blogs', blogRoute);
app.use('/teams', teamRoute);
app.use('/users', userRoute);
app.use('/stores', storeRoute);

module.exports = app;
