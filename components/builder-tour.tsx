'use client';

import { useState, useEffect } from 'react';
import { Joyride, STATUS, Step, EventData } from 'react-joyride';
import { useTheme } from 'next-themes';

interface BuilderTourProps {
  run: boolean;
  onFinish: () => void;
}

export function BuilderTour({ run, onFinish }: BuilderTourProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps: Step[] = [
    {
      target: '#tour-form-title',
      content: 'First, enter a descriptive title for your form here.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-google-sheet',
      content: 'Paste your Google Sheet link here. Alternatively, you can also generate a new sheet automatically from the Responses page later.',
      placement: 'bottom',
    },
    {
      target: '#tour-add-question',
      content: 'Click this button to add a new question or field to your form.',
      placement: 'top',
    },
    {
      target: '#tour-drag-handle',
      content: 'Click and drag this handle anytime to reorder your form questions.',
      placement: 'right',
    },
    {
      target: '#tour-save-button',
      content: 'Finally, click "Save Changes" whenever you are done editing your form!',
      placement: 'bottom',
    },
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  if (!mounted) return null;

  const tourSteps = steps.map(step => ({ ...step, scrollOffset: 150 }));

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous={true}
      options={{
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
        primaryColor: '#7c3aed', 
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        textColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        arrowColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      }}
      locale={{
        skip: 'Skip',
        next: 'Next',
        back: 'Back',
        last: 'Finish',
      }}
      onEvent={handleJoyrideCallback}
      styles={{
        buttonPrimary: {
          backgroundColor: '#7c3aed',
          borderRadius: '6px',
        },
        buttonBack: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
        },
        buttonSkip: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
        },
      }}
    />
  );
}
