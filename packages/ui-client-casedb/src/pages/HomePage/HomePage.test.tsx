import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { CaseDbApiPermission } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { AuthorizationService } from '@gen-epix/ui-client-common/classes/services/AuthorizationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import type { ConfigBase } from '@gen-epix/ui-client-common/models/config.models';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { container } from 'tsyringe';

import { renderComponent } from '../../test/lib';

import { HomePage } from './HomePage';

const INTRODUCTION_TEXT = 'Welcome to the case database introduction';
const CASE_TYPES_PATH = '/v1/case_types';
const CASE_SETS_PATH = '/v1/case_sets';
const CASE_SETS_QUERY_PATH = '/v1/case_sets/query';
const STATS_PATH = '/v1/retrieve/case_type_stats';

const ALL_REQUIRED_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.RetrieveCaseTypeStatsCommand, permission_type: CaseDbPermissionType.EXECUTE },
  { command_name: CaseDbCommandName.CaseSetCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
];

const renderIntroductionText = (text: string) => (
  <p>
    {text}
  </p>
);

const renderNoIntroduction = () => <></>;

describe('HomePage', () => {
  let originalHomePageIntroduction: ConfigBase['HomePageIntroduction'];

  beforeEach(() => {
    originalHomePageIntroduction = DependencyContainerUtil.resolveConfig<ConfigBase>().HomePageIntroduction;
    // AuthorizationService is typed for common permissions only, while the case DB routes check case DB command names at runtime.
    container.resolve(AuthorizationService).apiPermissions = ALL_REQUIRED_PERMISSIONS as unknown as CommonDbApiPermission[];

    mockApiRequest('POST', STATS_PATH, () => Response.json([]));
    mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json([]));
    mockApiRequest('GET', CASE_SETS_PATH, () => Response.json([]));
    mockApiRequest('POST', CASE_SETS_QUERY_PATH, () => Response.json([]));
  });

  afterEach(() => {
    DependencyContainerUtil.resolveConfig<ConfigBase>().HomePageIntroduction = originalHomePageIntroduction;
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(AuthorizationService).apiPermissions = [];
  });

  it('renders the page title and the trends section', async () => {
    const screen = await renderComponent(
      <HomePage />,
    );

    await expect.element(screen.getByTestId('HomePage')).toBeVisible();
    await expect.poll(() => document.title).toBe(`${DependencyContainerUtil.resolveConfig<ConfigBase>().applicationName} - Home`);
    await expect.element(screen.getByRole('button', { name: 'View more trends' })).toBeVisible();
  });

  it('renders the configured home page introduction', async () => {
    const screen = await renderComponent(
      <HomePage />, {
        configure: (config) => {
          config.HomePageIntroduction = () => renderIntroductionText(INTRODUCTION_TEXT);
        },
      },
    );

    await expect.element(screen.getByText(INTRODUCTION_TEXT)).toBeVisible();
  });

  it('renders the page without introduction text when the configured introduction is empty', async () => {
    const screen = await renderComponent(
      <HomePage />, {
        configure: (config) => {
          config.HomePageIntroduction = renderNoIntroduction;
        },
      },
    );

    await expect.element(screen.getByTestId('HomePage')).toBeVisible();
    await expect.element(screen.getByText(INTRODUCTION_TEXT)).not.toBeInTheDocument();
  });
});
