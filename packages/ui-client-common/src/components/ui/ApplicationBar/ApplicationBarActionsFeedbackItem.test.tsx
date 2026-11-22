import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';

import { UserSettingsService } from '../../../classes/services/UserSettingsService';
import type { ConfigBase } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { ApplicationBarActionsFeedbackItem } from './ApplicationBarActionsFeedbackItem';

const FEEDBACK_TOOLTIP_TEXT = 'Would you like to share your feedback?';
const IMMEDIATE_TOOLTIP_DELAY_MS = 0;
const LONG_TOOLTIP_DELAY_MS = 60 * 60 * 1000;

const waitForMilliseconds = async (milliseconds: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, milliseconds);
});

const setTooltipDelay = (delayMs: number) => (config: ConfigBase) => {
  config.userFeedback.SHOW_USER_FEEDBACK_TOOLTIP_AFTER_MS = delayMs;
};

describe('ApplicationBarActionsFeedbackItem', () => {
  afterEach(() => {
    container.resolve(UserSettingsService).showShowUserFeedbackTooltip = true;
  });

  it('shows the feedback tooltip once the configured delay has passed', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsFeedbackItem />, {
        configure: setTooltipDelay(IMMEDIATE_TOOLTIP_DELAY_MS),
      },
    );

    await expect.element(screen.getByRole('tooltip')).toHaveTextContent(FEEDBACK_TOOLTIP_TEXT);
  });

  it('does not show the feedback tooltip when it was already dismissed', async () => {
    container.resolve(UserSettingsService).showShowUserFeedbackTooltip = false;

    const screen = await renderComponent(
      <ApplicationBarActionsFeedbackItem />, {
        configure: setTooltipDelay(IMMEDIATE_TOOLTIP_DELAY_MS),
      },
    );

    await waitForMilliseconds(50);
    expect(screen.getByRole('tooltip').query()).toBeNull();
  });

  it('does not show the feedback tooltip before the configured delay has passed', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsFeedbackItem />, {
        configure: setTooltipDelay(LONG_TOOLTIP_DELAY_MS),
      },
    );

    await waitForMilliseconds(50);
    expect(screen.getByRole('tooltip').query()).toBeNull();
  });

  it('cancels the pending tooltip timer when unmounted', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsFeedbackItem />, {
        configure: setTooltipDelay(IMMEDIATE_TOOLTIP_DELAY_MS + 50),
      },
    );

    await screen.unmount();
    await waitForMilliseconds(100);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('hides the tooltip and dismisses it for good when hovered', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsFeedbackItem />, {
        configure: setTooltipDelay(IMMEDIATE_TOOLTIP_DELAY_MS),
      },
    );
    await expect.element(screen.getByRole('tooltip')).toBeVisible();

    await screen.getByRole('button', { name: 'Feedback' }).hover();

    await expect.poll(() => screen.getByRole('tooltip').query()).toBeNull();
    expect(container.resolve(UserSettingsService).showShowUserFeedbackTooltip).toBe(false);
  });

  it('opens the user feedback dialog when the feedback button is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsFeedbackItem />, {
        configure: setTooltipDelay(LONG_TOOLTIP_DELAY_MS),
      },
    );

    await screen.getByRole('button', { name: 'Feedback' }).click();

    await expect.element(screen.getByRole('dialog')).toBeVisible();
  });
});
