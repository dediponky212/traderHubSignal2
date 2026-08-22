const db = require("../config/database");
const signalService = require("../services/signalService");

function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}

function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
}

function getAccount(accountNumber) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT
                id,
                user_id,
                account_number,
                account_token,
                connected,
                balance,
                equity,
                ea_role
            FROM mt_accounts
            WHERE account_number = ?`,
            [accountNumber],
            (err, row) => {
                if (err)
                    return reject(err);
                resolve(row || null);
            }
        );
    });
}

exports.saveTrade = async (data) => {
    const account = await getAccount(data.account_number);
    if (!account) {
        return {
            success: false,
            message: "Trading account not found."
        };
    }
    // account_number alone isn't a secret - require the matching token so a
    // spoofed account_number can't inject fake OPEN/CLOSE/MODIFY trade events.
    if (!data.account_token || account.account_token !== data.account_token) {
        return {
            success: false,
            message: "Invalid account token."
        };
    }
    data.user_id = account.user_id;
    data.account_id = account.id;
    data.balance = account.balance;
    data.equity = account.equity;
    let result;
    switch (data.event) {
        case "OPEN":
            result = await insertTrade(data);
            break;
        case "MODIFY":
            result = await updateTrade(data);
            break;
        case "CLOSE":
            result = await closeTrade(data);
            break;
        case "PENDING_ADD":
        case "PENDING_UPDATE":
        case "PENDING_DELETE":
            result = await pendingTrade(data);
            break;
        default:
            return {
                success: false,
                message: "Unknown event."
            };
    }
    //Hanya master yang menjadi sumber signal
    if (result.success && account.ea_role === "MASTER") {
        await signalService.createSignal(buildSignalData(data, account));
    }
    return result;
};

function buildSignalData(data, account) {
    let type = "UNKNOWN";

    if (data.event === "OPEN") type = "OPEN";
    else if (data.event === "MODIFY") type = "MODIFY";
    else if (data.event === "CLOSE") type = "CLOSE";

    return {
        master_account_id: account.id,
        symbol: data.symbol,
        type,
        action: data.action || "",
        price_from: data.price || 0,
        price_to: data.price || 0,
        sl: data.sl || 0,
        tp: data.tp || 0,
        source: "EA"
    };
}

function insertTrade(data) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO trades (
                user_id,
                account_id,
                ticket,
                symbol,
                action,
                status,
                volume,
                open_price,
                sl,
                tp,
                magic,
                comment,
                balance,
                equity,
                open_time
            )
            VALUES
            (
                ?,?,?,?,?,?,
                ?,?,?,?,?,?,
                ?,?,
                CURRENT_TIMESTAMP
            ) `,
            [
                data.user_id,
                data.account_id,
                data.ticket,
                data.symbol,
                data.action,
                "RUNNING",
                data.volume,
                data.price,
                data.sl,
                data.tp,
                data.magic,
                data.comment,
                data.balance,
                data.equity,
            ],
            function (err) {
                if (err) 
                    return reject(err);
                resolve({
                    success: true,
                    message: "OPEN saved."
                });
            }
        );
    });
}

