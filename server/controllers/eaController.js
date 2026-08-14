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
        (err, account) => {
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
                `
                SELECT
                    id,
                    command,
                    payload
                FROM ea_commands
                WHERE account_id = ?
                  AND status = 'pending'
                ORDER BY id ASC
                LIMIT 1
                `,
                [account.id],

                (commandErr, commands) => {

                    if (commandErr) {
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