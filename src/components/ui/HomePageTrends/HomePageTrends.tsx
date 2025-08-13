import { useMemo } from 'react';

import { AuthorizationManager } from '../../../classes/managers/AuthorizationManager';
import {
  CommandName,
  PermissionType,
} from '../../../api';

import { HomePageTrendsContent } from './HomePageTrendsContent';

export const HomePageTrends = () => {
  const authorizationManager = useMemo(() => AuthorizationManager.instance, []);

  if (!authorizationManager.doesUserHavePermission([
    { command_name: CommandName.RetrieveCaseTypeStatsCommand, permission_type: PermissionType.E },
    { command_name: CommandName.CaseSetCrudCommand, permission_type: PermissionType.R },
    { command_name: CommandName.CaseTypeCrudCommand, permission_type: PermissionType.R },
  ])) {
    return null;
  }

  return (
    <HomePageTrendsContent />
  );
};
