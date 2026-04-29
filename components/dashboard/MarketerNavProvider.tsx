'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type MarketerMainSection = 'pages' | 'blogs' | 'media';

type Caps = { canPages: boolean; canBlogs: boolean };

type Value = {
  caps: Caps;
  section: MarketerMainSection;
  setSection: (s: MarketerMainSection) => void;
  registerMarketerCaps: (c: Caps) => void;
};

const Ctx = createContext<Value | null>(null);

export function MarketerNavProvider({ children }: { children: React.ReactNode }) {
  const [caps, setCaps] = useState<Caps>({ canPages: false, canBlogs: false });
  const [section, setSection] = useState<MarketerMainSection>('blogs');

  const registerMarketerCaps = useCallback((c: Caps) => {
    setCaps(c);
  }, []);

  const value = useMemo(
    () => ({ caps, section, setSection, registerMarketerCaps }),
    [caps, section, registerMarketerCaps],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarketerNav(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMarketerNav requires MarketerNavProvider');
  return v;
}

export function useMarketerNavOptional(): Value | null {
  return useContext(Ctx);
}