function updateTrade(data) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE trades
            SET
                sl = ?,
                tp = ?,
                balance = ?,
                equity = ?,
                modify_time = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE
                account_id = ?
            AND
                ticket = ? `,
            [
                data.sl,
                data.tp,
                data.balance,
                data.equity,
                data.account_id,
                data.ticket
            ],
            function(err){
                if(err)
                    return reject(err);
                resolve({
                    success:true,
                    message:"MODIFY updated."
                });
            }
        );
    });
}

function closeTrade(data){
    return new Promise((resolve,reject)=>{
        db.run(
            `UPDATE trades
            SET
                status='CLOSED',
                close_price=?,
                profit=?,
                swap=?,
                commission=?,
                balance=?,
                equity=?,
                close_time=CURRENT_TIMESTAMP,
                updated_at=CURRENT_TIMESTAMP
            WHERE
                account_id=?
            AND
                ticket=?`,
            [
                data.price,
                data.profit,
                data.swap,
                data.commission,
                data.balance,
                data.equity,
                data.account_id,
                data.ticket
            ],
            function(err){
                if(err)
                    return reject(err);
                resolve({
                    success:true,
                    message:"CLOSE updated."
                });
            }
        );
    });
    
}

function pendingTrade(data){
    return Promise.resolve({
        success:true
    });
}

// Reconciles the "trades" table against the real snapshot of open positions
// the EA just reported in its heartbeat. Anything still marked RUNNING that
// the EA no longer reports gets closed out (it missed a CLOSE event, was
// closed manually, or is stale leftover data). Anything the EA reports gets
// upserted in a single bulk statement - not one UPDATE-then-maybe-INSERT per
// position - so a heartbeat carrying N positions costs 2 queries total
// instead of up to 2*N. The bulk INSERT...ON CONFLICT also makes the upsert
// atomic, closing the race where two overlapping heartbeats for the same
// account could previously both "miss" on UPDATE and both INSERT the same
// ticket (relies on the idx_trade_account_ticket UNIQUE index).
exports.syncPositions = (userId, accountId, livePositions) => {
    return new Promise((resolve) => {
        const tickets = livePositions
            .map((p) => Number(p.ticket))
            .filter((t) => Number.isFinite(t) && t > 0);

        const closeStale = () => {
            const sql = tickets.length
                ? `UPDATE trades SET status='CLOSED', close_time=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
                   WHERE account_id = ? AND status = 'RUNNING' AND ticket NOT IN (${tickets.map(() => "?").join(",")})`
                : `UPDATE trades SET status='CLOSED', close_time=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
                   WHERE account_id = ? AND status = 'RUNNING'`;
            const params = tickets.length ? [accountId, ...tickets] : [accountId];

            db.run(sql, params, (err) => {
                if (err) console.error("syncPositions closeStale error:", err.message);
                upsertLive();
            });
        };

        const upsertLive = () => {
            if (livePositions.length === 0) return resolve(true);

            const rowSql = "(?, ?, ?, ?, ?, 'RUNNING', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
            const sql = `
                INSERT INTO trades (
                    user_id, account_id, ticket, symbol, action, status,
                    volume, open_price, sl, tp, current_price, profit, swap, open_time, updated_at
                ) VALUES ${livePositions.map(() => rowSql).join(",")}
                ON CONFLICT(account_id, ticket) DO UPDATE SET
                    sl = excluded.sl,
                    tp = excluded.tp,
                    volume = excluded.volume,
                    current_price = excluded.current_price,
                    profit = excluded.profit,
                    swap = excluded.swap,
                    status = 'RUNNING',
                    updated_at = CURRENT_TIMESTAMP
            `;

            const params = livePositions.flatMap((p) => {
                const openTime = p.open_time
                    ? new Date(Number(p.open_time) * 1000).toISOString()
                    : new Date().toISOString();

                return [
                    userId, accountId, p.ticket, p.symbol, p.action,
                    p.volume, p.price, p.sl, p.tp,
                    p.current_price, p.profit, p.swap, openTime,
                ];
            });

            db.run(sql, params, (err) => {
                if (err) console.error("syncPositions upsert error:", err.message);
                resolve(true);
            });
        };

        closeStale();
    });
};

exports.getOpenPositions = (userId) => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT
                ticket,
                symbol,
                action,
                volume,
                open_price,
                current_price,
                sl,
                tp,
                profit,
                swap,
                open_time
            FROM trades
            WHERE user_id = ?
              AND status = 'RUNNING'
            ORDER BY open_time DESC`,
            [userId],
            (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows || []);
            }
        );
    });
};

// Start/end of "today" (UTC calendar day) as the same "YYYY-MM-DD HH:MM:SS"
// text format the timestamps are stored in, so a plain >=/< range comparison
// works and can use an index - date(col) = date('now') can't, because
// wrapping a column in a function defeats index lookups on any SQL engine.
function utcDayBounds(now = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)} 00:00:00`;
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    return { start: fmt(y, m, d), end: fmt(y, m, d + 1) };
}

// Trading history for "today" - any trade opened OR closed today (UTC
// calendar day, consistent with the rest of the app), most recent first.
exports.getTodayHistory = (userId) => {
    return new Promise((resolve, reject) => {
        const { start, end } = utcDayBounds();
        db.all(
            `SELECT
                ticket,
                symbol,
                action,
                status,
                volume,
                open_price,
                close_price,
                profit,
                swap,
                open_time,
                close_time
            FROM trades
            WHERE user_id = ?
              AND (
                (open_time >= ? AND open_time < ?)
                OR (close_time >= ? AND close_time < ?)
              )
            ORDER BY COALESCE(close_time, open_time) DESC`,
            [userId, start, end, start, end],
            (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows || []);
            }
        );
    });
};

exports.getTrades = () => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT
                ticket,
                symbol,
                action,
                status,
                volume,
                open_price,
                close_price,
                profit,
                open_time,
                close_time
            FROM trades
            ORDER BY id DESC
            LIMIT 100`,
            [],
            (err, rows) => {
                if (err)
                    return reject(err);
                resolve(rows);
            }
        );
    });
};

