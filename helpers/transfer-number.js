const generateTransferNumber = () => {
    let lastTimestamp = Date.now() % 1000;
    let counter = 100;
    const currentTimestamp = Date.now() % 1000;

    if (currentTimestamp !== lastTimestamp) {
        lastTimestamp = currentTimestamp;
        counter = 100;
    } else if (counter >= 999) {
        counter = 100 + Math.floor(Math.random() * 900);
    }

    const transferNumber = (currentTimestamp * 1000 + counter).toString().padStart(6, '0');
    counter += 1;

    return Number(transferNumber);

}

module.exports = {
    generateTransferNumber
}