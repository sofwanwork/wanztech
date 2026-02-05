'use client';

import * as React from 'react';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = 'Pick a date',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full h-12 justify-start text-left font-normal text-base border-slate-200',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={handleSelect} initialFocus />

        {/* Quick Select Buttons */}
        <div className="border-t p-3 flex gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-normal h-7 px-2"
            onClick={() => handleSelect(new Date())}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-normal h-7 px-2"
            onClick={() => handleSelect(addDays(new Date(), 1))}
          >
            Tomorrow
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-normal h-7 px-2"
            onClick={() => handleSelect(addDays(new Date(), 7))}
          >
            Next Week
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
            onClick={() => handleSelect(undefined)}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
