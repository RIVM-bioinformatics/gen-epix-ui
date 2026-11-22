import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetStatus,
} from '@gen-epix/api-casedb';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { RouterService } from '@gen-epix/ui-client-common/classes/services/RouterService';

import { renderComponent } from '../../../test/lib';

import { CasesAlreadyInCaseSetWarningCaseSetLink } from './CasesAlreadyInCaseSetWarningCaseSetLink';

const CATEGORY: CaseDbCaseSetCategory = { description: null, id: 'category-1', name: 'Category A', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: null, id: 'status-1', name: 'Status A', rank: 1 };

const CASE_SET: CaseDbCaseSet = {
  case_set_category_id: CATEGORY.id,
  case_set_status_id: STATUS.id,
  case_type_id: 'case-type-1',
  code: 'OUTBREAK',
  created_in_data_collection_id: 'a2d9f0c4-5b1e-4f3a-8c7d-9e0f1a2b3c4d',
  description: 'Outbreak event',
  id: 'case-set-1',
  name: 'Outbreak Event',
};

const CASE_SET_LINK_NAME = 'Outbreak Event (Category A, Status A)';
const CONFIRMATION_TITLE = 'Do you want to navigate to the "Outbreak Event"-event?';
const EVENT_PATH = '/events/outbreak-event/case-set-1';

let isCategoriesFailing = false;

describe('CasesAlreadyInCaseSetWarningCaseSetLink', () => {
  beforeEach(() => {
    isCategoriesFailing = false;
    mockApiRequest('GET', '/v1/case_set_categories', () => {
      if (isCategoriesFailing) {
        return Response.json({ detail: 'Internal error' }, { status: 500 });
      }
      return Response.json([CATEGORY]);
    });
    mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows the event name with its category and status once loaded', async () => {
    const screen = await renderComponent(
      <CasesAlreadyInCaseSetWarningCaseSetLink caseSet={CASE_SET} />,
    );

    await expect.element(screen.getByRole('link', { name: CASE_SET_LINK_NAME })).toBeVisible();
  });

  it('opens a confirmation when the link is clicked and closes it on cancel without navigating', async () => {
    const routerService = new RouterService({
      adminRoutes: [],
      homePageComponent: () => <div />,
      routes: [
        { element: <div />, path: '/' },
        { element: <div />, path: EVENT_PATH },
      ],
    });
    container.registerInstance(RouterService, routerService);
    const screen = await renderComponent(
      <CasesAlreadyInCaseSetWarningCaseSetLink caseSet={CASE_SET} />,
    );

    await screen.getByRole('link', { name: CASE_SET_LINK_NAME }).click();
    await expect.element(screen.getByText(CONFIRMATION_TITLE)).toBeVisible();
    await expect.element(screen.getByTestId('Confirmation-textContent')).toHaveTextContent('This will navigate to the "Outbreak Event"-event. You will loose your current selection of cases and all applied filters. Do you want to continue?');

    await screen.getByTestId('Confirmation-cancelButton').click();
    await expect.poll(() => screen.getByText(CONFIRMATION_TITLE).elements().length).toBe(0);
    expect(routerService.router.state.location.pathname).toBe('/');
  });

  it('navigates to the event page when the confirmation is continued', async () => {
    const routerService = new RouterService({
      adminRoutes: [],
      homePageComponent: () => <div />,
      routes: [
        { element: <div />, path: '/' },
        { element: <div />, path: EVENT_PATH },
      ],
    });
    container.registerInstance(RouterService, routerService);
    const screen = await renderComponent(
      <CasesAlreadyInCaseSetWarningCaseSetLink caseSet={CASE_SET} />,
    );

    await screen.getByRole('link', { name: CASE_SET_LINK_NAME }).click();
    await expect.element(screen.getByText(CONFIRMATION_TITLE)).toBeVisible();
    await screen.getByTestId('Confirmation-confirmButton').click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe(EVENT_PATH);
    await routerService.router.navigate('/');
  });

  it('hides the link and shows an error when the categories cannot be loaded', async () => {
    isCategoriesFailing = true;
    const screen = await renderComponent(
      <CasesAlreadyInCaseSetWarningCaseSetLink caseSet={CASE_SET} />,
    );

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeVisible();
    await expect.poll(() => screen.getByRole('link', { name: CASE_SET_LINK_NAME }).elements().length).toBe(0);
  });
});
