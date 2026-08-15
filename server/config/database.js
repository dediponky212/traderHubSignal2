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
db.run(`
    CREATE INDEX IF NOT EXISTS idx_trade_ticket
    ON trades(ticket);
    CREATE INDEX IF NOT EXISTS idx_trade_account
    ON trades(account_id);
    CREATE INDEX IF NOT EXISTS idx_trade_user
    ON trades(user_id);
    CREATE INDEX IF NOT EXISTS idx_trade_symbol
    ON trades(symbol);
    CREATE INDEX IF NOT EXISTS idx_trade_status
    ON trades(status);
    CREATE INDEX IF NOT EXISTS idx_trade_open
    ON trades(open_time);
`);
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

});



module.exports = db;