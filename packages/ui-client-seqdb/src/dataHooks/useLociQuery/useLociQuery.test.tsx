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
  useLociQuery,
  useLocusOptionsQuery,
} from './useLociQuery';

const LOCI_PATH = '/v1/loci';

const Probe = () => {
  const query = useLociQuery();
  const { options } = useLocusOptionsQuery();
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

describe('useLociQuery', () => {
  it('returns loci and creates options labelled by code and name, or code alone without a name', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json([
      { code: 'A', id: 'locus-1', name: 'Alpha' },
      { code: 'B', id: 'locus-2' },
      { code: 'C', id: 'locus-3', name: '' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('locus-1,locus-2,locus-3');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('locus-1:A - Alpha,locus-2:B,locus-3:C');
  });

  it('returns an empty list and no options when the API has no loci', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a locus has no ID', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json([
      { code: 'A', id: 'locus-1' },
      { code: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a locus without an ID.');
  });

  it('exposes an error when a locus has an empty ID', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json([
      { code: 'A', id: '' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a locus without an ID.');
  });
});
