'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-inner transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-primary/90',
        'data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0',
          'transition-transform duration-200 ease-in-out',
          'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
          'data-[state=checked]:shadow-md'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
