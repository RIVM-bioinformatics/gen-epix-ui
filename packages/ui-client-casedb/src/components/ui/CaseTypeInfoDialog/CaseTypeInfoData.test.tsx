import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { CaseTypeInfoData } from './CaseTypeInfoData';

const TITLE = 'Some title';
const NAME = 'Some name';

describe('CaseTypeInfoData', () => {
  it('renders the title and the name when a name is given', async () => {
    const screen = await renderComponent(
      <CaseTypeInfoData
        name={NAME}
        title={TITLE}
      />,
    );

    await expect.element(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
    await expect.element(screen.getByText(NAME)).toBeInTheDocument();
  });

  it('renders "Not applicable" when the name is empty', async () => {
    const screen = await renderComponent(
      <CaseTypeInfoData
        name={''}
        title={TITLE}
      />,
    );

    await expect.element(screen.getByRole('heading', { name: TITLE })).toBeInTheDocument();
    await expect.element(screen.getByText('Not applicable')).toBeInTheDocument();
  });
});
