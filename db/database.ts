import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_NAME = 'ramnaam.db';

// Legacy AsyncStorage keys (for migration)
const LEGACY_JAAP_DATA_KEY = 'ram_naam_jaap_data';
const LEGACY_LIFETIME_BASE_KEY = 'ram_naam_lifetime_base';
const MIGRATION_DONE_KEY = 'ram_naam_migration_done';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Open (or create) the SQLite database and ensure tables exist.
 */
export async function initDB(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS jaap_entries (
      date TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return db;
}

/**
 * Get the database instance (must call initDB first).
 */
function getDB(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

// ─── Jaap Entries ────────────────────────────────────────────

/**
 * Get the jaap count for a specific date.
 */
export async function getDayCountDB(dateKey: string): Promise<number> {
  const row = await getDB().getFirstAsync<{ count: number }>(
    'SELECT count FROM jaap_entries WHERE date = ?',
    [dateKey]
  );
  return row?.count ?? 0;
}

/**
 * Set (insert or replace) the jaap count for a specific date.
 * If count <= 0, the entry is deleted.
 */
export async function setDayCountDB(dateKey: string, count: number): Promise<void> {
  if (count <= 0) {
    await getDB().runAsync('DELETE FROM jaap_entries WHERE date = ?', [dateKey]);
  } else {
    await getDB().runAsync(
      'INSERT OR REPLACE INTO jaap_entries (date, count) VALUES (?, ?)',
      [dateKey, count]
    );
  }
}

/**
 * Get all jaap entries as a Record<date, count>.
 */
export async function getAllEntriesDB(): Promise<Record<string, number>> {
  const rows = await getDB().getAllAsync<{ date: string; count: number }>(
    'SELECT date, count FROM jaap_entries'
  );
  const data: Record<string, number> = {};
  for (const row of rows) {
    data[row.date] = row.count;
  }
  return data;
}

// ─── Settings ────────────────────────────────────────────────

/**
 * Get a setting value by key.
 */
export async function getSettingDB(key: string): Promise<string | null> {
  const row = await getDB().getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

/**
 * Set a setting value.
 */
export async function setSettingDB(key: string, value: string): Promise<void> {
  await getDB().runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

/**
 * Get the lifetime base count.
 */
export async function getLifetimeBaseDB(): Promise<number> {
  const val = await getSettingDB('lifetime_base');
  return val ? parseInt(val, 10) : 0;
}

/**
 * Set the lifetime base count.
 */
export async function setLifetimeBaseDB(value: number): Promise<void> {
  await setSettingDB('lifetime_base', String(value));
}

// ─── Migration from AsyncStorage ─────────────────────────────

/**
 * One-time migration: reads old AsyncStorage data and inserts into SQLite.
 * Safe to call multiple times — only runs once.
 */
export async function migrateFromAsyncStorage(): Promise<void> {
  try {
    // Check if migration was already done
    const migrationDone = await getSettingDB('migration_from_async_storage');
    if (migrationDone === 'done') return;

    // Read old data from AsyncStorage
    const [rawJaap, rawBase] = await Promise.all([
      AsyncStorage.getItem(LEGACY_JAAP_DATA_KEY),
      AsyncStorage.getItem(LEGACY_LIFETIME_BASE_KEY),
    ]);

    const database = getDB();

    // Migrate jaap entries
    if (rawJaap) {
      const jaapData: Record<string, number> = JSON.parse(rawJaap);
      const entries = Object.entries(jaapData);

      if (entries.length > 0) {
        // Use a transaction for bulk insert
        await database.withTransactionAsync(async () => {
          for (const [dateKey, count] of entries) {
            if (count > 0) {
              await database.runAsync(
                'INSERT OR REPLACE INTO jaap_entries (date, count) VALUES (?, ?)',
                [dateKey, count]
              );
            }
          }
        });
      }
    }

    // Migrate lifetime base
    if (rawBase) {
      const baseVal = parseInt(rawBase, 10);
      if (!isNaN(baseVal) && baseVal > 0) {
        await setLifetimeBaseDB(baseVal);
      }
    }

    // Mark migration as done
    await setSettingDB('migration_from_async_storage', 'done');

    // Clean up old AsyncStorage keys (optional, but tidy)
    await AsyncStorage.multiRemove([
      LEGACY_JAAP_DATA_KEY,
      LEGACY_LIFETIME_BASE_KEY,
    ]);
  } catch (error) {
    // If migration fails, don't crash — the old data is still in AsyncStorage
    // and we'll try again next launch
    console.warn('AsyncStorage migration failed (will retry):', error);
  }
}

// ─── Backup / Restore ────────────────────────────────────────

export interface BackupData {
  version: 1;
  appVersion: string;
  exportedAt: string;
  lifetimeBase: number;
  jaapData: Record<string, number>;
}

/**
 * Export all data as a JSON-serializable object.
 */
export async function exportAllData(appVersion: string): Promise<BackupData> {
  const [jaapData, lifetimeBase] = await Promise.all([
    getAllEntriesDB(),
    getLifetimeBaseDB(),
  ]);

  return {
    version: 1,
    appVersion,
    exportedAt: new Date().toISOString(),
    lifetimeBase,
    jaapData,
  };
}

/**
 * Import data from a backup, replacing all existing data.
 */
export async function importAllData(backup: BackupData): Promise<void> {
  const database = getDB();

  await database.withTransactionAsync(async () => {
    // Clear existing data
    await database.runAsync('DELETE FROM jaap_entries');

    // Insert all entries from backup
    for (const [dateKey, count] of Object.entries(backup.jaapData)) {
      if (count > 0) {
        await database.runAsync(
          'INSERT INTO jaap_entries (date, count) VALUES (?, ?)',
          [dateKey, count]
        );
      }
    }

    // Set lifetime base
    await database.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('lifetime_base', ?)",
      [String(backup.lifetimeBase)]
    );
  });
}
