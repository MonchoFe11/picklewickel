'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { track } from '../../lib/analytics';

export default function usePageView() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    track('page_view', { url: pathname + (search ? `?${search}` : '') });
  }, [pathname, search]);
}