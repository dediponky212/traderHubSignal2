const tradeService = require("../services/tradeService");

exports.getTrades = async (req, res) => {
    try {
        const rows = await tradeService.getTrades();
        res.json({
            success: true,
            data: rows
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

