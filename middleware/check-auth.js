const jwt = require('jsonwebtoken');

function checkAuth(req, res, next) {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, 'JWT_KEY');
        req.userData = decodedToken;
        next();
    } catch(error) {
        return res.status(401).json({
            'message' : "Invalid or Expired token!",
            'error': error
        });
    }
}

module.exports = {
    checkAuth: checkAuth
}