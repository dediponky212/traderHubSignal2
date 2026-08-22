const portfolioService = require("../services/portofolioService");

exports.getPortfolio = async (req, res) => {
    try {
        const portfolio = await portfolioService.getPortfolio(req.user.id);

        if (!portfolio) return res.status(404).json({ success: false, message: "Trading account not found." });

        res.json({ success: true, ...portfolio });
    } catch (err) {
        console.error("PORTFOLIO ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { range = "today", from, to } = req.query;
        const trades = await portfolioService.getTradeHistory(req.user.id, { range, from, to });
        res.json({ success: true, trades });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.setVisibility = async (req, res) => {
    try {
        const { visibility } = req.body;
        const result = await portfolioService.setVisibility(req.user.id, visibility);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

exports.getTradingStyle = async (req, res) => {
    try {
        const data = await portfolioService.getTradingStyle(req.user.id);
        if (!data) return res.status(404).json({ success: false, message: "Trading account not found." });
        res.json({ success: true, ...data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};