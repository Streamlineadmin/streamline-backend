const pdfParse = require('pdf-parse');
const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');

// Extract text from PDF file
function extractTextFromPDF(filePath) {
    return new Promise((resolve, reject) => {
        const dataBuffer = fs.readFileSync(filePath);
        pdfParse(dataBuffer).then(data => {
            resolve(data.text);
        }).catch(err => reject(err));
    });
}

// Train the model based on the extracted text
function trainModelOnText(text) {
    // Here you would include your text processing and model training logic
    return new Promise(async (resolve, reject) => {
        try {
            const tokens = tokenizeText(text); // Tokenization method assumed
            const vocabulary = [...new Set(tokens)];
            const inputData = tokens.map(token => vocabulary.indexOf(token));
            const inputTensor = tf.tensor2d([inputData], [1, inputData.length]);

            const model = tf.sequential();
            model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [vocabulary.length] }));
            model.add(tf.layers.dense({ units: vocabulary.length, activation: 'softmax' }));

            model.compile({ optimizer: tf.train.adam(), loss: 'categoricalCrossentropy' });
            await model.fit(inputTensor, inputTensor, { epochs: 10 });

            await model.save(`file://./models/pdf-model`);
            resolve({ message: 'Model trained successfully' });
        } catch (error) {
            reject(error);
        }
    });
}

// API endpoint to train the model with a PDF
function trainModel(req, res) {
    // Assuming the PDF is uploaded and saved to the 'uploads/' directory
    const pdfFilePath = req.file.path;

    extractTextFromPDF(pdfFilePath)
        .then(pdfText => {
            return trainModelOnText(pdfText);
        })
        .then(result => {
            res.status(201).json(result);
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error
            });
        });
}

// Load the trained model and predict based on input text
function predictText(text) {
    return new Promise(async (resolve, reject) => {
        try {
            const tokens = tokenizeText(text); // Tokenization logic assumed
            const vocabulary = [...new Set(tokens)];
            const inputData = tokens.map(token => vocabulary.indexOf(token));
            const inputTensor = tf.tensor2d([inputData], [1, inputData.length]);

            const model = await tf.loadLayersModel(`file://./models/pdf-model/model.json`);
            const predictions = model.predict(inputTensor);
            const predictedIndex = predictions.argMax(-1).dataSync()[0];

            resolve({ prediction: vocabulary[predictedIndex] });
        } catch (error) {
            reject(error);
        }
    });
}

// API endpoint for making predictions
function predict(req, res) {
    predictText(req.body.text)
        .then(result => {
            res.status(200).json(result);
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error
            });
        });
}

module.exports = {
    trainModel: trainModel,
    predict: predict,
};

