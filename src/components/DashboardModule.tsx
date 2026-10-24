/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CompanyConfig } from '../types';
import Step20IndicatorsModule from './Step20IndicatorsModule';

interface DashboardModuleProps {
  config: CompanyConfig;
  companyName?: string;
  companyNit?: string;
  companyLogo?: string;
  onNavigateToStep?: (stepId: number) => void;
}

export default function DashboardModule({
  config,
  companyName,
  companyNit,
  companyLogo,
  onNavigateToStep
}: DashboardModuleProps) {
  return (
    <div className="space-y-4" id="pesv-dashboard-module-view">
      <Step20IndicatorsModule 
        config={config} 
        companyName={companyName}
        companyNit={companyNit}
        companyLogo={companyLogo}
        onNavigateToStep={onNavigateToStep} 
      />
    </div>
  );
}
