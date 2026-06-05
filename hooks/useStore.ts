'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppStore, Attendance, Payment, Gasto } from '@/lib/types';

const STORAGE_KEY = 'control-en-casa-v1';
const SYNC_DEBOUNCE_MS = 1500; // wait 1.5 s after last change before saving to Sheets

const DEFAULT_STORE: AppStore = {
  attendances: [],
  payments: [],
  gastos: [],
  service: { name: 'Limpieza', rate: 45.5 },
  settings: { familyName: 'Familia', theme: 'auto' },
};

function loadLocalStore(): AppStore {
  if (typeof window === 'undefined') return DEFAULT_STORE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    return { ...DEFAULT_STORE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STORE;
  }
}

function saveLocalStore(store: AppStore): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

async function fetchRemoteStore(): Promise<AppStore | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function pushRemoteStore(store: AppStore): Promise<void> {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store),
    });
  } catch {
    // Silent — localStorage already has the data
  }
}

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error';

export function useStore() {
  const [store, setStore] = useState<AppStore>(DEFAULT_STORE);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStoreRef = useRef<AppStore | null>(null);

  // On mount: load localStorage immediately, then fetch remote and merge
  useEffect(() => {
    const local = loadLocalStore();
    setStore(local);
    setHydrated(true);

    setSyncStatus('syncing');
    fetchRemoteStore().then((remote) => {
      if (remote) {
        // Remote is the source of truth; persist locally too
        setStore(remote);
        saveLocalStore(remote);
        setSyncStatus('saved');
      } else {
        setSyncStatus('idle');
      }
    });
  }, []);

  // Debounced push to Sheets after every change
  const scheduleSync = useCallback((next: AppStore) => {
    pendingStoreRef.current = next;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSyncStatus('syncing');
    debounceRef.current = setTimeout(async () => {
      const toSave = pendingStoreRef.current;
      if (!toSave) return;
      await pushRemoteStore(toSave);
      setSyncStatus('saved');
      // Reset to idle after a moment so UI indicator fades
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, SYNC_DEBOUNCE_MS);
  }, []);

  const update = useCallback(
    (updater: (prev: AppStore) => AppStore) => {
      setStore((prev) => {
        const next = updater(prev);
        saveLocalStore(next);   // instant local save
        scheduleSync(next);     // debounced remote save
        return next;
      });
    },
    [scheduleSync]
  );

  // ── Attendance ─────────────────────────────────────────────────────────────

  const toggleAttendance = useCallback(
    (date: string) => {
      update((prev) => {
        const existing = prev.attendances.find((a) => a.date === date);
        if (!existing) {
          const newAttendance: Attendance = {
            id: crypto.randomUUID(),
            date,
            present: true,
            paid: false,
            createdAt: new Date().toISOString(),
          };
          return { ...prev, attendances: [...prev.attendances, newAttendance] };
        }
        if (existing.present) {
          // present → absent
          return {
            ...prev,
            attendances: prev.attendances.map((a) =>
              a.id === existing.id ? { ...a, present: false, paid: false } : a
            ),
          };
        }
        // absent → remove record
        return {
          ...prev,
          attendances: prev.attendances.filter((a) => a.id !== existing.id),
        };
      });
    },
    [update]
  );

  const updateAttendance = useCallback(
    (id: string, changes: Partial<Attendance>) => {
      update((prev) => ({
        ...prev,
        attendances: prev.attendances.map((a) =>
          a.id === id ? { ...a, ...changes } : a
        ),
      }));
    },
    [update]
  );

  // ── Payments ───────────────────────────────────────────────────────────────

  const addPayment = useCallback(
    (payment: Omit<Payment, 'id'>) => {
      update((prev) => ({
        ...prev,
        payments: [
          ...prev.payments,
          { ...payment, id: crypto.randomUUID() },
        ],
      }));
    },
    [update]
  );

  const deletePayment = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        payments: prev.payments.filter((p) => p.id !== id),
      }));
    },
    [update]
  );

  // ── Gastos ────────────────────────────────────────────────────────────────

  const addGasto = useCallback(
    (gasto: Omit<Gasto, 'id'>) => {
      update((prev) => ({
        ...prev,
        gastos: [{ ...gasto, id: crypto.randomUUID() }, ...prev.gastos],
      }));
    },
    [update]
  );

  const deleteGasto = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        gastos: prev.gastos.filter((g) => g.id !== id),
      }));
    },
    [update]
  );

  // ── Service ───────────────────────────────────────────────────────────────

  const updateService = useCallback(
    (changes: Partial<AppStore['service']>) => {
      update((prev) => ({
        ...prev,
        service: { ...prev.service, ...changes },
      }));
    },
    [update]
  );

  // ── Settings ──────────────────────────────────────────────────────────────

  const updateSettings = useCallback(
    (changes: Partial<AppStore['settings']>) => {
      update((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...changes },
      }));
    },
    [update]
  );

  return {
    store,
    hydrated,
    syncStatus,
    toggleAttendance,
    updateAttendance,
    addPayment,
    deletePayment,
    addGasto,
    deleteGasto,
    updateService,
    updateSettings,
  };
}
