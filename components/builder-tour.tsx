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
      content: 'Mula-mula, berikan nama yang sesuai untuk borang anda di sini.',
      placement: 'bottom',
      skipBeacon: true,
    },
    {
      target: '#tour-google-sheet',
      content: 'Letakkan pautan Google Sheet anda di sini. Sebagai alternatif, anda juga boleh mencipta sheet baharu secara automatik melalui halaman Responses kelak.',
      placement: 'bottom',
    },
    {
      target: '#tour-add-question',
      content: 'Klik butang ini untuk menambah soalan atau medan (field) baru ke dalam borang anda.',
      placement: 'top',
    },
    {
      target: '#tour-drag-handle',
      content: 'Anda boleh klik dan tarik (drag) ikon ini pada bila-bila masa untuk menyusun semula urutan soalan anda.',
      placement: 'right',
    },
    {
      target: '#tour-save-button',
      content: 'Akhir sekali, jangan lupa klik butang "Save Changes" ini setiap kali anda selesai membuat perubahan!',
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
        skip: 'Batal',
        next: 'Seterusnya',
        back: 'Kembali',
        last: 'Selesai',
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
