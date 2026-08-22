const robotService = require("../services/robotService");

exports.createRobot = async (req, res) => {
    try {
        const robot = await robotService.createRobot(req.user.id, req.body);
        res.status(201).json({ success: true, robot });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

exports.listRobots = async (req, res) => {
    try {
        const robots = await robotService.listRobots(req.user.id);
        res.json({ success: true, robots });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

exports.getRobot = async (req, res) => {
    try {
        const robot = await robotService.getRobot(req.user.id, req.params.id);
        res.json({ success: true, robot });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

exports.updateRobot = async (req, res) => {
    try {
        const robot = await robotService.updateRobot(req.user.id, req.params.id, req.body);
        res.json({ success: true, robot });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};

exports.deleteRobot = async (req, res) => {
    try {
        await robotService.deleteRobot(req.user.id, req.params.id, req.user.role);
        res.json({ success: true });
    } catch (err) {
        res.status(err.status || 500).json({ success: false, message: err.message });
    }
};
