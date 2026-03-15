import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  initDB,
  migrateFromAsyncStorage,
  getAllEntriesDB,
  setDayCountDB,
  getLifetimeBaseDB,
  setLifetimeBaseDB,
  exportAllData,
  importAllData,
  BackupData,
} from '../db/database';

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface JaapContextValue {
  jaapData: Record<string, number>;
  lifetimeBase: number;
  totalLifetime: number;
  todayCount: number;
  yesterdayCount: number;
  twoDaysAgoCount: number;
  setDayCount: (date: Date, count: number) => void;
  getDayCount: (date: Date) => number;
  setLifetimeBase: (value: number) => void;
  getDateKey: (date: Date) => string;
  currentStreak: number;
  isLoaded: boolean;
  createBackup: () => Promise<BackupData>;
  restoreBackup: (data: BackupData) => Promise<void>;
}

const JaapContext = createContext<JaapContextValue | null>(null);

export function JaapProvider({ children }: { children: ReactNode }) {
  const [jaapData, setJaapData] = useState<Record<string, number>>({});
  const [lifetimeBase, setLifetimeBaseState] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize DB, migrate old data, and load into memory
  useEffect(() => {
    (async () => {
      try {
        await initDB();
        await migrateFromAsyncStorage();

        const [entries, base] = await Promise.all([
          getAllEntriesDB(),
          getLifetimeBaseDB(),
        ]);

        setJaapData(entries);
        setLifetimeBaseState(base);
      } catch (error) {
        console.warn('Failed to initialize database:', error);
      }
      setIsLoaded(true);
    })();
  }, []);

  const setDayCount = useCallback((date: Date, count: number) => {
    const key = getDateKey(date);
    setJaapData((prev) => {
      const updated = { ...prev };
      if (count <= 0) {
        delete updated[key];
      } else {
        updated[key] = count;
      }
      // Persist to SQLite (fire and forget)
      setDayCountDB(key, count).catch((err) =>
        console.warn('Failed to persist day count:', err)
      );
      return updated;
    });
  }, []);

  const getDayCount = useCallback(
    (date: Date): number => {
      return jaapData[getDateKey(date)] || 0;
    },
    [jaapData]
  );

  const setLifetimeBase = useCallback((value: number) => {
    setLifetimeBaseState(value);
    setLifetimeBaseDB(value).catch((err) =>
      console.warn('Failed to persist lifetime base:', err)
    );
  }, []);

  // Backup: export all data as a JSON object
  const createBackup = useCallback(async (): Promise<BackupData> => {
    return exportAllData('1.0.0');
  }, []);

  // Restore: import data from a backup JSON object, then reload state
  const restoreBackup = useCallback(async (data: BackupData): Promise<void> => {
    await importAllData(data);
    // Reload from DB
    const [entries, base] = await Promise.all([
      getAllEntriesDB(),
      getLifetimeBaseDB(),
    ]);
    setJaapData(entries);
    setLifetimeBaseState(base);
  }, []);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const totalLifetime =
    lifetimeBase + Object.values(jaapData).reduce((sum, v) => sum + v, 0);

  let currentStreak = 0;
  const tempDate = new Date();

  if (getDayCount(tempDate) > 0) {
    currentStreak++;
    tempDate.setDate(tempDate.getDate() - 1);
  } else {
    tempDate.setDate(tempDate.getDate() - 1);
    if (getDayCount(tempDate) > 0) {
      currentStreak++;
      tempDate.setDate(tempDate.getDate() - 1);
    }
  }

  if (currentStreak > 0) {
    while (getDayCount(tempDate) > 0) {
      currentStreak++;
      tempDate.setDate(tempDate.getDate() - 1);
    }
  }

  const value: JaapContextValue = {
    jaapData,
    lifetimeBase,
    totalLifetime,
    todayCount: getDayCount(today),
    yesterdayCount: getDayCount(yesterday),
    twoDaysAgoCount: getDayCount(twoDaysAgo),
    setDayCount,
    getDayCount,
    setLifetimeBase,
    getDateKey,
    currentStreak,
    isLoaded,
    createBackup,
    restoreBackup,
  };

  return <JaapContext.Provider value={value}>{children}</JaapContext.Provider>;
}

export function useJaap(): JaapContextValue {
  const ctx = useContext(JaapContext);
  if (!ctx) throw new Error('useJaap must be used within JaapProvider');
  return ctx;
}
