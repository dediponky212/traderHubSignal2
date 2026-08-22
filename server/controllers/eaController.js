const db = require("../config/database");
const tradeService = require("../services/tradeService");

exports.connect = (req, res) => {
    const {
        account_number,
        account_name,
        server_name,
        magic,
        account_token,
        status,
    } = req.body;
    if (!account_number || !account_token) {
        return res.status(400).json({
            success: false,
            connected: false,
            activated: false,
            message: "Account number and token required",
        });
    }

    db.get(
        `SELECT
            mt_accounts.*,
            ea_settings.ea_enabled,
            ea_settings.subscription_expired,
            ea_settings.follow_signal,
            ea_settings.copy_signal,
            ea_settings.copy_trading
        FROM mt_accounts
        LEFT JOIN ea_settings
            ON mt_accounts.user_id = ea_settings.user_id
        WHERE mt_accounts.account_number = ?`,
        [account_number],
        async (err, account) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    connected: false,
                    activated: false,
                    message: err.message,
                });
            }
            if (!account) {
                return res.status(401).json({
                    success: false,
                    connected: false,
                    activated: false,
                    message: "Trading account not registered.",
                });
            }
            if (account.account_token !== account_token) {
                return res.status(401).json({
                    success: false,
                    connected: false,
                    activated: false,
                    message: "Invalid account token."
                });
            }
            if (account.account_name !== account_name ||
                account.server_name !== server_name) {
                return res.status(401).json({
                    success: false,
                    connected: false,
                    activated: false,
                    message: "Account information mismatch."
                });
            }
            if (account.ea_enabled === 0) {
                return res.status(403).json({
                    success: false,
                    connected: false,
                    activated: false,
                    message: "EA disabled.",
                });
            }
            db.run(
                `UPDATE mt_accounts
                SET
                    connected=1,
                    last_ping=CURRENT_TIMESTAMP,
                    updated_at=CURRENT_TIMESTAMP
                WHERE id=?`,
                [account.id]
            );
            const role = await getEARole(account.id, account.user_id);
           return res.json({
                success: true,
                connected: true,
                activated: true,
                heartbeat: 5,
                status: account.ea_role,
                message: "EA Connected"
            });

        }
    );

};

