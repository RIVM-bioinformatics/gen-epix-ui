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
  useSeqOptionsQuery,
  useSeqsQuery,
} from './useSeqsQuery';

const SEQS_PATH = '/v1/seqs';

const Probe = () => {
  const query = useSeqsQuery();
  const { options } = useSeqOptionsQuery();
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

describe('useSeqsQuery', () => {
  it('returns sequences and creates options labelled by code, then ID', async () => {
    mockApiRequest('GET', SEQS_PATH, () => Response.json([
      { code: 'A-code', id: 'seq-2' },
      { id: 'seq-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('seq-2,seq-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('seq-2:A-code,seq-1:seq-1');
  });

  it('returns an empty list and no options when the API has no sequences', async () => {
    mockApiRequest('GET', SEQS_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a sequence has no ID', async () => {
    mockApiRequest('GET', SEQS_PATH, () => Response.json([
      { code: 'A-code', id: 'seq-1' },
      { code: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a sequence without an ID.');
  });
});
