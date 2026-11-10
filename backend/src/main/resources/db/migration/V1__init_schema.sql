-- 1. Table for User Accounts (Таблица пользователей)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL DEFAULT '',
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER'
);

-- 2. Updated Table for Student Profiles (Таблица студентов)
CREATE TABLE students (
    isu_id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    dormitory_number INTEGER NOT NULL,
    room_number TEXT NOT NULL,
    settlement_term DATE NOT NULL,
    is_foreigner BOOLEAN NOT NULL DEFAULT 0,    -- In SQLite, BOOLEAN is stored as 0 (false) or 1 (true)
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table for Refresh Tokens (Таблица токенов для безопасности JWT)
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiry_date DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
