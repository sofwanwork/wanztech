'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  className,
  placeholder = 'Pick a time',
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse current value
  const [hours, minutes] = React.useMemo(() => {
    if (!value) return [12, 0];
    const parts = value.split(':');
    return [parseInt(parts[0]) || 12, parseInt(parts[1]) || 0];
  }, [value]);

  const handleHourChange = (hour: number) => {
    const newValue = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onChange?.(newValue);
  };

  const handleMinuteChange = (minute: number) => {
    const newValue = `${hours.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange?.(newValue);
  };

  const handleTimeChange = (hour: number, minute: number) => {
    const newValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange?.(newValue);
  };

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full h-12 justify-start text-left font-normal text-base border-slate-200',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? formatTime(hours, minutes) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex p-4 gap-4 justify-center">
          {/* Hours Column */}
          <div className="flex flex-col w-24">
            <span className="text-xs font-medium text-center text-muted-foreground mb-2">Hour</span>
            <div className="h-48 overflow-y-auto scrollbar-thin border rounded-lg">
              <div className="p-1">
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourChange(hour)}
                    className={cn(
                      'w-full px-4 py-2 text-sm rounded-md transition-colors text-center',
                      hours === hour ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Minutes Column */}
          <div className="flex flex-col w-24">
            <span className="text-xs font-medium text-center text-muted-foreground mb-2">Min</span>
            <div className="h-48 overflow-y-auto scrollbar-thin border rounded-lg">
              <div className="p-1">
                {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleMinuteChange(minute)}
                    className={cn(
                      'w-full px-4 py-2 text-sm rounded-md transition-colors text-center',
                      minutes === minute ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Select */}
        <div className="border-t p-3 flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              const now = new Date();
              handleTimeChange(now.getHours(), now.getMinutes());
            }}
          >
            Now
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              handleTimeChange(9, 0);
            }}
          >
            9:00 AM
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              handleTimeChange(12, 0);
            }}
          >
            12:00 PM
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              handleTimeChange(17, 0);
            }}
          >
            5:00 PM
          </Button>
        </div>

        {/* Done Button */}
        <div className="border-t p-3">
          <Button className="w-full" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
