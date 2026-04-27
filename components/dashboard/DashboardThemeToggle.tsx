'use client';

import { Moon, Sun } from 'lucide-react';
import { useDashboardTheme } from '@/components/dashboard/DashboardThemeProvider';
import { dashboardIconButtonClass } from '@/lib/dashboard-ui';

export default function DashboardThemeToggle() {
  const { mode, toggleMode } = useDashboardTheme();
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={dashboardIconButtonClass}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
    </button>
  );
}
