const { verifyToken } = require("../utils/jwt");

function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Access token required",
        });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    try {

        const decoded = verifyToken(token);

        req.user = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            message: "Invalid or expired token",
        });

    }
}

module.exports = authMiddleware;