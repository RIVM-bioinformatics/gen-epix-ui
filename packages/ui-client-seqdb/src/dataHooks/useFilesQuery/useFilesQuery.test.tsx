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
  useFileOptionsQuery,
  useFilesQuery,
} from './useFilesQuery';

const FILES_PATH = '/v1/files';

const Probe = () => {
  const query = useFilesQuery();
  const { options } = useFileOptionsQuery();
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

describe('useFilesQuery', () => {
  it('returns files and creates options labelled by ID', async () => {
    mockApiRequest('GET', FILES_PATH, () => Response.json([
      { id: 'file-2', name: 'b.fasta' },
      { id: 'file-1', name: 'a.fasta' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('file-2,file-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('file-1:file-1,file-2:file-2');
  });

  it('returns an empty list and no options when the API has no files', async () => {
    mockApiRequest('GET', FILES_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a file has no ID', async () => {
    mockApiRequest('GET', FILES_PATH, () => Response.json([
      { id: 'file-1' },
      { name: 'without-id.fasta' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a file without an ID.');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });
});
