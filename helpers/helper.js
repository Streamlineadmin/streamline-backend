const axios = require('axios');

function getTodayDateInIST() {
    const date = new Date();
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));

    const day = String(istDate.getDate()).padStart(2, '0');
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const year = istDate.getFullYear();

    return `${day}/${month}/${year}`;
}

const gstStateCodes = {
    "Jammu and Kashmir": "01",
    "Himachal Pradesh": "02",
    "Punjab": "03",
    "Chandigarh": "04",
    "Uttarakhand": "05",
    "Haryana": "06",
    "Delhi": "07",
    "Rajasthan": "08",
    "Uttar Pradesh": "09",
    "Bihar": "10",
    "Sikkim": "11",
    "Arunachal Pradesh": "12",
    "Nagaland": "13",
    "Manipur": "14",
    "Mizoram": "15",
    "Tripura": "16",
    "Meghalaya": "17",
    "Assam": "18",
    "West Bengal": "19",
    "Jharkhand": "20",
    "Odisha": "21",
    "Chhattisgarh": "22",
    "Madhya Pradesh": "23",
    "Gujarat": "24",
    "Dadra & Nagar Haveli and Daman & Diu": "26",
    "Maharashtra": "27",
    "Karnataka": "29",
    "Goa": "30",
    "Lakshadweep": "31",
    "Kerala": "32",
    "Tamil Nadu": "33",
    "Puducherry": "34",
    "Andaman & Nicobar Islands": "35",
    "Telangana": "36",
    "Andhra Pradesh": "37",
    "Ladakh": "38",
};


const createEWayBill = async () => {
    try {
        const obj = {
            supplyType: "O",
            subSupplyType: "1",
            subSupplyDesc: " ",
            docType: "INV",
            docNo: "susri/257",
            docDate: getTodayDateInIST(),
            fromGstin: "05AAACH6188F1ZM",
            fromTrdName: "welton",
            fromAddr1: "2ND CROSS NO 59  19  A",
            fromAddr2: "GROUND FLOOR OSBORNE ROAD",
            fromPlace: "FRAZER TOWN",
            actFromStateCode: 5,
            fromPincode: 263652,
            fromStateCode: 5,
            toGstin: "05AAACH6886N1Z0",
            toTrdName: "sthuthya",
            toAddr1: "Shree Nilaya",
            toAddr2: "Dasarahosahalli",
            toPlace: "Beml Nagar",
            toPincode: 263680,
            actToStateCode: 5,
            toStateCode: 5,
            transactionType: 4,
            dispatchFromGSTIN: "05AAACH6188F1ZM",
            dispatchFromTradeName: "ABC Traders",
            shipToGSTIN: "05AAACH6886N1Z0",
            shipToTradeName: "XYZ Traders",
            totalValue: 56099,
            cgstValue: 150.34,
            sgstValue: 150.34,
            igstValue: 0,
            totInvValue: 56399.68,
            transMode: "1",
            transDistance: "67",
            transDocNo: "12",
            transDocDate: getTodayDateInIST(),
            vehicleNo: "APR3214",
            vehicleType: "R",
            itemList: [
                {
                    productName: "Wheat",
                    productDesc: "Wheat",
                    hsnCode: 1001,
                    quantity: 4,
                    qtyUnit: "BOX",
                    taxableAmount: 56099,
                    sgstRate: 1.5,
                    cgstRate: 1.5,
                },
            ],
        };


        const response = await axios.post(
            "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/genewaybill",
            obj,
            {
                headers: {
                    "Content-Type": "application/json",
                    "client_id": process.env.LOCAL_CLIENT_ID,
                    "client_secret": process.env.LOCAL_CLIENT_SECRET,
                    "gstin": process.env.GSTIN,
                    "ip_address": "192.68.45.45"
                },
                params: {
                    email: process.env.EMAIL,
                },
            }
        );

        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error.response?.data || error.message);
    }
}

module.exports = {
    createEWayBill,
    getTodayDateInIST,
    gstStateCodes
}