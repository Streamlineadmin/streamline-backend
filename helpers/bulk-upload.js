const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const requiredColumnsFun = (key) => {
    let colsObject = {
        bulkUpload: ['* Item ID', '* Item Name', '* Item Type', '* Metrics Unit', 'Category', 'Sub Category', 'Micro Category', 'HSN', 'Price', 'Tax Type', 'Tax', 'Min Stock', 'Max Stock', 'Description'],
        bulkEdit: ['Item ID', 'Item Name', 'Item type', 'Category', 'Sub Category', 'Micro Category', 'HSN', 'Price', 'Tax Type', 'Tax', 'Min Stock', 'Max Stock', 'Description'],
        reconcileStock: ['Item ID', 'Item Name', 'Current Stock', 'Final Stock', 'Price/Unit', 'comment'],
        alternateUnit: ['* Item ID', 'Item Name', '* Base Unit', '* Alternate Unit', '* Conversion Factor']
    }
    return colsObject[key] || [];
}

const convertXlsxToJson = async (filePath, key) => {
    try {
        const directory = path.join(__dirname, '..', 'uploads', filePath);
        if (!fs.existsSync(directory)) {
            throw new Error('File does not exist');
        }
        const workbook = xlsx.readFile(directory);
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new Error('No sheets found in the Excel file');
        }
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        const requiredColumns = requiredColumnsFun(key);
        const filteredData = jsonData.map(row => {
            let filteredRow = {};
            filteredRow.customFields = {};
            const keys = Object.keys(row);
            for (const element in keys) {
                if (!requiredColumns.includes(keys[element])) {
                    filteredRow.customFields[keys[element]] = row[keys[element]];
                }
            }
            requiredColumns.forEach(col => {
                const matchingKey = Object.keys(row).find(header => header.trim() === col.trim());
                if (matchingKey) {
                    filteredRow[col] = row[matchingKey];
                }
            });
            return filteredRow;
        });
        fs.unlink(directory, (err) => {
        });
        return filteredData;
    } catch (error) {
        throw new Error(`Error processing file: ${error.message}`);
    }
};

module.exports = convertXlsxToJson;