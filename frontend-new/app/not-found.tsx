"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

export default function NotFound() {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const newPath = `/${defaultLocale}${pathname}`;
        router.replace(newPath);
    }, [pathname, router]);

    return null;
}
