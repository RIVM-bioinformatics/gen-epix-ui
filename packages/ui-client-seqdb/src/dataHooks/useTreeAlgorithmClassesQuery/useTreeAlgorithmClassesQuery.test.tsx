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
  useTreeAlgorithmClassesQuery,
  useTreeAlgorithmClassOptionsQuery,
} from './useTreeAlgorithmClassesQuery';

const TREE_ALGORITHM_CLASSES_PATH = '/v1/tree_algorithm_classes';

const Probe = () => {
  const query = useTreeAlgorithmClassesQuery();
  const { options } = useTreeAlgorithmClassOptionsQuery();
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

describe('useTreeAlgorithmClassesQuery', () => {
  it('returns tree algorithm classes and creates options labelled by code and name', async () => {
    mockApiRequest('GET', TREE_ALGORITHM_CLASSES_PATH, () => Response.json([
      { code: 'TAC2', id: 'tac-2', name: 'Second' },
      { code: 'TAC1', id: 'tac-1', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('tac-2,tac-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('tac-1:TAC1 - First,tac-2:TAC2 - Second');
  });

  it('returns an empty list and no options when the API has no tree algorithm classes', async () => {
    mockApiRequest('GET', TREE_ALGORITHM_CLASSES_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a tree algorithm class has no ID', async () => {
    mockApiRequest('GET', TREE_ALGORITHM_CLASSES_PATH, () => Response.json([
      { code: 'TAC1', id: 'tac-1', name: 'First' },
      { code: 'TAC2', name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a tree algorithm class without an ID.');
  });

  it('exposes an error when a tree algorithm class has an empty ID', async () => {
    mockApiRequest('GET', TREE_ALGORITHM_CLASSES_PATH, () => Response.json([
      { code: 'TAC1', id: '', name: 'First' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a tree algorithm class without an ID.');
  });
});
