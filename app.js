const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');


const authenticationRoute = require('./routes/authentication');
const imageRoute = require('./routes/images');
const blogRoute = require('./routes/blogs');

const app = express();
// Define the CORS options
const corsOptions = {
    credentials: true,
    origin: ['http://localhost:3000', 'https://snycit.com', 'http://snycit.com/'] // Whitelist the domains you want to allow
};
app.use(cors(corsOptions)); // Use the cors middleware with your options

// Apply body-parser middleware to handle JSON request bodies
app.use(bodyParser.json());

// Define route for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
    //res.send("Welcome to EaseMargin APIs !");
});



// Use authentication routes for `/authentication` path
app.use('/authentication', authenticationRoute);
app.use('/images', imageRoute);
app.use('/blogs', blogRoute);
module.exports = app;
