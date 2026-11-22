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
  useLocusSetOptionsQuery,
  useLocusSetsQuery,
} from './useLocusSetsQuery';

const LOCUS_SETS_PATH = '/v1/locus_sets';

const Probe = () => {
  const query = useLocusSetsQuery();
  const { options } = useLocusSetOptionsQuery();
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

describe('useLocusSetsQuery', () => {
  it('returns locus sets and creates options labelled by code and name', async () => {
    mockApiRequest('GET', LOCUS_SETS_PATH, () => Response.json([
      { code: 'LS2', id: 'ls-2', name: 'Second' },
      { code: 'LS1', id: 'ls-1', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('ls-2,ls-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('ls-1:LS1 - First,ls-2:LS2 - Second');
  });

  it('returns an empty list and no options when the API has no locus sets', async () => {
    mockApiRequest('GET', LOCUS_SETS_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a locus set has no ID', async () => {
    mockApiRequest('GET', LOCUS_SETS_PATH, () => Response.json([
      { code: 'LS1', id: 'ls-1', name: 'First' },
      { code: 'LS2', name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a locus set without an ID.');
  });

  it('exposes an error when a locus set has an empty ID', async () => {
    mockApiRequest('GET', LOCUS_SETS_PATH, () => Response.json([
      { code: 'LS1', id: '', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a locus set without an ID.');
  });
});
