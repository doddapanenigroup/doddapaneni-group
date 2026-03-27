import { type ElementType, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ColKey = 1 | 2 | 3 | 4 | 5 | 6 | 12;

const colClass: Record<ColKey, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

export type ResponsiveCols = {
  base?: ColKey;
  sm?: ColKey;
  md?: ColKey;
  lg?: ColKey;
  xl?: ColKey;
};

export type GridGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

const gapClass: Record<GridGap, string> = {
  none: 'gap-0',
  sm: 'gap-3 sm:gap-4',
  md: 'gap-4 sm:gap-5 md:gap-6',
  lg: 'gap-5 sm:gap-6 lg:gap-8',
  xl: 'gap-6 sm:gap-8 lg:gap-10',
};

function colsToClasses(cols: ResponsiveCols): string {
  const parts: string[] = ['grid'];
  if (cols.base != null) parts.push(colClass[cols.base]);
  if (cols.sm != null) parts.push(`sm:${colClass[cols.sm]}`);
  if (cols.md != null) parts.push(`md:${colClass[cols.md]}`);
  if (cols.lg != null) parts.push(`lg:${colClass[cols.lg]}`);
  if (cols.xl != null) parts.push(`xl:${colClass[cols.xl]}`);
  return parts.join(' ');
}

export type GridProps = HTMLAttributes<HTMLElement> & {
  /** Responsive column counts; defaults to 1 col mobile → 2 → 3 → 4 at xl (division cards). */
  cols?: ResponsiveCols;
  gap?: GridGap;
  as?: ElementType;
};

export function Grid({
  className,
  cols = { base: 1, sm: 2, lg: 3, xl: 4 },
  gap = 'md',
  as: Component = 'div',
  ...props
}: GridProps) {
  return (
    <Component
      className={cn(colsToClasses(cols), gapClass[gap], className)}
      {...props}
    />
  );
}
