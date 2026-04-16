'use client';

import { useEffect } from 'react';

interface StoreOriginSetterProps {
  slug: string;
}

export function StoreOriginSetter({ slug }: StoreOriginSetterProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('shop_origin', slug);
  }, [slug]);

  return null;
}
