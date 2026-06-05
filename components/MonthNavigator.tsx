'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { displayMonth, addMonths } from '@/lib/dateHelpers';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface MonthNavigatorProps {
  currentMonth: Date;
  onChange: (month: Date) => void;
}

export function MonthNavigator({ currentMonth, onChange }: MonthNavigatorProps) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());

  const thisYear = new Date().getFullYear();
  const minYear = thisYear - 3;
  const maxYear = thisYear + 3;

  const selectedMonth = currentMonth.getMonth();   // 0-11
  const selectedYear = currentMonth.getFullYear();

  const handleSelect = (monthIndex: number) => {
    onChange(new Date(pickerYear, monthIndex, 1));
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setPickerYear(currentMonth.getFullYear());
    setOpen(nextOpen);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Previous month */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(addMonths(currentMonth, -1))}
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Clickable month label → opens picker */}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          className="rounded-md px-3 py-1 text-base font-semibold tabular-nums hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Seleccionar mes y año"
        >
          {displayMonth(currentMonth)}
        </PopoverTrigger>

        <PopoverContent className="w-72 p-4" side="bottom" align="center">
          {/* Year navigator */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPickerYear((y) => Math.max(minYear, y - 1))}
              disabled={pickerYear <= minYear}
              aria-label="Año anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-semibold tabular-nums">{pickerYear}</span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPickerYear((y) => Math.min(maxYear, y + 1))}
              disabled={pickerYear >= maxYear}
              aria-label="Año siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month grid — 4 columns × 3 rows */}
          <div className="grid grid-cols-4 gap-1">
            {MONTHS_ES.map((name, i) => {
              const isSelected = i === selectedMonth && pickerYear === selectedYear;
              return (
                <button
                  key={name}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    'rounded-md py-1.5 text-xs font-medium transition-colors',
                    'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'text-foreground'
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Next month */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(addMonths(currentMonth, 1))}
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
