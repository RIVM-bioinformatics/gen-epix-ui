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
  useDrugExposureOptionsQuery,
  useDrugExposureQuery,
} from './useDrugExposureQuery';

const DRUG_EXPOSURES_PATH = '/v1/DrugExposures';

const Probe = () => {
  const query = useDrugExposureQuery();
  const { options } = useDrugExposureOptionsQuery();
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

describe('useDrugExposureQuery', () => {
  it('maps drug exposures to rows with an id and creates options from the primary key', async () => {
    mockApiRequest('GET', DRUG_EXPOSURES_PATH, () => Response.json([
      { drug_exposure_id: 'id-2' },
      { drug_exposure_id: 'id-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('query')).toHaveTextContent('id-2,id-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('id-1:id-1,id-2:id-2');
  });
});