exports.heartbeat = (req, res) => {

    const {
        account_number,
        account_token,
        balance,
        equity,
        margin,
        free_margin,
        margin_level,
        broker,
        terminal_build,
        platform,
        symbol,
        point,
        digits,
        bid,
        ask,
        positions
    } = req.body;

    db.get(
        `
        SELECT
            mt_accounts.*,
            ea_settings.ea_enabled,
            ea_settings.follow_signal,
            ea_settings.copy_signal,
            ea_settings.copy_trading,
            ea_settings.subscription_expired
        FROM mt_accounts
        LEFT JOIN ea_settings
            ON mt_accounts.user_id = ea_settings.user_id
        WHERE mt_accounts.account_number = ?
        `,
        [account_number],

        (err, account) => {

            // =========================
            // ACCOUNT ERROR
            // =========================
            if (err) {
                return res.status(500).json({
                    success: false,
                    connected: false,
                    activated: false,
                    commands: [],
                    signals: [],
                    message: err.message
                });
            }

            // =========================
            // ACCOUNT NOT FOUND
            // =========================
            if (!account) {
             //   const role = await getEARole(account.id, account.user_id);
             //   const activated = account.ea_enabled === 1;
                return res.status(404).json({
                    success: false,
                    connected: false,
                    activated: false,
                    commands: [],
                    signals: [],
                    message: "Account not found"
                });
            }

            // =========================
            // AUTH: account_token must match this account
            // =========================
            if (!tokenMatches(account, account_token)) {
                return res.status(401).json({
                    success: false,
                    connected: false,
                    activated: false,
                    commands: [],
                    signals: [],
                    message: "Invalid account token."
                });
            }

            // =========================
            // UPDATE ACCOUNT STATUS
            // =========================
            db.run(
                `
                UPDATE mt_accounts
                SET
                    balance = ?,
                    equity = ?,
                    margin = ?,
                    free_margin = ?,
                    margin_level = ?,
                    broker = ?,
                    terminal_build = ?,
                    platform = ?,
                    symbol = ?,
                    point = ?,
                    digits = ?,
                    bid = ?,
                    ask = ?,
                    connected = 1,
                    last_ping = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE account_number = ?
                `,
                [
                    balance,
                    equity,
                    margin,
                    free_margin,
                    margin_level,
                    broker,
                    terminal_build,
                    platform,
                    symbol,
                    point,
                    digits,
                    bid,
                    ask,
                    account_number
                ]
            );

            // =========================
            // RECONCILE OPEN POSITIONS
            // (best-effort, doesn't block the heartbeat response)
            // =========================
            if (Array.isArray(positions)) {
                tradeService
                    .syncPositions(account.user_id, account.id, positions)
                    .catch((syncErr) => console.error("Position sync error:", syncErr.message));
            }

            // =========================
            // ROLE
            // =========================
            const role = account.ea_role;

            // =========================
            // ACTIVATION
            // =========================
            const activated = account.ea_enabled === 1;

            // =========================
            // COMMAND
            // SEMUA ROLE BOLEH
            // =========================
            db.all(
                `SELECT id, command,payload
                FROM ea_commands
                WHERE account_id = ?
                  AND status = 'pending'
                ORDER BY id ASC
                LIMIT 1
                `,
                [account.id],
                async (commandErr, commands) => {

                    if (commandErr) {
                       // const role = await getEARole(account.id, account.user_id);
                        return res.status(500).json({
                            success: false,
                            connected: true,
                            activated,
                            heartbeat: 5,
                            status: role,
                            commands: [],
                            signals: [],
                            message: commandErr.message
                        });
                    }

                    commands = commands || [];

                    // =========================
                    // BUKAN FOLLOWER
                    // TIDAK PERLU SIGNAL
                    // =========================
                    if (role !== "FOLLOWER") {

                        return res.json({
                            success: true,
                            connected: true,
                            activated,
                            heartbeat: 5,
                            status: role,
                            commands,
                            signals: [],
                            message: "Heartbeat OK"
                        });
                    }

                    // =========================
                    // FOLLOWER
                    // AMBIL SIGNAL
                    // =========================
                    db.all(
                        `
                        SELECT
                            sd.id,
                            sd.signal_id,
                            s.symbol,
                            s.type,
                            s.action,
                            s.price_from,
                            s.price_to,
                            s.sl,
                            s.tp,
                            s.source,
                            s.created_at
                        FROM signal_deliveries sd
                        JOIN signals s
                            ON s.id = sd.signal_id
                        WHERE sd.follower_account_id = ?
                          AND sd.status = 'pending'
                        ORDER BY sd.id ASC
                        LIMIT 1
                        `,
                        [account.id],

                        (signalErr, signals) => {

                            if (signalErr) {
                                return res.status(500).json({
                                    success: false,
                                    connected: true,
                                    activated,
                                    heartbeat: 5,
                                    status: role,
                                    commands,
                                    signals: [],
                                    message: signalErr.message
                                });
                            }

                            signals = signals || [];

                            return res.json({
                                success: true,
                                connected: true,
                                activated,
                                heartbeat: 5,
                                status: role,
                                commands,
                                signals,
                                message: "Heartbeat OK"
                            });
                        }
                    );
                }
            );
        }
    );
};

