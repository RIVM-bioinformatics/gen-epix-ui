import { createTheme } from '@mui/material/styles';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { BackdropSpinner } from './BackdropSpinner';

const getBackdropStyles = (baseElement: HTMLElement): CSSStyleDeclaration => {
  const backdrop = baseElement.querySelector<HTMLElement>('.MuiBackdrop-root');

  if (!backdrop) {
    throw new Error('Backdrop element was not rendered');
  }

  return getComputedStyle(backdrop);
};

describe('BackdropSpinner', () => {
  it('shows the spinner with the light theme backdrop styles', async () => {
    const screen = await renderComponent(
      <BackdropSpinner
        label={'Saving changes'}
        open
      />,
    );
    const spinner = screen.getByRole('status');

    await expect.element(spinner).toBeVisible();
    await expect.element(screen.getByText('Saving changes')).toBeVisible();
    expect(getBackdropStyles(screen.baseElement).backgroundColor).toBe('rgba(255, 255, 255, 0.6)');
    expect(getBackdropStyles(screen.baseElement).backdropFilter).toBe('blur(3px)');
    expect(getBackdropStyles(screen.baseElement).zIndex).toBe('1201');
  });

  it('uses the dark theme backdrop color when no color is provided', async () => {
    const screen = await renderComponent(
      <BackdropSpinner
        label={'Loading'}
        open
      />,
      { theme: createTheme({ palette: { mode: 'dark' } }) },
    );

    expect(getBackdropStyles(screen.baseElement).backgroundColor).toBe('rgba(0, 0, 0, 0.6)');
  });

  it('uses a supplied background color', async () => {
    const screen = await renderComponent(
      <BackdropSpinner
        backgroundColor={'rgb(5, 6, 7)'}
        label={'Loading'}
        open
      />,
      { theme: createTheme({ palette: { mode: 'dark' } }) },
    );

    expect(getBackdropStyles(screen.baseElement).backgroundColor).toBe('rgb(5, 6, 7)');
  });

  it('does not render the spinner when closed', async () => {
    const screen = await renderComponent(
      <BackdropSpinner
        label={'Loading'}
        open={false}
      />,
    );

    await expect.element(screen.getByRole('status')).not.toBeInTheDocument();
  });
});
