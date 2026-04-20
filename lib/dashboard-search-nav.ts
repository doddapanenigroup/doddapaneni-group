import type { Role } from '@/lib/constants';
import { getDashboardTitle } from '@/lib/dashboard-title';
import {
  canAccessAdminDashboard,
  canAccessAnalyticsDashboard,
  canAccessDeveloperDashboard,
  canAccessEmployeesDashboard,
  canAccessMarketerDashboard,
} from '@/lib/dashboard-access';
import { publicPathForLocale } from '@/lib/public-path-with-locale';

export type DashboardNavSearchHit = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  /** Lowercase tokens matched against the query */
  searchBlob: string;
};

function dash(locale: string, path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return publicPathForLocale(locale, p);
}

/** All dashboard routes the signed-in role may open — used for ⌘K search. */
export function dashboardNavSearchHits(locale: string, role: Role): DashboardNavSearchHit[] {
  const hits: DashboardNavSearchHit[] = [];

  hits.push({
    id: 'nav:dashboard',
    title: 'Dashboard home',
    subtitle: 'Role overview & entry',
    href: dash(locale, '/dashboard'),
    searchBlob: 'dashboard home overview start landing',
  });

  if (canAccessAdminDashboard(role)) {
    hits.push({
      id: 'nav:admin',
      title: getDashboardTitle('ADMIN'),
      subtitle: 'Administration, sectors, employees',
      href: dash(locale, '/dashboard/admin'),
      searchBlob:
        'admin administration companies sectors employees super admin superadmin feature flags backup',
    });
  }
  if (canAccessDeveloperDashboard(role)) {
    hits.push({
      id: 'nav:developer',
      title: getDashboardTitle('DEVELOPER'),
      subtitle: 'Tools, cache, observability',
      href: dash(locale, '/dashboard/developer'),
      searchBlob: 'developer dev code files errors cache logs observability',
    });
  }
  if (canAccessMarketerDashboard(role)) {
    hits.push({
      id: 'nav:marketer',
      title: getDashboardTitle('DIGITAL_MARKETER'),
      subtitle: 'Blog, media, campaigns',
      href: dash(locale, '/dashboard/marketer'),
      searchBlob: 'marketer marketing digital blog content seo media campaigns links news',
    });
  }
  if (canAccessEmployeesDashboard(role)) {
    hits.push({
      id: 'nav:employees',
      title: 'Employees',
      subtitle: 'Team & accounts',
      href: dash(locale, '/dashboard/employees'),
      searchBlob: 'employees users team people accounts invite hr',
    });
  }
  if (canAccessAnalyticsDashboard(role)) {
    hits.push({
      id: 'nav:analytics',
      title: 'Analytics',
      subtitle: 'Traffic & insights',
      href: dash(locale, '/dashboard/analytics'),
      searchBlob: 'analytics traffic charts stats reports visits',
    });
  }

  hits.push({
    id: 'nav:security',
    title: 'Security',
    subtitle: 'Password & sessions',
    href: dash(locale, '/dashboard/security'),
    searchBlob: 'security password login session account',
  });

  return hits;
}

export function filterDashboardNavSearchHits(
  hits: DashboardNavSearchHit[],
  query: string,
  limit: number,
): DashboardNavSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  return hits
    .filter((h) => {
      const blob = `${h.title} ${h.subtitle} ${h.href} ${h.searchBlob}`.toLowerCase();
      return blob.includes(q);
    })
    .slice(0, limit);
}
