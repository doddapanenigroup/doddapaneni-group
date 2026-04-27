'use client';

import { Briefcase } from 'lucide-react';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import { getDashboardTitle } from '@/lib/dashboard-title';
import HrCareerApplicationsClient from '@/components/dashboard/HrCareerApplicationsClient';
import { dashboardMainMaxClass } from '@/lib/dashboard-ui';

export default function HrDashboardContent() {
  return (
    <div className={`${dashboardMainMaxClass} space-y-6`}>
      <DashboardPageHeader
        icon={Briefcase}
        title={getDashboardTitle('HR')}
        description={
          <>
            Review applications from the public careers form and download stored resumes. Admins and HR see the same
            data.
          </>
        }
      />
      <HrCareerApplicationsClient />
    </div>
  );
}
