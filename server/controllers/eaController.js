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
        balance,
        equity,
        margin,
        free_margin,
        margin_level
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
        JOIN ea_settings
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
                    account_number
                ]
            );

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
        command_id,
        success,
        message
    } = req.body;
    const status = success ? "executed" : "failed";
    console.log("COMMAND ACK:", {
        command_id,
        success,
        message
    });
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
};

exports.signalAck = (req, res) => {

    const {
        signal_id,
        success
    } = req.body;

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

function isHeartbeatFresh(lastPing, maxAgeSeconds = 30) {
    if (!lastPing) return false;

    const lastPingDate = new Date(lastPing).getTime();
    if (Number.isNaN(lastPingDate)) return false;

    const maxAgeMs = maxAgeSeconds * 1000;
    return Date.now() - lastPingDate <= maxAgeMs;
}

exports.createCommand = (req, res) => {
    const { account_id, command, payload = null } = req.body;

    const allowed = ["CLOSE_ALL", "CLOSE_BUY", "CLOSE_SELL", "DELETE_PENDING", "MODIFY_SL", "MODIFY_TP"];

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

exports.status = (req, res) => {
    const userId = req.user.id;

    db.get(`
        SELECT id, account_number, account_name, server_name, connected, last_ping
        FROM mt_accounts
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1
    `, [userId], (err, account) => {
        if (err) {
            console.error("EA STATUS ERROR:", err);
            return res.status(500).json({ success: false, message: err.message });
        }

        if (!account) return res.json({ success: true, connected: false, activated: false, account: null, role: "MEMBER", heartbeat: 5, command: null });

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
            if (roleErr) return res.status(500).json({ success: false, message: roleErr.message });

            db.get(`
                SELECT id, command, status, created_at, sent_at
                FROM ea_commands
                WHERE account_id = ? AND status IN ('pending', 'sent')
                ORDER BY id DESC
                LIMIT 1
            `, [account.id], (commandErr, command) => {
                if (commandErr) return res.status(500).json({ success: false, message: commandErr.message });

                res.json({
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