const db = require("../config/database");
const signalService = require("../services/signalService");

function getAccount(accountNumber) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT
                id,
                user_id,
                account_number,
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