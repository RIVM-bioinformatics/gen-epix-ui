import { userEvent } from 'vitest/browser';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { HomePageTrendCard } from './HomePageTrendCard';

describe('HomePageTrendCard', () => {
  it('should render the header and the formatted value', async () => {
    const screen = await renderComponent(
      <HomePageTrendCard
        diffPercentage={0}
        header={'Cases'}
        sinceLabel={'since yesterday'}
        value={1234567}
      />,
    );

    await expect.element(screen.getByRole('heading', { name: 'Cases' })).toBeInTheDocument();
    await expect.element(screen.getByTestId('HomePageTrendCard-value')).toHaveTextContent((1234567).toLocaleString());
  });

  it('should show "No change" without the since label when the diff percentage is zero', async () => {
    const screen = await renderComponent(
      <HomePageTrendCard
        diffPercentage={0}
        header={'Cases'}
        sinceLabel={'since yesterday'}
        value={10}
      />,
    );

    await expect.element(screen.getByTestId('HomePageTrendCard-diffPercentage-label')).toHaveTextContent('No change');
    await expect.element(screen.getByTestId('HomePageTrendCard-diffPercentage-label')).not.toHaveTextContent('since yesterday');
    await expect.element(screen.getByTestId('HomePageTrendCard-diffPercentage')).not.toBeInTheDocument();
  });

  it('should show a plus sign and the since label for a positive diff percentage', async () => {
    const screen = await renderComponent(
      <HomePageTrendCard
        diffPercentage={12.5}
        header={'Cases'}
        sinceLabel={'since yesterday'}
        value={10}
      />,
    );

    await expect.element(screen.getByTestId('HomePageTrendCard-diffPercentage')).toHaveTextContent(`+${(12.5).toLocaleString()}%`);
    await expect.element(screen.getByTestId('HomePageTrendCard-diffPercentage-label')).toHaveTextContent('since yesterday');
  });

  it('should show a negative diff percentage without a plus sign', async () => {
    const screen = await renderComponent(
      <HomePageTrendCard
        diffPercentage={-3}
        header={'Cases'}
        sinceLabel={'since last week'}
        value={10}
      />,
    );

    await expect.element(screen.getByTestId('HomePageTrendCard-diffPercentage')).toHaveTextContent('-3%');
    await expect.element(screen.getByTestId('HomePageTrendCard-diffPercentage-label')).toHaveTextContent('since last week');
  });

  it('should not render a button when no callback is given', async () => {
    const screen = await renderComponent(
      <HomePageTrendCard
        callbackLabel={'Show'}
        diffPercentage={0}
        header={'Cases'}
        sinceLabel={'since yesterday'}
        value={10}
      />,
    );

    await expect.element(screen.getByTestId('HomePageTrendCard-button')).not.toBeInTheDocument();
  });

  it('should not render a button when no callback label is given', async () => {
    const screen = await renderComponent(
      <HomePageTrendCard
        callback={vi.fn()}
        diffPercentage={0}
        header={'Cases'}
        sinceLabel={'since yesterday'}
        value={10}
      />,
    );

    await expect.element(screen.getByTestId('HomePageTrendCard-button')).not.toBeInTheDocument();
  });

  it('should render a button that invokes the callback when clicked', async () => {
    const callback = vi.fn();
    const screen = await renderComponent(
      <HomePageTrendCard
        callback={callback}
        callbackLabel={'Show cases'}
        diffPercentage={0}
        header={'Cases'}
        sinceLabel={'since yesterday'}
        value={10}
      />,
    );

    await expect.element(screen.getByTestId('HomePageTrendCard-button')).toHaveTextContent('Show cases');
    await userEvent.click(screen.getByTestId('HomePageTrendCard-button').element());
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