// ============================================================
// TRADE ARCHIVING (called by server/jobs/maintenance.js, once/day)
//
// Two independent triggers, both only ever moving CLOSED rows (RUNNING
// positions must stay in the live table):
//   1. Age: anything closed more than ARCHIVE_AGE_DAYS ago - checked and
//      moved daily in small batches, instead of one huge quarterly dump
//      that could lock the table for a long stretch.
//   2. Row cap: if `trades` still grows past TRADES_ROW_CAP faster than
//      age-based archiving clears it out (e.g. a burst of activity), the
//      oldest CLOSED rows are archived down to TRADES_ROW_TARGET so the
//      table's maximum size stays bounded regardless of trade volume.
// ============================================================

const ARCHIVE_AGE_DAYS = 90; // ~3 months
const TRADES_ROW_CAP = 200000; // triggers size-based archiving once exceeded
const TRADES_ROW_TARGET = 150000; // archives the oldest CLOSED rows down to this
const ARCHIVE_BATCH_LIMIT = 5000; // caps how much one run moves, so a large backlog archives gradually across several days instead of one giant transaction

const TRADE_COLUMNS = [
    "id", "user_id", "account_id", "ticket", "position_id", "order_id", "deal_id",
    "symbol", "action", "status", "volume", "open_price", "close_price", "sl", "tp",
    "commission", "swap", "profit", "magic", "comment", "open_time", "close_time",
    "modify_time", "balance", "equity", "sync_status", "created_at", "updated_at",
    "current_price",
];

async function archiveTradeIds(ids) {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => "?").join(",");
    const cols = TRADE_COLUMNS.join(", ");

    await runAsync("BEGIN IMMEDIATE TRANSACTION");
    try {
        await runAsync(
            `INSERT INTO trades_archive (${cols}) SELECT ${cols} FROM trades WHERE id IN (${placeholders})`,
            ids
        );
        await runAsync(`DELETE FROM trades WHERE id IN (${placeholders})`, ids);
        await runAsync("COMMIT");
        return ids.length;
    } catch (err) {
        await runAsync("ROLLBACK").catch(() => {});
        throw err;
    }
}

async function archiveByAge() {
    const boundary = new Date(Date.now() - ARCHIVE_AGE_DAYS * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 19).replace("T", " ");

    const rows = await allAsync(
        `SELECT id FROM trades WHERE status = 'CLOSED' AND close_time < ? LIMIT ?`,
        [boundary, ARCHIVE_BATCH_LIMIT]
    );
    return archiveTradeIds(rows.map((r) => r.id));
}

async function archiveByRowCap() {
    const [{ count }] = await allAsync(`SELECT COUNT(*) AS count FROM trades`);
    if (count <= TRADES_ROW_CAP) return 0;

    const excess = Math.min(count - TRADES_ROW_TARGET, ARCHIVE_BATCH_LIMIT);
    const rows = await allAsync(
        `SELECT id FROM trades WHERE status = 'CLOSED' ORDER BY close_time ASC LIMIT ?`,
        [excess]
    );
    return archiveTradeIds(rows.map((r) => r.id));
}

exports.runTradeArchiving = async () => {
    let archivedByAge = 0;
    let archivedByCap = 0;

    try {
        archivedByAge = await archiveByAge();
    } catch (err) {
        console.error("archiveByAge error:", err.message);
    }

    try {
        archivedByCap = await archiveByRowCap();
    } catch (err) {
        console.error("archiveByRowCap error:", err.message);
    }

    return { archivedByAge, archivedByCap };
};