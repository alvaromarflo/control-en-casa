'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, CloudOff, CheckCircle2, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MonthNavigator } from '@/components/MonthNavigator';
import { LimpiezaTab } from '@/components/LimpiezaTab';
import { GastosTab } from '@/components/GastosTab';
import { ReporteTab } from '@/components/ReporteTab';
import { SettingsSheet } from '@/components/SettingsSheet';
import { NotificationBell } from '@/components/NotificationBell';
import { useStore, type SyncStatus } from '@/hooks/useStore';
import { startOfMonth, dateString, displayMonth } from '@/lib/dateHelpers';
import { getPendingRecurring } from '@/lib/gastoHelpers';
import type { Gasto } from '@/lib/types';

const TABS = ['limpieza', 'casa', 'peques'] as const;
type TabValue = typeof TABS[number];

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
  const [activeTab, setActiveTab] = useState<TabValue>('limpieza');
  const [reporteOpen, setReporteOpen] = useState(false);

  // Swipe handling
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return; // too short
    const idx = TABS.indexOf(activeTab);
    if (dx < 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1]); // swipe left → next
    if (dx > 0 && idx > 0) setActiveTab(TABS[idx - 1]);               // swipe right → prev
  };

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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="flex-1 flex flex-col">
        <div className="px-4 pb-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="limpieza">Limpieza</TabsTrigger>
            <TabsTrigger value="casa">Casa</TabsTrigger>
            <TabsTrigger value="peques">Peques</TabsTrigger>
          </TabsList>
        </div>

        <div
          className="flex-1 px-4 overflow-y-auto"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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
        </div>
      </Tabs>

      {/* ── Floating Reporte CTA ── */}
      <div className="fixed bottom-6 right-4 z-40">
        <Button
          size="lg"
          className="rounded-full shadow-lg gap-2 pr-5"
          onClick={() => setReporteOpen(true)}
        >
          <BarChart2 className="h-5 w-5" />
          Reporte del mes
        </Button>
      </div>

      {/* ── Reporte Sheet ── */}
      <Sheet open={reporteOpen} onOpenChange={setReporteOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] rounded-t-xl p-5 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Reporte — {displayMonth(currentMonth)}</SheetTitle>
          </SheetHeader>
          <ReporteTab
            currentMonth={currentMonth}
            attendances={store.attendances}
            payments={store.payments}
            gastos={store.gastos}
            service={store.service}
            onAddPayment={addPayment}
            onDeletePayment={deletePayment}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

