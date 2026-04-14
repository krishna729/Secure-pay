import psycopg2
import psycopg2.extras
import os

DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id        SERIAL PRIMARY KEY,
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
            id                SERIAL PRIMARY KEY,
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

    # Notifications table
    c.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id          SERIAL PRIMARY KEY,
            email       TEXT,
            type        TEXT,
            title       TEXT,
            message     TEXT,
            sub_message TEXT,
            time        TEXT,
            read        INTEGER DEFAULT 0
        )
    ''')

    conn.commit()
    conn.close()