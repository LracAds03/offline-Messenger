import * as SQLite from 'expo-sqlite';

export async function createDatabase() {
  const db = await SQLite.openDatabaseAsync('messengerApp.db');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      fullName TEXT NOT NULL,
      profilePhoto TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId INTEGER NOT NULL,
      receiverId INTEGER NOT NULL,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT (datetime('now', 'localtime')),
      isRead INTEGER DEFAULT 0
    );
  `);

  return db;
}
