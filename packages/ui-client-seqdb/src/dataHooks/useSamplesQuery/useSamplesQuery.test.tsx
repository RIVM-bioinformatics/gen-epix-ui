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
  useSampleOptionsQuery,
  useSamplesQuery,
} from './useSamplesQuery';

const SAMPLES_PATH = '/v1/samples';

const Probe = () => {
  const query = useSamplesQuery();
  const { options } = useSampleOptionsQuery();
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

describe('useSamplesQuery', () => {
  it('returns samples and creates options labelled by code, then ID', async () => {
    mockApiRequest('GET', SAMPLES_PATH, () => Response.json([
      { code: 'A-code', id: 'sample-2' },
      { id: 'sample-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('sample-2,sample-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('sample-2:A-code,sample-1:sample-1');
  });

  it('returns an empty list and no options when the API has no samples', async () => {
    mockApiRequest('GET', SAMPLES_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a sample has no ID', async () => {
    mockApiRequest('GET', SAMPLES_PATH, () => Response.json([
      { code: 'S1', id: 'sample-1' },
      { code: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a sample without an ID.');
  });
});
