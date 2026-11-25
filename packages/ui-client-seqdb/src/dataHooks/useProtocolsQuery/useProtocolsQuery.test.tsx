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
  useProtocolOptionsQuery,
  useProtocolsQuery,
} from './useProtocolsQuery';

const PROTOCOLS_PATH = '/v1/protocols';

const Probe = () => {
  const query = useProtocolsQuery();
  const { options } = useProtocolOptionsQuery();
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

describe('useProtocolsQuery', () => {
  it('returns protocols and creates options labelled by name, then code, then ID', async () => {
    mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([
      { code: 'PA', id: 'protocol-1', name: 'Alpha' },
      { code: 'Beta', id: 'protocol-2' },
      { id: 'protocol-3' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('protocol-1,protocol-2,protocol-3');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('protocol-1:Alpha,protocol-2:Beta,protocol-3:protocol-3');
  });

  it('returns an empty list and no options when the API has no protocols', async () => {
    mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a protocol has no ID', async () => {
    mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([
      { id: 'protocol-1', name: 'Alpha' },
      { name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a protocol without an ID.');
  });

  it('exposes an error when a protocol has an empty ID', async () => {
    mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([
      { id: '', name: 'Alpha' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a protocol without an ID.');
  });
});
