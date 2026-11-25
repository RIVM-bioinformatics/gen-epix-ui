import {
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { Spinner } from './Spinner';

const getRequiredElement = <T extends Element>(container: ParentNode, selector: string): T => {
  const element = container.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected to find ${selector}`);
  }
  return element;
};

it('renders the default loading status and progress indicator', async () => {
  const screen = await renderComponent(
    <Spinner />,
  );
  const status = getRequiredElement<HTMLElement>(screen.baseElement, '[role="status"]');
  const progress = getRequiredElement<HTMLElement>(screen.baseElement, '[role="progressbar"]');
  const label = getRequiredElement<HTMLParagraphElement>(status, 'p');

  await expect.element(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  expect(getComputedStyle(status).position).toBe('absolute');
  expect(progress).toHaveClass('MuiCircularProgress-colorPrimary');
  expect(progress.style.width).toBe('40px');
  expect(getComputedStyle(label.parentElement).position).toBe('absolute');
  expect(label.textContent).toBe('Loading');
});

it('supports inline layout, custom progress props, and visible label styling', async () => {
  const screen = await renderComponent(
    <Spinner
      color={'secondary'}
      inline
      label={'Preparing records'}
      size={24}
      takingLongerTimeoutMs={10000}
      textColor={'rgb(1, 2, 3)'}
    />,
  );
  const status = getRequiredElement<HTMLElement>(screen.baseElement, '[role="status"]');
  const progress = getRequiredElement<HTMLElement>(screen.baseElement, '[role="progressbar"]');
  const label = screen.getByText('Preparing records');

  await expect.element(label).toBeVisible();
  expect(getComputedStyle(status).position).toBe('relative');
  expect(getComputedStyle(status).width).toBe(`${window.innerWidth}px`);
  expect(progress).toHaveClass('MuiCircularProgress-colorSecondary');
  expect(progress.style.width).toBe('24px');
  expect(getComputedStyle(getRequiredElement<HTMLParagraphElement>(status, 'p')).color)
    .toBe('rgb(1, 2, 3)');
});

it('shows a custom long-running message after the configured delay', async () => {
  const screen = await renderComponent(
    <Spinner
      label={'Loading report'}
      takingLongerLabel={'Still preparing the report'}
      takingLongerTimeoutMs={0}
    />,
  );

  await expect.element(screen.getByText('Still preparing the report')).toBeVisible();
});

it('uses default labels when the label and long-running message are empty', async () => {
  const screen = await renderComponent(
    <Spinner
      label={''}
      takingLongerLabel={''}
      takingLongerTimeoutMs={0}
    />,
  );
  const status = getRequiredElement<HTMLElement>(screen.baseElement, '[role="status"]');

  await expect.element(
    screen.getByText('This is taking longer than expected. We are still trying.'),
  ).toBeVisible();
  expect(status.textContent).toBe('This is taking longer than expected. We are still trying.');
  expect(getComputedStyle(getRequiredElement<HTMLParagraphElement>(status, 'p').parentElement)
    .position)
    .toBe('absolute');
});

it('cancels the previous delay and starts a new one when the timeout changes', async () => {
  const screen = await renderComponent(
    <Spinner
      takingLongerLabel={'Still working'}
      takingLongerTimeoutMs={10000}
    />,
  );

  await screen.rerender(
    <Spinner
      takingLongerLabel={'Still working'}
      takingLongerTimeoutMs={0}
    />,
  );
  await expect.element(screen.getByText('Still working')).toBeVisible();
});
