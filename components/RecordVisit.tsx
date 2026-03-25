'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function RecordVisit() {
  const recorded = useRef(false);
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagePath: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
