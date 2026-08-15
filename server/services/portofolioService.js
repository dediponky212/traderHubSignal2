const db = require("../config/database");

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => err ? reject(err) : resolve(row || null));
    });
}

exports.getPortfolio = async (userId) => {
    const account = await get(`SELECT id, balance, equity FROM mt_accounts WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [userId]);

    if (!account) return null;

    const summary = await get(`
        SELECT
            COALESCE(SUM(CASE WHEN status = 'CLOSED' THEN profit ELSE 0 END), 0) AS totalProfit,
            COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) AS totalTrades,
            COUNT(CASE WHEN status = 'RUNNING' THEN 1 END) AS openPositions,
            COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) AS closedTrades,
            COUNT(CASE WHEN status = 'CLOSED' AND profit > 0 THEN 1 END) AS winningTrades,
            COUNT(CASE WHEN status = 'CLOSED' AND profit < 0 THEN 1 END) AS losingTrades,
            COALESCE(SUM(CASE WHEN status = 'CLOSED' AND profit > 0 THEN profit ELSE 0 END), 0) AS grossProfit,
            ABS(COALESCE(SUM(CASE WHEN status = 'CLOSED' AND profit < 0 THEN profit ELSE 0 END), 0)) AS grossLoss,
            COALESCE(AVG(CASE WHEN status = 'CLOSED' THEN profit END), 0) AS averageTrade
        FROM trades
        WHERE account_id = ?
    `, [account.id]);

    const winRate = summary.totalTrades ? (summary.winningTrades / summary.totalTrades) * 100 : 0;
    const profitFactor = summary.grossLoss ? summary.grossProfit / summary.grossLoss : 0;

    const firstBalance = await get(`SELECT balance FROM trades WHERE account_id = ? ORDER BY id ASC LIMIT 1`, [account.id]);
    const initialBalance = firstBalance?.balance || account.balance || 0;
    const returnPct = initialBalance ? (summary.totalProfit / initialBalance) * 100 : 0;

    const recentTrades = await query(`
        SELECT id, ticket, symbol, action AS type, volume, open_price, close_price, profit, open_time, close_time
        FROM trades
        WHERE account_id = ? AND status = 'CLOSED'
        ORDER BY id DESC
        LIMIT 20
    `, [account.id]);

    const performance = await query(`
        SELECT created_at AS label, equity AS value
        FROM trades
        WHERE account_id = ? AND equity IS NOT NULL
        ORDER BY id ASC
        LIMIT 100
    `, [account.id]);

    const monthly = await query(`
        SELECT strftime('%Y-%m', close_time) AS label, SUM(profit) AS value
        FROM trades
        WHERE account_id = ? AND status = 'CLOSED' AND close_time IS NOT NULL
        GROUP BY strftime('%Y-%m', close_time)
        ORDER BY label ASC
        LIMIT 12
    `, [account.id]);

    const runningPositions = await query(`
        SELECT id, ticket, symbol, action AS type, volume, open_price, sl, tp, open_time
        FROM trades
        WHERE account_id = ? AND status = 'RUNNING'
        ORDER BY id DESC
    `, [account.id]);

    return {
        summary: {
            balance: account.balance,
            equity: account.equity,
            totalProfit: summary.totalProfit,
            maxDrawdown: 0,
            return: returnPct,
            winRate,
            profitFactor,
            averageTrade: summary.averageTrade,
            totalTrades: summary.totalTrades,
            openPositions: summary.openPositions,
            closedTrades: summary.closedTrades,
            winningTrades: summary.winningTrades,
            losingTrades: summary.losingTrades
        },
        performance,
        monthly,
        recentTrades,
        runningPositions
    };
};