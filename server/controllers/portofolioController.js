const portfolioService = require("../services/portofolioService");

exports.getPortfolio = async (req, res) => {
    try {
        const portfolio = await portfolioService.getPortfolio(req.user.id);

        if (!portfolio) return res.status(404).json({ success: false, message: "Trading account not found." });

        res.json({ success: true, ...portfolio });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};