const db = require("../config/database");

const OPEN_COOLDOWN = 15 * 60 * 1000;
const MODIFY_COOLDOWN = 5 * 60 * 1000;

function getLastSignal(masterAccountId, symbol, type) {
    return new Promise((resolve, reject) => {
        db.get(
            `
            SELECT *
            FROM signals
            WHERE master_account_id = ?
              AND symbol = ?
              AND type = ?
              AND status != 'BLOCKED'
            ORDER BY id DESC
            LIMIT 1
            `,
            [masterAccountId, symbol, type],
            (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            }
        );
    });
}

function insertSignal(data, status, blockedReason = null) {
    return new Promise((resolve, reject) => {
        db.run(
            `
            INSERT INTO signals (
                master_account_id,
                symbol,
                type,
                action,
                price_from,
                price_to,
                sl,
                tp,
                source,
                status,
                blocked_reason
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                data.master_account_id,
                data.symbol,
                data.type,
                data.action,
                data.price_from,
                data.price_to,
                data.sl,
                data.tp,
                data.source || "EA",
                status,
                blockedReason
            ],
            function (err) {
                if (err) return reject(err);

                resolve({
                    id: this.lastID,
                    status,
                    blocked_reason: blockedReason
                });
            }
        );
    });
}

exports.createSignal = async (data) => {

    let status = "CREATED";
    let blockedReason = null;

    if (data.type === "OPEN") {

        const last = await getLastSignal(
            data.master_account_id,
            data.symbol,
            "OPEN"
        );

        if (last) {
            const diff =
                Date.now() -
                new Date(last.created_at).getTime();

            if (diff < OPEN_COOLDOWN) {
                status = "BLOCKED";
                blockedReason = "OPEN_COOLDOWN";
            }
        }
    }

    if (data.type === "MODIFY") {

        const last = await getLastSignal(
            data.master_account_id,
            data.symbol,
            "MODIFY"
        );

        if (last) {
            const diff =
                Date.now() -
                new Date(last.created_at).getTime();

            if (diff < MODIFY_COOLDOWN) {
                status = "BLOCKED";
                blockedReason = "MODIFY_COOLDOWN";
            }
        }
    }

    // CLOSE selalu boleh
    if (data.type === "CLOSE") {
        status = "CREATED";
        blockedReason = null;
    }

    return insertSignal(data, status, blockedReason);
    const signal = await insertSignal(data, status, blockedReason);

    if (signal.status === "CREATED") {
        await distributeSignal(signal.id, data.master_account_id);
    }

    return signal;
};

function getFollowers(masterAccountId) {
    return new Promise((resolve, reject) => {

        db.all(
            `
            SELECT
                follower.id,
                follower.account_number
            FROM mt_accounts follower

            JOIN user_followers uf
                ON uf.follower_user_id = follower.user_id

            WHERE
                uf.master_account_id = ?
                AND uf.status = 'active'
            `,
            [masterAccountId],
            (err, rows) => {

                if (err) return reject(err);

                resolve(rows || []);
            }
        );
    });
}

async function distributeSignal(signalId, masterAccountId) {

    const followers = await getFollowers(masterAccountId);

    if (followers.length === 0) return;

    for (const follower of followers) {
        await new Promise((resolve, reject) => {

            db.run(
                `
                INSERT INTO signal_deliveries (
                    signal_id,
                    master_account_id,
                    follower_account_id,
                    status
                )
                VALUES (?, ?, ?, 'pending')
                `,
                [
                    signalId,
                    masterAccountId,
                    follower.id
                ],
                err => {
                    if (err) reject(err);
                    else resolve();
                }
            );

        });
    }
}