const fs = require('fs');
const path = require('path');
const config = require('../config/config');

let Database;
try {
    Database = require('bun:sqlite').Database;
} catch (err) {
    try {
        Database = require('better-sqlite3');
    } catch (e) {
        process.exit(1);
    }
}

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
    db.exec("PRAGMA journal_mode = WAL");
} catch (e) {
    try {
        db.pragma('journal_mode = WAL');
    } catch (e2) { }
}
db.prepare(`
    CREATE TABLE IF NOT EXISTS buyers (
        guild_id TEXT,
        id TEXT,
        PRIMARY KEY (guild_id, id)
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS owners (
        guild_id TEXT,
        id TEXT,
        PRIMARY KEY (guild_id, id)
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS judges (
        guild_id TEXT,
        role_id TEXT,
        PRIMARY KEY (guild_id, role_id)
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS config_logs (
        guild_id TEXT PRIMARY KEY,
        log_channel_id TEXT,
        bl_submission_channel_id TEXT,
        unbl_submission_channel_id TEXT,
        prefix TEXT,
        ban_message TEXT
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS blacklist (
        user_id TEXT PRIMARY KEY,
        reason TEXT,
        proof TEXT,
        author_id TEXT,
        guild_name TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS unbl_requests (
        user_id TEXT PRIMARY KEY,
        last_request_time INTEGER
    )
`).run();

config.devBuyers.forEach(id => {
    try {
        db.prepare("INSERT OR IGNORE INTO buyers (guild_id, id) VALUES ('global', ?)").run(id);
        db.prepare("INSERT OR IGNORE INTO owners (guild_id, id) VALUES ('global', ?)").run(id);
    } catch (e) { }
});

module.exports = db;
