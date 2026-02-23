const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const generateTransferNumber = () => {
  const timePart = Date.now() % 1_000_000;
  const randomPart = Math.floor(Math.random() * 900) + 100;
  const num = Number(
    `${timePart.toString().padStart(6, '0')}${randomPart}`
  );
  return num < 100000000 ? num + 100000000 : num;
};


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