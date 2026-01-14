'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function DashboardSearch() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const [term, setTerm] = useState(searchParams.get('q')?.toString() || '');

    useEffect(() => {
        const handler = setTimeout(() => {
            // Use window.location.search to always get the freshest URL state
            // This avoids dependency loops with searchParams prop
            const params = new URLSearchParams(window.location.search);
            if (term) {
                params.set('q', term);
            } else {
                params.delete('q');
            }
            replace(`/?${params.toString()}`);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [term, replace]); // Removed searchParams from dependencies

    return (
        <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                placeholder="Search forms..."
                className="pl-9 h-10 bg-white"
                onChange={(e) => setTerm(e.target.value)}
                value={term}
            />
        </div>
    );
}
