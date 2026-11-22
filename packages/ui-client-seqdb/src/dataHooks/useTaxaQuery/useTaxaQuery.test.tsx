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
  useTaxaQuery,
  useTaxonOptionsQuery,
} from './useTaxaQuery';

const TAXA_PATH = '/v1/taxa';

const Probe = () => {
  const query = useTaxaQuery();
  const { options } = useTaxonOptionsQuery();
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

describe('useTaxaQuery', () => {
  it('returns taxa and creates options labelled by code and name', async () => {
    mockApiRequest('GET', TAXA_PATH, () => Response.json([
      { code: 'T2', id: 'taxon-2', name: 'Second' },
      { code: 'T1', id: 'taxon-1', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('taxon-2,taxon-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('taxon-1:T1 - First,taxon-2:T2 - Second');
  });

  it('returns an empty list and no options when the API has no taxa', async () => {
    mockApiRequest('GET', TAXA_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a taxon has no ID', async () => {
    mockApiRequest('GET', TAXA_PATH, () => Response.json([
      { code: 'T1', id: 'taxon-1', name: 'First' },
      { code: 'T2', name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a taxon without an ID.');
  });

  it('exposes an error when a taxon has an empty ID', async () => {
    mockApiRequest('GET', TAXA_PATH, () => Response.json([
      { code: 'T1', id: '', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a taxon without an ID.');
  });
});
