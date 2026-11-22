import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
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
  useTaxonSetOptionsQuery,
  useTaxonSetsQuery,
} from './useTaxonSetsQuery';

const TAXON_SETS_PATH = '/v1/taxon_sets';

const Probe = () => {
  const query = useTaxonSetsQuery();
  const { options } = useTaxonSetOptionsQuery();
  return (
    <>
      <div {...TestIdUtil.createAttributes('status')}>
        {query.status}
      </div>
      <div {...TestIdUtil.createAttributes('query')}>
        {(query.data ?? []).map(row => row.id).join(',')}
      </div>
      <div {...TestIdUtil.createAttributes('error')}>
        {query.error?.message}
      </div>
      <div {...TestIdUtil.createAttributes('options')}>
        {options.map(option => `${option.value}:${option.label}`).join(',')}
      </div>
    </>
  );
};

describe('useTaxonSetsQuery', () => {
  it('returns taxon sets and creates options labelled by code and name', async () => {
    mockApiRequest('GET', TAXON_SETS_PATH, () => Response.json([
      { code: 'TS2', id: 'ts-2', name: 'Second' },
      { code: 'TS1', id: 'ts-1', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('ts-2,ts-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('ts-1:TS1 - First,ts-2:TS2 - Second');
  });

  it('returns an empty list and no options when the API has no taxon sets', async () => {
    mockApiRequest('GET', TAXON_SETS_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a taxon set has no ID', async () => {
    mockApiRequest('GET', TAXON_SETS_PATH, () => Response.json([
      { code: 'TS1', id: 'ts-1', name: 'First' },
      { code: 'TS2', name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a taxon set without an ID.');
  });

  it('exposes an error when a taxon set has an empty ID', async () => {
    mockApiRequest('GET', TAXON_SETS_PATH, () => Response.json([
      { code: 'TS1', id: '', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a taxon set without an ID.');
  });
});
