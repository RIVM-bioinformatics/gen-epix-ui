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
  useSeqCategoriesQuery,
  useSeqCategoryOptionsQuery,
} from './useSeqCategoriesQuery';

const SEQ_CATEGORIES_PATH = '/v1/seq_categories';

const Probe = () => {
  const query = useSeqCategoriesQuery();
  const { options } = useSeqCategoryOptionsQuery();
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

describe('useSeqCategoriesQuery', () => {
  it('returns sequence categories and creates options labelled by code and name', async () => {
    mockApiRequest('GET', SEQ_CATEGORIES_PATH, () => Response.json([
      { code: 'SC2', id: 'sc-2', name: 'Second' },
      { code: 'SC1', id: 'sc-1', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('sc-2,sc-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('sc-1:SC1 - First,sc-2:SC2 - Second');
  });

  it('returns an empty list and no options when the API has no sequence categories', async () => {
    mockApiRequest('GET', SEQ_CATEGORIES_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a sequence category has no ID', async () => {
    mockApiRequest('GET', SEQ_CATEGORIES_PATH, () => Response.json([
      { code: 'SC1', id: 'sc-1', name: 'First' },
      { code: 'SC2', name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a sequence category without an ID.');
  });

  it('exposes an error when a sequence category has an empty ID', async () => {
    mockApiRequest('GET', SEQ_CATEGORIES_PATH, () => Response.json([
      { code: 'SC1', id: '', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a sequence category without an ID.');
  });
});
