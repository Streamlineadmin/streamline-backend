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
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const getAgingBucket = (createdAt) => {
    if (!createdAt) return 'Unknown';
    const createdDate = new Date(createdAt);
    const today = new Date();
    const diffTime = today - createdDate;
    const ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (ageInDays <= 30) return '0–30 days';
    if (ageInDays <= 60) return '31–60 days';
    if (ageInDays <= 90) return '61–90 days';
    if (ageInDays <= 180) return '91–180 days';
    return '180+ days';
}

const getAgingBucket90Days = (createdAt) => {
    if (!createdAt) return 'Unknown';

    const createdDate = new Date(createdAt);
    const today = new Date();
    const diffTime = today - createdDate;
    const ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (ageInDays <= 30) return 'Fast Moving';
    if (ageInDays <= 90) return 'Slow Moving';
    return 'Non Moving';
};

module.exports = {
    generateTransferNumber,
    generateProductionId,
    getAgingBucket,
    getAgingBucket90Days
}