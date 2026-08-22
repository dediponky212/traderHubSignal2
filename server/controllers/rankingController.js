const performanceService = require("../services/performanceService");

exports.getRanking = async (req, res) => {
    try {
        const ranking = await performanceService.getRanking();
        res.json({ success: true, ranking, minTradesRequired: performanceService.MIN_TRADES_FOR_RANKING });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};
