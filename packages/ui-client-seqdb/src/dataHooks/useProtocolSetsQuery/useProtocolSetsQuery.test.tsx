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
  useProtocolSetOptionsQuery,
  useProtocolSetsQuery,
} from './useProtocolSetsQuery';

const PROTOCOL_SETS_PATH = '/v1/protocol_sets';

const Probe = () => {
  const query = useProtocolSetsQuery();
  const { options } = useProtocolSetOptionsQuery();
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

describe('useProtocolSetsQuery', () => {
  it('returns protocol sets and creates options labelled by code and name', async () => {
    mockApiRequest('GET', PROTOCOL_SETS_PATH, () => Response.json([
      { code: 'PS2', id: 'ps-2', name: 'Second' },
      { code: 'PS1', id: 'ps-1', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('ps-2,ps-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('ps-1:PS1 - First,ps-2:PS2 - Second');
  });

  it('returns an empty list and no options when the API has no protocol sets', async () => {
    mockApiRequest('GET', PROTOCOL_SETS_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a protocol set has no ID', async () => {
    mockApiRequest('GET', PROTOCOL_SETS_PATH, () => Response.json([
      { code: 'PS1', id: 'ps-1', name: 'First' },
      { code: 'PS2', name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a protocol set without an ID.');
  });

  it('exposes an error when a protocol set has an empty ID', async () => {
    mockApiRequest('GET', PROTOCOL_SETS_PATH, () => Response.json([
      { code: 'PS1', id: '', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a protocol set without an ID.');
  });
});
