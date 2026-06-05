'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, CloudOff, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthNavigator } from '@/components/MonthNavigator';
import { LimpiezaTab } from '@/components/LimpiezaTab';
import { GastosTab } from '@/components/GastosTab';
import { ReporteTab } from '@/components/ReporteTab';
import { SettingsSheet } from '@/components/SettingsSheet';
import { NotificationBell } from '@/components/NotificationBell';
import { useStore, type SyncStatus } from '@/hooks/useStore';
import { startOfMonth, dateString } from '@/lib/dateHelpers';
import { getPendingRecurring } from '@/lib/gastoHelpers';
import type { Gasto } from '@/lib/types';

function SyncIndicator({ status }: { status: SyncStatus }) {
  if (status === 'idle') return null;
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {status === 'syncing' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'saved'   && <CheckCircle2 className="h-3 w-3 text-green-500" />}
      {status === 'error'   && <CloudOff className="h-3 w-3 text-destructive" />}
      {status === 'syncing' ? 'Guardando…' : status === 'saved' ? 'Guardado' : 'Sin conexión'}
    </span>
  );
}

export default function Home() {
  const {
    store,
    hydrated,
    syncStatus,
    toggleAttendance,
    updateAttendance,
    addPayment,
    deletePayment,
    addGasto,
    deleteGasto,
    updateGasto,
    updateService,
    updateSettings,
  } = useStore();

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));

  const pendingRecurring = useMemo(
    () => getPendingRecurring(store.gastos, currentMonth),
    [store.gastos, currentMonth],
  );

  const handleConfirmRecurring = (gasto: Gasto, cantidad: number) => {
    addGasto({
      nombre: gasto.nombre,
      cantidad,
      fecha: dateString(new Date()),
      esRecurrente: gasto.esRecurrente,
      recurrenciaNumero: gasto.recurrenciaNumero,
      recurrenciaTipo: gasto.recurrenciaTipo,
      categoria: gasto.categoria,
      subcategoria: gasto.subcategoria,
    });
  };

  // Apply theme preference
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const { theme } = store.settings;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [store.settings.theme, hydrated]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2">
        <div className="flex flex-col gap-0">
          <p className="text-base font-medium text-muted-foreground">Hola,</p>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
            <span className="text-primary">{store.settings.familyName}</span>
          </h1>
          <SyncIndicator status={syncStatus} />
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell
            pending={pendingRecurring}
            onConfirm={handleConfirmRecurring}
          />
          <SettingsSheet
            service={store.service}
            settings={store.settings}
            onUpdateService={updateService}
            onUpdateSettings={updateSettings}
          />
        </div>
      </header>

      {/* ── Month navigator ── */}
      <MonthNavigator currentMonth={currentMonth} onChange={setCurrentMonth} />

      {/* ── Tabs ── */}
      <Tabs defaultValue="limpieza" className="flex-1 flex flex-col">
        <div className="px-4 pb-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="limpieza">Limpieza</TabsTrigger>
            <TabsTrigger value="casa">Casa</TabsTrigger>
            <TabsTrigger value="peques">Peques</TabsTrigger>
            <TabsTrigger value="reporte">Reporte</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 px-4 overflow-y-auto">
          <TabsContent value="limpieza" className="mt-2">
            <LimpiezaTab
              currentMonth={currentMonth}
              attendances={store.attendances}
              service={store.service}
              onToggle={toggleAttendance}
              onUpdate={updateAttendance}
            />
          </TabsContent>

          <TabsContent value="casa" className="mt-2">
            <GastosTab
              currentMonth={currentMonth}
              gastos={store.gastos}
              categoria="casa"
              onAdd={addGasto}
              onDelete={deleteGasto}
              onUpdate={updateGasto}
            />
          </TabsContent>

          <TabsContent value="peques" className="mt-2">
            <GastosTab
              currentMonth={currentMonth}
              gastos={store.gastos}
              categoria="peques"
              onAdd={addGasto}
              onDelete={deleteGasto}
              onUpdate={updateGasto}
            />
          </TabsContent>

          <TabsContent value="reporte" className="mt-2">
            <ReporteTab
              currentMonth={currentMonth}
              attendances={store.attendances}
              payments={store.payments}
              gastos={store.gastos}
              service={store.service}
              onAddPayment={addPayment}
              onDeletePayment={deletePayment}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