// Matches the EA's Disconnect() call (sent on EA/terminal shutdown, e.g.
// OnDeinit). Without this route the EA's graceful-shutdown ping had nowhere
// to land - it 404'd silently and "connected" only cleared once the next
// GET /status request noticed last_ping was stale (up to 30s later).
exports.disconnect = (req, res) => {
    const { account_number, account_token } = req.body;

    db.get(
        `SELECT id, account_token FROM mt_accounts WHERE account_number = ?`,
        [account_number],
        (err, account) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            if (!tokenMatches(account, account_token)) {
                return res.status(401).json({ success: false, message: "Invalid account token." });
            }

            db.run(
                `UPDATE mt_accounts SET connected = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [account.id],
                (updateErr) => {
                    if (updateErr) return res.status(500).json({ success: false, message: updateErr.message });
                    res.json({ success: true, message: "Disconnected." });
                }
            );
        }
    );
};

exports.trade = async (req, res) => {
    try {
        const result = await tradeService.saveTrade(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.commandAck = (req, res) => {
    const {
        account_token,
        command_id,
        success,
        message
    } = req.body;

    // command_id already scopes this to exactly one account (via the JOIN
    // below), and tokenMatches proves the caller actually holds that
    // account's token - that's sufficient. (Also comparing account_number
    // from the body against the DB's copy is redundant and was actually a
    // bug: sqlite returns account_number as a JS number while the EA sends
    // it as a JSON string, so a strict `!==` compare always "failed".)
    db.get(
        `SELECT ma.account_token
         FROM ea_commands ec
         JOIN mt_accounts ma ON ma.id = ec.account_id
         WHERE ec.id = ?`,
        [command_id],
        (lookupErr, owner) => {
            if (lookupErr) {
                return res.status(500).json({ success: false, message: lookupErr.message });
            }
            if (!tokenMatches(owner, account_token)) {
                return res.status(401).json({ success: false, message: "Invalid account token." });
            }

            const status = success ? "executed" : "failed";
            db.run(`
                UPDATE ea_commands
                SET
                    status = ?,
                    executed_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [status, command_id],
                function (err) {
                    if (err) {
                        console.error("COMMAND ACK ERROR:", err);
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }
                    return res.json({
                        success: true,
                        message: "Command ACK saved."
                    });
                }
            );
        }
    );
};

exports.signalAck = (req, res) => {

    const {
        account_token,
        signal_id,
        success
    } = req.body;

    // Same reasoning as commandAck: signal_id already scopes this to one
    // account, tokenMatches proves ownership - no need to also cross-check
    // account_number (which, being a number-vs-string comparison, was buggy).
    db.get(
        `SELECT ma.account_token
         FROM signal_deliveries sd
         JOIN mt_accounts ma ON ma.id = sd.follower_account_id
         WHERE sd.id = ?`,
        [signal_id],
        (lookupErr, owner) => {
            if (lookupErr) {
                return res.status(500).json({ success: false, message: lookupErr.message });
            }
            if (!tokenMatches(owner, account_token)) {
                return res.status(401).json({ success: false, message: "Invalid account token." });
            }

            if (!success) {
                return res.json({
                    success: true,
                    message: "Signal rejected by EA."
                });
            }

            db.run(
                `
                UPDATE signal_deliveries
                SET
                    status = 'executed',
                    received_at = CURRENT_TIMESTAMP,
                    executed_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND status = 'pending'
                `,
                [signal_id],
                function(err) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    return res.json({
                        success: true,
                        message: "Signal marked executed."
                    });
                }
            );
        }
    );
};

