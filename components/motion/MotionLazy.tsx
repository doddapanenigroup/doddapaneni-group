'use client';

import type { ReactNode } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';

type Props = { children: ReactNode };

/**
 * Uses Framer’s lightweight `domAnimation` bundle instead of the full motion runtime.
 * Children must use `m` from `framer-motion`, not `motion`.
 */
export default function MotionLazy({ children }: Props) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
