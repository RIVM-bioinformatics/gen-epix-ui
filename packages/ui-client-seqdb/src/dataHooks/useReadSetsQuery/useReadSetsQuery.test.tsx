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
  useReadSetOptionsQuery,
  useReadSetsQuery,
} from './useReadSetsQuery';

const READ_SETS_PATH = '/v1/read_sets';

const Probe = () => {
  const query = useReadSetsQuery();
  const { options } = useReadSetOptionsQuery();
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

describe('useReadSetsQuery', () => {
  it('returns read sets and creates options labelled by code, then ID', async () => {
    mockApiRequest('GET', READ_SETS_PATH, () => Response.json([
      { code: 'Reads-B', id: 'rs-2' },
      { id: 'rs-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('rs-2,rs-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('rs-2:Reads-B,rs-1:rs-1');
  });

  it('returns an empty list and no options when the API has no read sets', async () => {
    mockApiRequest('GET', READ_SETS_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a read set has no ID', async () => {
    mockApiRequest('GET', READ_SETS_PATH, () => Response.json([
      { code: 'Reads-A', id: 'rs-1' },
      { code: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a read set without an ID.');
  });
});