function getEARole(accountId, userId) {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT
                (SELECT COUNT(*) FROM user_followers WHERE master_account_id = ?) AS follower_count,
                (SELECT COUNT(*) FROM user_followers WHERE follower_user_id = ? AND status = 'active') AS following_count
        `, [accountId, userId], (err, row) => {
            if (err) return reject(err);

            if (row.follower_count > 0) return resolve("MASTER");
            if (row.following_count > 0) return resolve("FOLLOWER");

            resolve("MEMBER");
        });
    });
}

// SQLite's CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" in UTC but WITHOUT
// timezone info. `new Date()` parses that space-separated form as LOCAL time,
// so on a server not running in UTC every last_ping looked hours old and
// heartbeats never counted as "fresh". Normalize to ISO-8601 UTC before parsing.
function parseSqliteUTC(value) {
    if (!value) return NaN;
    const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
    return new Date(iso).getTime();
}

// account_token proves the request actually came from that account's EA.
// account_number alone is not a secret (it's visible in the MT5 terminal),
// so any endpoint that trusts it without also checking the token can be
// spoofed by anyone who knows/guesses a valid account number.
function tokenMatches(account, token) {
    return !!account && !!token && account.account_token === token;
}

function isHeartbeatFresh(lastPing, maxAgeSeconds = 30) {
    if (!lastPing) return false;

    const lastPingDate = parseSqliteUTC(lastPing);
    if (Number.isNaN(lastPingDate)) return false;

    const maxAgeMs = maxAgeSeconds * 1000;
    return Date.now() - lastPingDate <= maxAgeMs;
}

exports.createCommand = (req, res) => {
    const { account_id, command, payload = null } = req.body;

    const allowed = ["CLOSE_ALL", "CLOSE_BUY", "CLOSE_SELL", "CLOSE_PROFIT", "CLOSE_LOSS", "DELETE_PENDING", "MODIFY_SL", "MODIFY_TP", "DELETE_SL", "DELETE_TP", "OPEN_BUY", "OPEN_SELL"];

    if (!account_id || !allowed.includes(command)) {
        return res.status(400).json({ success: false, message: "Invalid command." });
    }

    db.get(`SELECT id, user_id, connected FROM mt_accounts WHERE id = ?`, [account_id], (err, account) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!account) return res.status(404).json({ success: false, message: "Account not found." });

        db.run(`
            INSERT INTO ea_commands (user_id, account_id, command, payload, status)
            VALUES (?, ?, ?, ?, 'pending')
        `, [account.user_id, account.id, command, payload], function (err) {
            if (err) return res.status(500).json({ success: false, message: err.message });

            res.json({
                success: true,
                command_id: this.lastID,
                status: "pending"
            });
        });
    });
};

// Same lookup exports.status used to do inline, promisified so it can be
// reused by both /status (kept for compatibility) and the combined
// /dashboard endpoint without duplicating the three-query chain.
function getAccountStatus(userId) {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT id, account_number, account_name, server_name, broker, terminal_build, platform, connected, last_ping,
                   symbol, point, digits, bid, ask
            FROM mt_accounts
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
        `, [userId], (err, account) => {
            if (err) return reject(err);

            if (!account) {
                return resolve({ success: true, connected: false, activated: false, account: null, role: "MEMBER", heartbeat: 5, command: null });
            }

            const isConnected = account.connected === 1 && isHeartbeatFresh(account.last_ping, 30);

            if (account.connected === 1 && !isConnected) {
                db.run(
                    `UPDATE mt_accounts SET connected = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [account.id]
                );
            }

            db.get(`
                SELECT mt_accounts.ea_role, ea_settings.ea_enabled
                FROM mt_accounts
                LEFT JOIN ea_settings ON mt_accounts.user_id = ea_settings.user_id
                WHERE mt_accounts.id = ?
            `, [account.id], (roleErr, data) => {
                if (roleErr) return reject(roleErr);

                // Show the most recent command regardless of status, so the
                // tile reflects "executed"/"failed" instead of snapping back
                // to "No command" the instant the EA acknowledges it.
                db.get(`
                    SELECT id, command, status, created_at, sent_at
                    FROM ea_commands
                    WHERE account_id = ?
                    ORDER BY id DESC
                    LIMIT 1
                `, [account.id], (commandErr, command) => {
                    if (commandErr) return reject(commandErr);

                    resolve({
                        success: true,
                        connected: isConnected,
                        activated: data?.ea_enabled === 1 && isConnected,
                        account: {
                            ...account,
                            connected: isConnected ? 1 : 0,
                            last_ping: account.last_ping,
                        },
                        role: data?.ea_role || "MEMBER",
                        heartbeat: 5,
                        command: command || null,
                    });
                });
            });
        });
    });
}

exports.status = async (req, res) => {
    try {
        const data = await getAccountStatus(req.user.id);
        res.json(data);
    } catch (err) {
        console.error("EA STATUS ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Combines status + positions + today's history into one round trip - the
// dashboard used to poll three separate endpoints every 5s per open tab;
// at thousands of concurrently open tabs that tripled request volume for
// data that's cheap to fetch together.
exports.dashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const [statusData, positions, trades] = await Promise.all([
            getAccountStatus(userId),
            tradeService.getOpenPositions(userId),
            tradeService.getTodayHistory(userId),
        ]);

        res.json({ ...statusData, positions, trades });
    } catch (err) {
        console.error("EA DASHBOARD ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.positions = async (req, res) => {
    try {
        const rows = await tradeService.getOpenPositions(req.user.id);
        res.json({ success: true, positions: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getLastCommand = (req, res) => {
    const userId = req.user.id;

    db.get(`
        SELECT ec.id, ec.command, ec.payload, ec.status, ec.created_at, ec.sent_at, ec.executed_at
        FROM ea_commands ec
        JOIN mt_accounts ma ON ma.id = ec.account_id
        WHERE ma.user_id = ?
        ORDER BY ec.id DESC
        LIMIT 1
    `, [userId], (err, command) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, command: command || null });
    });
};

exports.getTodayHistory = async (req, res) => {
    try {
        const rows = await tradeService.getTodayHistory(req.user.id);
        res.json({ success: true, trades: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};