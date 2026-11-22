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
  useSeqCategorySetOptionsQuery,
  useSeqCategorySetsQuery,
} from './useSeqCategorySetsQuery';

const SEQ_CATEGORY_SETS_PATH = '/v1/seq_category_sets';

const Probe = () => {
  const query = useSeqCategorySetsQuery();
  const { options } = useSeqCategorySetOptionsQuery();
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

describe('useSeqCategorySetsQuery', () => {
  it('returns sequence category sets and creates options labelled by code and name', async () => {
    mockApiRequest('GET', SEQ_CATEGORY_SETS_PATH, () => Response.json([
      { code: 'SCS2', id: 'scs-2', name: 'Second' },
      { code: 'SCS1', id: 'scs-1', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('scs-2,scs-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('scs-1:SCS1 - First,scs-2:SCS2 - Second');
  });

  it('returns an empty list and no options when the API has no sequence category sets', async () => {
    mockApiRequest('GET', SEQ_CATEGORY_SETS_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a sequence category set has no ID', async () => {
    mockApiRequest('GET', SEQ_CATEGORY_SETS_PATH, () => Response.json([
      { code: 'SCS1', id: 'scs-1', name: 'First' },
      { code: 'SCS2', name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a sequence category set without an ID.');
  });

  it('exposes an error when a sequence category set has an empty ID', async () => {
    mockApiRequest('GET', SEQ_CATEGORY_SETS_PATH, () => Response.json([
      { code: 'SCS1', id: '', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a sequence category set without an ID.');
  });
});
