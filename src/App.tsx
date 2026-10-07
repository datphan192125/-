/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { PerformanceModule } from './components/performance/PerformanceModule';
import { AwardsModule } from './components/awards/AwardsModule';
import { UserProfileModule } from './components/profile/UserProfileModule';
import { AdminTeamModule } from './components/admin/AdminTeamModule';
import { AdminConfigModule } from './components/admin/AdminConfigModule';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  switch (activeTab) {
    case 'home':
      return <HomeDashboard />;
    case 'kpi':
    case 'mendan':
    case 'evaluations':
      return <PerformanceModule />;
    case 'awards':
      return <AwardsModule />;
    case 'profile':
      return <UserProfileModule />;
    case 'admin-team':
      return <AdminTeamModule />;
    case 'admin-config':
      return <AdminConfigModule />;
    default:
      return <PerformanceModule />;
  }
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout>
        <MainContent />
      </AppLayout>
    </AppProvider>
  );
}
