import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { ConfigBase } from '@gen-epix/ui-client-common/models/config.models';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import { renderComponent } from '../../test/lib';

import { HomePage } from './HomePage';

const INTRODUCTION_TEXT = 'Welcome to the sequence database introduction';

const renderIntroductionText = (text: string) => (
  <p>
    {text}
  </p>
);

const renderNoIntroduction = () => <></>;

describe('HomePage', () => {
  let originalHomePageIntroduction: ConfigBase['HomePageIntroduction'];

  beforeEach(() => {
    originalHomePageIntroduction = DependencyContainerUtil.resolveConfig<ConfigBase>().HomePageIntroduction;
  });

  afterEach(() => {
    DependencyContainerUtil.resolveConfig<ConfigBase>().HomePageIntroduction = originalHomePageIntroduction;
  });

  it('renders the page title', async () => {
    const screen = await renderComponent(
      <HomePage />,
    );

    await expect.element(screen.getByTestId('HomePage')).toBeVisible();
    await expect.poll(() => document.title).toBe(`${DependencyContainerUtil.resolveConfig<ConfigBase>().applicationName} - Home`);
  });

  it('renders the configured home page introduction', async () => {
    const screen = await renderComponent(
      <HomePage />, {
        configure: (config) => {
          config.HomePageIntroduction = () => renderIntroductionText(INTRODUCTION_TEXT);
        },
      },
    );

    await expect.element(screen.getByText(INTRODUCTION_TEXT)).toBeVisible();
  });

  it('renders the page without introduction text when the configured introduction is empty', async () => {
    const screen = await renderComponent(
      <HomePage />, {
        configure: (config) => {
          config.HomePageIntroduction = renderNoIntroduction;
        },
      },
    );

    await expect.element(screen.getByTestId('HomePage')).toBeVisible();
    await expect.element(screen.getByText(INTRODUCTION_TEXT)).not.toBeInTheDocument();
  });
});
