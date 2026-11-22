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
  useRefSeqOptionsQuery,
  useRefSeqsQuery,
} from './useRefSeqsQuery';

const REF_SEQS_PATH = '/v1/ref_seqs';

const Probe = () => {
  const query = useRefSeqsQuery();
  const { options } = useRefSeqOptionsQuery();
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

describe('useRefSeqsQuery', () => {
  it('returns reference sequences and creates options labelled by code and name', async () => {
    mockApiRequest('GET', REF_SEQS_PATH, () => Response.json([
      { code: 'REF2', id: 'ref-2', name: 'Second' },
      { code: 'REF1', id: 'ref-1', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('ref-2,ref-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('ref-1:REF1 - First,ref-2:REF2 - Second');
  });

  it('returns an empty list and no options when the API has no reference sequences', async () => {
    mockApiRequest('GET', REF_SEQS_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a reference sequence has no ID', async () => {
    mockApiRequest('GET', REF_SEQS_PATH, () => Response.json([
      { code: 'REF1', id: 'ref-1', name: 'First' },
      { code: 'REF2', name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a reference sequence without an ID.');
  });

  it('exposes an error when a reference sequence has an empty ID', async () => {
    mockApiRequest('GET', REF_SEQS_PATH, () => Response.json([
      { code: 'REF1', id: '', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a reference sequence without an ID.');
  });
});
