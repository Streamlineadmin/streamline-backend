const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

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

const generateProductionId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = {
    generateTransferNumber,
    generateProductionId
}