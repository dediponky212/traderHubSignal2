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
    const account = await get(`SELECT id, balance, equity, portfolio_visibility FROM mt_accounts WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [userId]);

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
        ORDER BY close_time DESC
        LIMIT 20
    `, [account.id]);

        const performanceAll = await query(`
            SELECT created_at AS label, equity AS value
            FROM trades
            WHERE account_id = ? AND equity IS NOT NULL
            ORDER BY created_at ASC, id ASC
        `, [account.id]);

        const maxDrawdown = calculateMaxDrawdown(performanceAll);

        const performance = performanceAll.length > 150
            ? performanceAll.filter((_, i) => i % Math.ceil(performanceAll.length / 150) === 0)
            : performanceAll;

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
        visibility: account.portfolio_visibility || "private",
        summary: {
            balance: account.balance,
            equity: account.equity,
            totalProfit: summary.totalProfit,
            maxDrawdown: maxDrawdown,
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

function calculateMaxDrawdown(data) {
    let peak = 0;
    let maxDrawdown = 0;

    for (const item of data) {
        const equity = Number(item.value);

        if (!Number.isFinite(equity) || equity <= 0) continue;

        if (equity > peak) peak = equity;

        if (peak > 0) {
            const drawdown = ((peak - equity) / peak) * 100;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        }
    }

    return Number(maxDrawdown.toFixed(2));
}

function getHistoryRange(range, from, to) {
    const now = new Date();

    if (range === "today") {
        const date = now.toISOString().slice(0, 10);
        return { from: date, to: date };
    }

    if (range === "week") {
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1;
        const start = new Date(now);
        start.setDate(now.getDate() - diff);

        return {
            from: start.toISOString().slice(0, 10),
            to: now.toISOString().slice(0, 10),
        };
    }

    if (range === "month") {
        return {
            from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
            to: now.toISOString().slice(0, 10),
        };
    }

    if (range === "custom" && from && to) {
        return { from, to };
    }

    return null;
}

exports.getTradeHistory = async (userId, filter = {}) => {
    const account = await get(`SELECT id FROM mt_accounts WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [userId]);

    if (!account) return [];

    const dateRange = getHistoryRange(filter.range, filter.from, filter.to);

    return query(`
        SELECT id, ticket, symbol, action AS type, volume, open_price, close_price, profit, open_time, close_time
        FROM trades
        WHERE account_id = ?
          AND status = 'CLOSED'
          AND date(close_time) BETWEEN date(?) AND date(?)
        ORDER BY close_time DESC
        LIMIT 100
    `, [account.id, dateRange?.from || "1900-01-01", dateRange?.to || "2999-12-31"]);
};

exports.setVisibility = async (userId, visibility) => {
    if (visibility !== "public" && visibility !== "private") {
        const err = new Error("Visibility must be 'public' or 'private'.");
        err.status = 400;
        throw err;
    }

    const account = await get(`SELECT id FROM mt_accounts WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [userId]);
    if (!account) {
        const err = new Error("Trading account not found.");
        err.status = 404;
        throw err;
    }

    await new Promise((resolve, reject) => {
        db.run(
            `UPDATE mt_accounts SET portfolio_visibility = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [visibility, account.id],
            (err) => (err ? reject(err) : resolve())
        );
    });

    return { visibility };
};

exports.getTradingStyle = async (userId) => {
    const account = await get(`SELECT id FROM mt_accounts WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [userId]);

    if (!account) return null;

    const stats = await get(`
        SELECT
            COUNT(*) AS totalTrades,
            SUM(CASE WHEN (julianday(close_time) - julianday(open_time)) * 86400 < 300 THEN 1 ELSE 0 END) AS fastTrades
        FROM trades
        WHERE account_id = ?
          AND status = 'CLOSED'
          AND open_time IS NOT NULL
          AND close_time IS NOT NULL
    `, [account.id]);

    const totalTrades = Number(stats?.totalTrades || 0);
    const fastTrades = Number(stats?.fastTrades || 0);
    const fastTradeRate = totalTrades ? (fastTrades / totalTrades) * 100 : 0;

    let style = "Normal";
    let risk = "Low";

    if (fastTradeRate >= 50) {
        style = "Scalping";
        risk = "High";
    } else if (fastTradeRate >= 25) {
        style = "Fast Trading";
        risk = "Medium";
    }

    return {
        style,
        risk,
        totalTrades,
        fastTrades,
        fastTradeRate: Number(fastTradeRate.toFixed(2)),
    };
};