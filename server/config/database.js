const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../../forexhub.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Gagal terhubung ke database:', err.message);
    } else {
        console.log('📦 Berhasil terhubung ke database SQLite via Config!');
    }
});

db.serialize(() => {
 // Table User
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            username TEXT UNIQUE,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            status TEXT DEFAULT 'active',
            avatar TEXT,
            email_verified INTEGER DEFAULT 0,
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    // Added after the initial release for the Profile page - existing DBs
    // need these backfilled via ALTER TABLE.
    [["phone", "TEXT"], ["address", "TEXT"]].forEach(([col, type]) => {
        db.run(`ALTER TABLE users ADD COLUMN ${col} ${type}`, (err) => {
            if (err && !/duplicate column/i.test(err.message)) {
                console.error(`Migration error (users.${col}):`, err.message);
            }
        });
    });

    // Holds a pending password change while its email confirmation code is
    // outstanding. new_password_hash is computed at request time (current
    // password already verified then) so confirm only has to check the code
    // and copy the hash over - it never sees the plaintext password again.
    db.run(`
        CREATE TABLE IF NOT EXISTS password_change_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            new_password_hash TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_pwreq_user ON password_change_requests(user_id)`);

    // Pending email-ownership confirmation codes. Same shape/lifecycle as
    // password_change_requests, just for `users.email_verified` instead of
    // the password - confirming sets email_verified=1 and clears the row.
    db.run(`
        CREATE TABLE IF NOT EXISTS email_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_emailverify_user ON email_verifications(user_id)`);

// Table mt account
db.run(`
    CREATE TABLE IF NOT EXISTS mt_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        account_number INTEGER UNIQUE,
        account_name TEXT,
        broker TEXT,
        server_name TEXT,
        currency TEXT,
        leverage INTEGER,
        balance REAL DEFAULT 0,
        equity REAL DEFAULT 0,
        margin REAL DEFAULT 0,
        free_margin REAL DEFAULT 0,
        margin_level REAL DEFAULT 0,
        connected INTEGER DEFAULT 0,
        terminal_build INTEGER,
        ea_version TEXT,
        last_ping DATETIME,
        account_token TEXT,
        ea_role TEXT DEFAULT 'FOLLOWER',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);
db.run(`
    CREATE INDEX IF NOT EXISTS idx_mt_account
    ON mt_accounts(account_number);
`);
// Whether this account's Portfolio page can be viewed by other users.
// Added after the initial release, so existing DBs need it backfilled via
// ALTER TABLE (see the current_price migration above for why).
db.run(`ALTER TABLE mt_accounts ADD COLUMN portfolio_visibility TEXT DEFAULT 'private'`, (err) => {
    if (err && !/duplicate column/i.test(err.message)) {
        console.error("Migration error (mt_accounts.portfolio_visibility):", err.message);
    }
});

// Live market context for the EA's own chart symbol - lets the dashboard
// convert a pips value into an actual price correctly (pip size differs per
// symbol/broker, so this must come from the EA/broker, never be guessed).
// Refreshed on every heartbeat; only ever reflects the latest known value.
const symbolContextColumns = [
    ["symbol", "TEXT"],
    ["point", "REAL"],
    ["digits", "INTEGER"],
    ["bid", "REAL"],
    ["ask", "REAL"],
    // "MT4" or "MT5" - reported by the EA itself (see BuildHeartbeatJson),
    // not inferred, so the day a TraderHub.mq4 build exists this just works.
    ["platform", "TEXT"],
];
symbolContextColumns.forEach(([col, type]) => {
    db.run(`ALTER TABLE mt_accounts ADD COLUMN ${col} ${type}`, (err) => {
        if (err && !/duplicate column/i.test(err.message)) {
            console.error(`Migration error (mt_accounts.${col}):`, err.message);
        }
    });
});

// ea setting
db.run(`
    CREATE TABLE IF NOT EXISTS ea_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        ea_enabled INTEGER DEFAULT 1,
        ea_version TEXT,
        follow_signal INTEGER DEFAULT 0,
        copy_signal INTEGER DEFAULT 0,
        copy_trading INTEGER DEFAULT 0,
        subscription_expired DATETIME,
        connected INTEGER DEFAULT 0,
        last_ping DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);

  //db.run("DROP TABLE IF EXISTS trades");
 // traders/ data trading
    db.run(`
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            account_id INTEGER NOT NULL,
            ticket INTEGER NOT NULL,
            position_id INTEGER,
            order_id INTEGER,
            deal_id INTEGER,
            symbol TEXT NOT NULL,
            action TEXT,
            status TEXT,
            volume REAL,
            open_price REAL,
            close_price REAL,
            sl REAL,
            tp REAL,
            commission REAL DEFAULT 0,
            swap REAL DEFAULT 0,
            profit REAL DEFAULT 0,
            magic INTEGER,
            comment TEXT,
            open_time DATETIME,
            close_time DATETIME,
            modify_time DATETIME,
            balance REAL,
            equity REAL,
            sync_status INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(account_id) REFERENCES mt_accounts(id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);
// Added after the initial release - existing DBs need it backfilled via
// ALTER TABLE since CREATE TABLE IF NOT EXISTS is a no-op once the table
// already exists. SQLite errors on a duplicate column, so that case is
// swallowed; any other error is logged.
db.run(`ALTER TABLE trades ADD COLUMN current_price REAL`, (err) => {
    if (err && !/duplicate column/i.test(err.message)) {
        console.error("Migration error (trades.current_price):", err.message);
    }
});

// Enforces one row per (account_id, ticket) so the position-sync upsert can
// be a single atomic "INSERT ... ON CONFLICT DO UPDATE" instead of a
// check-then-write that races under concurrent/overlapping heartbeats.
db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_trade_account_ticket ON trades(account_id, ticket)`, (err) => {
    if (err) {
        console.error("Migration error (idx_trade_account_ticket) - check for duplicate (account_id,ticket) rows:", err.message);
    }
});

// Composite indexes matching the actual hot-path query shapes (the
// single-column indexes below don't cover these combined filters/sorts).
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_user_status_open ON trades(user_id, status, open_time)`, (err) => {
    if (err) console.error("Migration error (idx_trade_user_status_open):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_account_status ON trades(account_id, status)`, (err) => {
    if (err) console.error("Migration error (idx_trade_account_status):", err.message);
});

// NOTE: node-sqlite3's db.run() only executes the FIRST statement in a
// multi-statement string (it prepares one statement; anything after the
// first ";" is silently never run). These used to be six CREATE INDEX
// statements crammed into one db.run() call, so only idx_trade_ticket was
// ever actually created - the other five indexes never existed despite the
// code looking like it created them. Split into one db.run() per statement.
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_ticket ON trades(ticket)`, (err) => {
    if (err) console.error("Migration error (idx_trade_ticket):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_account ON trades(account_id)`, (err) => {
    if (err) console.error("Migration error (idx_trade_account):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_user ON trades(user_id)`, (err) => {
    if (err) console.error("Migration error (idx_trade_user):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_symbol ON trades(symbol)`, (err) => {
    if (err) console.error("Migration error (idx_trade_symbol):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_status ON trades(status)`, (err) => {
    if (err) console.error("Migration error (idx_trade_status):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_open ON trades(open_time)`, (err) => {
    if (err) console.error("Migration error (idx_trade_open):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_close ON trades(close_time)`, (err) => {
    if (err) console.error("Migration error (idx_trade_close):", err.message);
});
// Serves the "today's history" range query (user_id + open_time/close_time
// range) directly, now that it's a sargable range instead of date(...)=...
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_user_open ON trades(user_id, open_time)`, (err) => {
    if (err) console.error("Migration error (idx_trade_user_open):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_user_close ON trades(user_id, close_time)`, (err) => {
    if (err) console.error("Migration error (idx_trade_user_close):", err.message);
});

// Cold storage for old CLOSED trades, moved out of `trades` by the daily
// maintenance job (server/jobs/maintenance.js) so the live table's row count
// stays bounded no matter how many users/EAs the platform grows to. Mirrors
// `trades` column-for-column (minus AUTOINCREMENT, since ids are carried over
// from the row being archived) plus an `archived_at` marker.
db.run(`
    CREATE TABLE IF NOT EXISTS trades_archive (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        ticket INTEGER NOT NULL,
        position_id INTEGER,
        order_id INTEGER,
        deal_id INTEGER,
        symbol TEXT NOT NULL,
        action TEXT,
        status TEXT,
        volume REAL,
        open_price REAL,
        close_price REAL,
        sl REAL,
        tp REAL,
        commission REAL DEFAULT 0,
        swap REAL DEFAULT 0,
        profit REAL DEFAULT 0,
        magic INTEGER,
        comment TEXT,
        open_time DATETIME,
        close_time DATETIME,
        modify_time DATETIME,
        balance REAL,
        equity REAL,
        sync_status INTEGER DEFAULT 1,
        created_at DATETIME,
        updated_at DATETIME,
        current_price REAL,
        archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_archive_user ON trades_archive(user_id)`, (err) => {
    if (err) console.error("Migration error (idx_trade_archive_user):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_trade_archive_account_ticket ON trades_archive(account_id, ticket)`, (err) => {
    if (err) console.error("Migration error (idx_trade_archive_account_ticket):", err.message);
});

// data histori account trading
db.run(`
    CREATE TABLE IF NOT EXISTS account_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        balance REAL,
        equity REAL,
        margin REAL,
        free_margin REAL,
        margin_level REAL,
        floating_pl REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(account_id) REFERENCES mt_accounts(id)
    );
`);

//ea command
db.run(`
    CREATE TABLE IF NOT EXISTS ea_commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        command TEXT NOT NULL,
        payload TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME,
        executed_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(account_id) REFERENCES mt_accounts(id)
    );
`);

db.run(`
    CREATE INDEX IF NOT EXISTS idx_command_status
    ON ea_commands(status);
`);
// The heartbeat's hot-path query filters on account_id AND status together
// (WHERE account_id = ? AND status = 'pending') - a composite index serves
// that directly instead of relying on the single-column status index alone.
db.run(`
    CREATE INDEX IF NOT EXISTS idx_command_account_status
    ON ea_commands(account_id, status);
`);
// ea logs
db.run(`
    CREATE TABLE IF NOT EXISTS ea_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        account_id INTEGER,
        level TEXT DEFAULT 'INFO',
        event TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(account_id) REFERENCES mt_accounts(id)
    );
`);

// integrations channels
db.run(`
    CREATE TABLE IF NOT EXISTS integration_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        name TEXT,
        external_id TEXT,
        secret TEXT,
        enabled INTEGER DEFAULT 1,
        connected INTEGER DEFAULT 0,
        last_ping DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);
db.run(`
    CREATE INDEX IF NOT EXISTS idx_integration_user
    ON integration_channels(user_id);
`);
// Table signal
db.run(`
    CREATE TABLE IF NOT EXISTS signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        master_account_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL,
        action TEXT NOT NULL,
        price_from REAL,
        price_to REAL,
        sl REAL,
        tp REAL,
        source TEXT DEFAULT 'EA',
        status TEXT DEFAULT 'CREATED',
        blocked_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME,
        FOREIGN KEY(master_account_id) REFERENCES mt_accounts(id)
    );
`);
// table signal deliveries
db.run(`
    CREATE TABLE IF NOT EXISTS signal_deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        signal_id INTEGER NOT NULL,
        master_account_id INTEGER NOT NULL,
        follower_account_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        sent_at DATETIME,
        received_at DATETIME,
        executed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(signal_id) REFERENCES signals(id),
        FOREIGN KEY(master_account_id) REFERENCES mt_accounts(id),
        FOREIGN KEY(follower_account_id) REFERENCES mt_accounts(id)
    );
`);

// Table user_followers
db.run(`
    CREATE TABLE IF NOT EXISTS user_followers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        master_account_id INTEGER NOT NULL,
        follower_user_id INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(master_account_id) REFERENCES mt_accounts(id),
        FOREIGN KEY(follower_user_id) REFERENCES users(id)
    );
`);

// ============================================================
// AI ROBOT (see docs/dataSkill.md and docs/dataSkill/*.md for the
// full pipeline/business-rule design this schema implements).
// ============================================================

// Table robots - baseline settings per AI robot (docs/dataSkill/00-form-schema.md).
// Billing/subscription state is embedded directly on this row (1:1 with the
// robot, same pattern as mt_accounts embedding its own live config) rather
// than a separate table - only the token ledger below is a true history table.
db.run(`
    CREATE TABLE IF NOT EXISTS robots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER NOT NULL,
        nama_robot TEXT NOT NULL,
        symbol TEXT NOT NULL,
        time_frame TEXT NOT NULL,
        news INTEGER DEFAULT 0,

        -- jadwal_analisa (00-form-schema.md)
        jadwal_mode TEXT DEFAULT 'auto',
        interval_menit INTEGER,
        sesi_market TEXT,
        buffer_sebelum_menit INTEGER DEFAULT 0,
        buffer_sesudah_menit INTEGER DEFAULT 0,
        kondisi_market TEXT DEFAULT 'all',

        -- dicek backend sebelum pipeline jalan (05-backend-validator.md bagian A),
        -- bukan oleh LLM manapun
        max_risk_per_day_percent REAL,
        max_risk_per_month_percent REAL,
        max_open_posisi INTEGER,
        min_risk_reward REAL,

        prompt_mode TEXT DEFAULT 'auto',
        user_strategy_notes TEXT,

        -- billing (06-billing-tokens.md)
        billing_mode TEXT,
        tokens_per_signal INTEGER,
        max_signal_per_day INTEGER,
        monthly_price_idr INTEGER,
        max_signal_per_month INTEGER,
        is_free_trial INTEGER DEFAULT 0,
        trial_started_at DATETIME,
        trial_ends_at DATETIME,
        subscription_status TEXT,
        subscription_period_end DATETIME,
        subscription_warned_7d INTEGER DEFAULT 0,

        -- di-set OFF oleh pre-check backend (saldo/kuota/risiko habis) - lihat off_reason
        status TEXT DEFAULT 'active',
        off_reason TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_user_id) REFERENCES users(id)
    );
`);
db.run(`CREATE INDEX IF NOT EXISTS idx_robot_owner ON robots(owner_user_id)`, (err) => {
    if (err) console.error("Migration error (idx_robot_owner):", err.message);
});

// Table robot_indicators - satu baris per indikator yang dipilih untuk sebuah
// robot, dengan settingannya sendiri. `params` disimpan sebagai JSON string
// (pola yang sama seperti ea_commands.payload) supaya tiap jenis indikator
// bisa punya bentuk settingan berbeda (RSI -> period, MACD -> fast/slow/signal,
// dst) tanpa perlu kolom terpisah per jenis indikator.
db.run(`
    CREATE TABLE IF NOT EXISTS robot_indicators (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        robot_id INTEGER NOT NULL,
        indicator_name TEXT NOT NULL,
        params TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(robot_id) REFERENCES robots(id)
    );
`);
db.run(`CREATE INDEX IF NOT EXISTS idx_robot_indicator_robot ON robot_indicators(robot_id)`, (err) => {
    if (err) console.error("Migration error (idx_robot_indicator_robot):", err.message);
});

// Table user_token_wallets - saldo token platform milik user (1 token = Rp 100,
// lihat 06-billing-tokens.md). Saldo aktual hanya boleh berubah lewat baris baru
// di token_transactions di bawah, bukan UPDATE langsung, supaya selalu ada jejak audit.
db.run(`
    CREATE TABLE IF NOT EXISTS user_token_wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        token_balance INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );
`);

// Table token_transactions - ledger token (beli/pakai/refund). balance_after
// dicatat di tiap baris supaya saldo bisa diaudit/direkonstruksi tanpa harus
// percaya butuh pada token_balance saat ini saja.
db.run(`
    CREATE TABLE IF NOT EXISTS token_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        robot_id INTEGER,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(robot_id) REFERENCES robots(id)
    );
`);
db.run(`CREATE INDEX IF NOT EXISTS idx_token_tx_user ON token_transactions(user_id)`, (err) => {
    if (err) console.error("Migration error (idx_token_tx_user):", err.message);
});
db.run(`CREATE INDEX IF NOT EXISTS idx_token_tx_robot ON token_transactions(robot_id)`, (err) => {
    if (err) console.error("Migration error (idx_token_tx_robot):", err.message);
});

});



module.exports = db;