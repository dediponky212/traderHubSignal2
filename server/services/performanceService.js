// Performance Ranking (catatan.md product #6): a leaderboard of accounts
// that have opted their portfolio public (mt_accounts.portfolio_visibility,
// the same toggle Portfolio.jsx already exposes) - private accounts never
// appear here, whether or not they'd rank well.
//
// Metrics are computed from real trade history only (trades + trades_archive
// - the daily maintenance job moves old CLOSED trades out of `trades`, so
// leaving trades_archive out would make long-tenured accounts look thinner
// than they really are). No external API involved.
const db = require("../config/database");

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null)));
    });
}

// Accounts with fewer closed trades than this are excluded from the
// leaderboard entirely - a handful of trades produces statistically
// meaningless metrics (e.g. 1 winning trade = "100% win rate") that would
// otherwise crowd out accounts with a real track record.
const MIN_TRADES_FOR_RANKING = 10;

// Composite score weights (0-1, sum to 1). A documented first-pass
// heuristic - catatan.md names the 7 parameters but not how to combine them
// into one ranking number, so these are a reasonable default, not a fixed
// spec. Easy to retune later since each metric is normalized independently
// before weighting.
const WEIGHTS = {
    winRate: 0.15,
    profitFactor: 0.20,
    maxDrawdownPercent: 0.20, // inverted: lower drawdown scores higher
    recoveryFactor: 0.15,
    sharpeRatio: 0.15,
    averageRR: 0.10,
    profitConsistency: 0.05,
};

function calculateDrawdown(equityPoints) {
    let peak = 0;
    let maxDrawdownPercent = 0;
    let maxDrawdownAmount = 0;

    for (const point of equityPoints) {
        const equity = Number(point.equity);
        if (!Number.isFinite(equity) || equity <= 0) continue;

        if (equity > peak) peak = equity;

        if (peak > 0) {
            const drawdownAmount = peak - equity;
            const drawdownPercent = (drawdownAmount / peak) * 100;
            if (drawdownPercent > maxDrawdownPercent) {
                maxDrawdownPercent = drawdownPercent;
                maxDrawdownAmount = drawdownAmount;
            }
        }
    }

    return {
        maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
        maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
    };
}

function standardDeviation(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
}

// All metrics for one account, from its full closed-trade history
// (trades + trades_archive). Returns null if the account doesn't meet
// MIN_TRADES_FOR_RANKING.
async function computeAccountMetrics(accountId) {
    const closedTrades = await query(
        `SELECT profit, close_time, created_at, equity FROM trades WHERE account_id = ? AND status = 'CLOSED'
         UNION ALL
         SELECT profit, close_time, created_at, equity FROM trades_archive WHERE account_id = ? AND status = 'CLOSED'
         ORDER BY close_time ASC`,
        [accountId, accountId]
    );

    if (closedTrades.length < MIN_TRADES_FOR_RANKING) return null;

    const wins = closedTrades.filter((t) => Number(t.profit) > 0);
    const losses = closedTrades.filter((t) => Number(t.profit) < 0);

    const grossProfit = wins.reduce((sum, t) => sum + Number(t.profit), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + Number(t.profit), 0));
    const totalProfit = grossProfit - grossLoss;

    const winRate = (wins.length / closedTrades.length) * 100;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 0;

    // Realized reward:risk proxy - average win vs average loss size. Not the
    // same as a planned entry/SL risk-reward ratio (that's not tracked per
    // trade), but the best available signal from closed-trade outcomes.
    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const averageRR = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;

    const { maxDrawdownPercent, maxDrawdownAmount } = calculateDrawdown(
        closedTrades.filter((t) => t.equity != null)
    );
    const recoveryFactor = maxDrawdownAmount > 0 ? totalProfit / maxDrawdownAmount : totalProfit > 0 ? totalProfit : 0;

    // Daily P&L series -> Sharpe-like ratio (mean / stdev, risk-free = 0)
    // and % of profitable trading days ("profit consistency"). This is a
    // platform-relative heuristic for ranking purposes, not an annualized
    // textbook Sharpe ratio.
    const dailyPnlMap = new Map();
    for (const t of closedTrades) {
        if (!t.close_time) continue;
        const day = String(t.close_time).slice(0, 10);
        dailyPnlMap.set(day, (dailyPnlMap.get(day) || 0) + Number(t.profit));
    }
    const dailyPnls = [...dailyPnlMap.values()];
    const meanDailyPnl = dailyPnls.length ? dailyPnls.reduce((a, b) => a + b, 0) / dailyPnls.length : 0;
    const stdevDailyPnl = standardDeviation(dailyPnls);
    const sharpeRatio = stdevDailyPnl > 0 ? meanDailyPnl / stdevDailyPnl : 0;
    const profitableDays = dailyPnls.filter((p) => p > 0).length;
    const profitConsistency = dailyPnls.length ? (profitableDays / dailyPnls.length) * 100 : 0;

    return {
        totalTrades: closedTrades.length,
        totalProfit: Number(totalProfit.toFixed(2)),
        winRate: Number(winRate.toFixed(2)),
        profitFactor: Number(profitFactor.toFixed(2)),
        maxDrawdownPercent,
        recoveryFactor: Number(recoveryFactor.toFixed(2)),
        sharpeRatio: Number(sharpeRatio.toFixed(2)),
        averageRR: Number(averageRR.toFixed(2)),
        profitConsistency: Number(profitConsistency.toFixed(2)),
    };
}

// Min-max normalize `key` across the cohort to a 0-1 scale so metrics on
// wildly different scales (win rate % vs profit factor vs Sharpe) can be
// weighted together. `invert` flips it for metrics where lower is better
// (drawdown).
function normalize(entries, key, invert = false) {
    const values = entries.map((e) => e.metrics[key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    entries.forEach((e) => {
        const scaled = (e.metrics[key] - min) / range;
        e._normalized[key] = invert ? 1 - scaled : scaled;
    });
}

async function getRanking() {
    const publicAccounts = await query(
        `SELECT mt.id AS account_id, mt.account_name, mt.broker, u.fullname
         FROM mt_accounts mt
         JOIN users u ON u.id = mt.user_id
         WHERE mt.portfolio_visibility = 'public'`
    );

    const entries = [];
    for (const account of publicAccounts) {
        const metrics = await computeAccountMetrics(account.account_id);
        if (!metrics) continue; // below MIN_TRADES_FOR_RANKING
        entries.push({
            accountId: account.account_id,
            displayName: account.account_name || account.fullname || "Trader",
            broker: account.broker || null,
            metrics,
            _normalized: {},
        });
    }

    if (entries.length === 0) return [];

    Object.keys(WEIGHTS).forEach((key) => {
        normalize(entries, key, key === "maxDrawdownPercent");
    });

    entries.forEach((e) => {
        const score = Object.entries(WEIGHTS).reduce(
            (sum, [key, weight]) => sum + e._normalized[key] * weight,
            0
        ) * 100;
        e.score = Number(score.toFixed(2));
    });

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((e, i) => {
        e.rank = i + 1;
        delete e._normalized;
    });

    return entries;
}

module.exports = {
    getRanking,
    computeAccountMetrics,
    MIN_TRADES_FOR_RANKING,
};
