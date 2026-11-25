import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  mockApiRequest,
  renderComponent,
} from '@gen-epix/ui-client-common/test/lib';

import {
  usePayerPlanPeriodOptionsQuery,
  usePayerPlanPeriodQuery,
} from './usePayerPlanPeriodQuery';

const PAYER_PLAN_PERIODS_PATH = '/v1/PayerPlanPeriods';

const Probe = () => {
  const query = usePayerPlanPeriodQuery();
  const { options } = usePayerPlanPeriodOptionsQuery();
  return (
    <>
      <div data-testid={'query'}>
        {(query.data ?? []).map(row => row.id).join(',')}
      </div>
      <div data-testid={'options'}>
        {options.map(option => `${option.value}:${option.label}`).join(',')}
      </div>
    </>
  );
};

describe('usePayerPlanPeriodQuery', () => {
  it('maps payer plan periods to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', PAYER_PLAN_PERIODS_PATH, () => Response.json([
      { payer_plan_period_id: 'id-2' },
      { payer_plan_period_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
