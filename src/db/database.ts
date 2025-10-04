import Database from 'better-sqlite3';
import { resolve } from 'path';

const DB_PATH = resolve(process.cwd(), 'travel369.db');

export function getDatabase(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

export function initDatabase(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unique_id TEXT UNIQUE NOT NULL,
      nickname TEXT,
      phone TEXT,
      head_url TEXT,
      token TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bus_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      line_id INTEGER NOT NULL,
      line_name TEXT NOT NULL,
      start_station TEXT,
      end_station TEXT,
      first_departure_time TEXT,
      last_departure_time TEXT,
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, line_id)
    );

    CREATE TABLE IF NOT EXISTS bus_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      station_name TEXT NOT NULL,
      station_no INTEGER NOT NULL,
      geo TEXT,
      FOREIGN KEY (line_id) REFERENCES bus_lines(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id);
    CREATE INDEX IF NOT EXISTS idx_bus_lines_user_id ON bus_lines(user_id);
    CREATE INDEX IF NOT EXISTS idx_bus_stations_line_id ON bus_stations(line_id);
    CREATE INDEX IF NOT EXISTS idx_bus_stations_station_name ON bus_stations(station_name);
  `);

  db.close();
}
