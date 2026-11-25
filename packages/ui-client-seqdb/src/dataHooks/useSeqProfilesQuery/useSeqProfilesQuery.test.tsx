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
  useSeqProfileOptionsQuery,
  useSeqProfilesQuery,
} from './useSeqProfilesQuery';

const SEQ_PROFILES_PATH = '/v1/seq_profiles';

const Probe = () => {
  const query = useSeqProfilesQuery();
  const { options } = useSeqProfileOptionsQuery();
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

describe('useSeqProfilesQuery', () => {
  it('returns sequence profiles and creates options labelled by ID', async () => {
    mockApiRequest('GET', SEQ_PROFILES_PATH, () => Response.json([
      { id: 'profile-2' },
      { id: 'profile-1' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    await expect.element(screen.getByTestId('query')).toHaveTextContent('profile-2,profile-1');
    await expect.element(screen.getByTestId('options')).toHaveTextContent('profile-1:profile-1,profile-2:profile-2');
  });

  it('returns an empty list and no options when the API has no sequence profiles', async () => {
    mockApiRequest('GET', SEQ_PROFILES_PATH, () => Response.json([]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('success');
    expect(screen.getByTestId('options').element().textContent).toBe('');
  });

  it('exposes an error when a sequence profile has no ID', async () => {
    mockApiRequest('GET', SEQ_PROFILES_PATH, () => Response.json([
      { id: 'profile-1' },
      { name: 'Without ID' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a sequence profile without an ID.');
  });

  it('exposes an error when a sequence profile has an empty ID', async () => {
    mockApiRequest('GET', SEQ_PROFILES_PATH, () => Response.json([
      { id: '' },
    ]));

    const screen = await renderComponent(
      <Probe />,
    );

    await expect.element(screen.getByTestId('status')).toHaveTextContent('error');
    await expect.element(screen.getByTestId('error')).toHaveTextContent('SeqDB returned a sequence profile without an ID.');
  });
});
