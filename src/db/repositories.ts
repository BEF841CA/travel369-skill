import { getDatabase } from './database.js';
import type { User, BusLine, BusStation } from './models.js';
import type { LineRealTimeInfo, Station } from '../api/types.js';

export class UserRepository {
  createOrUpdate(uniqueId: string, token: string, nickname?: string, phone?: string, headUrl?: string): User {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO users (unique_id, nickname, phone, head_url, token)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(unique_id) DO UPDATE SET
        token = excluded.token,
        nickname = COALESCE(excluded.nickname, users.nickname),
        phone = COALESCE(excluded.phone, users.phone),
        head_url = COALESCE(excluded.head_url, users.head_url)
      RETURNING *
    `);

    const result = stmt.get(uniqueId, nickname || null, phone || null, headUrl || null, token) as User;
    db.close();
    return result;
  }

  findByUniqueId(uniqueId: string): User | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE unique_id = ?');
    const result = stmt.get(uniqueId) as User | undefined;
    db.close();
    return result;
  }

  findByToken(token: string): User | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE token = ?');
    const result = stmt.get(token) as User | undefined;
    db.close();
    return result;
  }
}

export class BusLineRepository {
  subscribe(userId: number, lineInfo: LineRealTimeInfo): BusLine {
    const db = getDatabase();

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO bus_lines 
        (user_id, line_id, line_name, start_station, end_station, first_departure_time, last_departure_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    const result = stmt.get(
      userId,
      lineInfo.lineId,
      lineInfo.name,
      lineInfo.startStationName,
      lineInfo.endStationName,
      lineInfo.firstDepartureTime,
      lineInfo.lastDepartureTime
    ) as BusLine;
    db.close();
    return result;
  }

  unsubscribe(userId: number, lineId: number): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM bus_lines WHERE user_id = ? AND line_id = ?');
    const result = stmt.run(userId, lineId);
    db.close();
    return result.changes > 0;
  }

  findAllByUserId(userId: number): BusLine[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM bus_lines WHERE user_id = ? ORDER BY subscribed_at DESC');
    const result = stmt.all(userId) as BusLine[];
    db.close();
    return result;
  }

  findById(id: number): BusLine | undefined {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM bus_lines WHERE id = ?');
    const result = stmt.get(id) as BusLine | undefined;
    db.close();
    return result;
  }
}

export class BusStationRepository {
  upsert(lineId: number, stations: Station[]): void {
    const db = getDatabase();

    db.prepare('BEGIN TRANSACTION').run();
    
    const deleteStmt = db.prepare('DELETE FROM bus_stations WHERE line_id = ?');
    deleteStmt.run(lineId);

    const insertStmt = db.prepare(`
      INSERT INTO bus_stations (line_id, station_id, station_name, station_no, geo)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((stationList: Station[]) => {
      for (const station of stationList) {
        insertStmt.run(lineId, station.stationId, station.name, station.stationNo, station.geo);
      }
    });

    insertMany(stations);

    db.prepare('COMMIT').run();
    db.close();
  }

  findByStationName(stationName: string): BusStation[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT bs.*, bl.line_name, bl.line_id
      FROM bus_stations bs
      JOIN bus_lines bl ON bs.line_id = bl.id
      WHERE bs.station_name LIKE ?
    `);
    const result = stmt.all(`%${stationName}%`) as (BusStation & { line_name: string; line_id: number })[];
    db.close();
    return result;
  }

  findByLineId(lineId: number): BusStation[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM bus_stations WHERE line_id = ? ORDER BY station_no');
    const result = stmt.all(lineId) as BusStation[];
    db.close();
    return result;
  }
}
