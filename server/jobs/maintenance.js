// Daily maintenance: runs once per UTC calendar day (checked every 15 min so
// it fires close to midnight regardless of how long the process has been up,
// and also catches up immediately on boot if the server was down across a
// day boundary).
//
//  - ea_commands: hard-deleted for anything before today. It's a short-lived
//    command queue/ack log, not something the app displays as history beyond
//    "today" - nothing needs it kept, so there's no archive step for it.
//  - trades: never deleted, only archived (see tradeService.runTradeArchiving)
//    since it's real trading history.
const db = require("../config/database");
const tradeService = require("../services/tradeService");

function todayUTC() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

function cleanupOldCommands() {
    return new Promise((resolve, reject) => {
        const boundary = `${todayUTC()} 00:00:00`;
        db.run(`DELETE FROM ea_commands WHERE created_at < ?`, [boundary], function (err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
}

let lastRunDate = null;

async function runDailyMaintenance() {
    const today = todayUTC();
    if (lastRunDate === today) return;
    lastRunDate = today;

    try {
        const deleted = await cleanupOldCommands();
        if (deleted > 0) console.log(`[maintenance] Deleted ${deleted} ea_commands row(s) from before today.`);
    } catch (err) {
        console.error("[maintenance] ea_commands cleanup failed:", err.message);
    }

    try {
        const { archivedByAge, archivedByCap } = await tradeService.runTradeArchiving();
        if (archivedByAge > 0) console.log(`[maintenance] Archived ${archivedByAge} trade(s) older than 90 days.`);
        if (archivedByCap > 0) console.log(`[maintenance] Archived ${archivedByCap} trade(s) to keep the live table under its row cap.`);
    } catch (err) {
        console.error("[maintenance] Trade archiving failed:", err.message);
    }
}

function startMaintenanceScheduler() {
    runDailyMaintenance();
    const interval = setInterval(runDailyMaintenance, 15 * 60 * 1000);
    interval.unref?.();
}

module.exports = { startMaintenanceScheduler, runDailyMaintenance };
