import sqlite3

def get_db():
    conn = sqlite3.connect("securepay.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            name      TEXT NOT NULL,
            email     TEXT UNIQUE NOT NULL,
            password  TEXT,
            upi_id    TEXT,
            bank_name TEXT,
            provider  TEXT DEFAULT 'email'
        )
    ''')

    # Transactions table
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_upi        TEXT,
            receiver_upi      TEXT,
            amount            INTEGER,
            risk_level        TEXT,
            fraud_probability REAL,
            decision          TEXT,
            resolved          INTEGER DEFAULT NULL,
            time              TEXT
        )
    ''')

    conn.commit()
    conn.close()