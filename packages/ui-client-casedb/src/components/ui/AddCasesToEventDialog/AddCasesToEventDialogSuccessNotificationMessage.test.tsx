import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { RouterService } from '@gen-epix/ui-client-common/classes/services/RouterService';

import { renderComponent } from '../../../test/lib';

import { AddCasesToEventDialogSuccessNotificationMessage } from './AddCasesToEventDialogSuccessNotificationMessage';

const caseSet: CaseDbCaseSet = {
  case_set_category_id: 'category-1',
  case_set_status_id: 'status-1',
  case_type_id: 'case-type-1',
  code: 'OUTBREAK',
  created_in_data_collection_id: 'data-collection-1',
  description: 'Outbreak event',
  id: 'case-set-1',
  name: 'Outbreak Event',
};

describe('AddCasesToEventDialogSuccessNotificationMessage', () => {
  it('shows the number of added cases and the event name', async () => {
    const screen = await renderComponent(
      <AddCasesToEventDialogSuccessNotificationMessage
        caseSet={caseSet}
        numAddedCases={3}
      />,
    );

    await expect.element(screen.getByText('Successfully added 3 case(s) to event: Outbreak Event')).toBeVisible();
  });

  it('navigates the router to the event page when the link is clicked', async () => {
    const routerService = new RouterService({
      adminRoutes: [],
      homePageComponent: () => <div />,
      routes: [
        { element: <div />, path: '/' },
        { element: <div />, path: '/events/outbreak-event/case-set-1' },
      ],
    });
    container.registerInstance(RouterService, routerService);

    const screen = await renderComponent(
      <AddCasesToEventDialogSuccessNotificationMessage
        caseSet={caseSet}
        numAddedCases={1}
      />,
    );

    await screen.getByRole('link', { name: 'View event: Outbreak Event' }).click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe('/events/outbreak-event/case-set-1');
    await routerService.router.navigate('/');
  });
});
