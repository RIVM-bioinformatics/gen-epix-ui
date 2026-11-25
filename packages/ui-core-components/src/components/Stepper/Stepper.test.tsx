import {
  expect,
  it,
} from 'vitest';

import { STEPPER_DIRECTION } from '../../models/stepper.model';
import { renderComponent } from '../../test/lib';

import { Stepper } from './Stepper';

const getRequiredElement = <T extends Element>(container: ParentNode, selector: string): T => {
  const element = container.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected to find ${selector}`);
  }
  return element;
};

it('renders horizontal progress with active and completed step status', async () => {
  const screen = await renderComponent(
    <Stepper
      activeStep={'review'}
      id={'upload-stepper'}
      steps={[
        {
          index: '',
          key: 'start',
          label: 'Start',
        },
        {
          content: (
            <span>
              {'Review details'}
            </span>
          ),
          key: 'review',
          label: 'Review',
          optional: true,
        },
        {
          key: 'finish',
          label: 'Finish',
        },
      ]}
      sx={{ backgroundColor: 'rgb(1, 2, 3)' }}
    />,
  );
  const root = getRequiredElement<HTMLElement>(screen.baseElement, '#upload-stepper');
  const list = getRequiredElement<HTMLOListElement>(root, 'ol');
  const stepItems = list.querySelectorAll('li');
  const stepIcons = list.querySelectorAll('.MuiStepIcon-root');

  expect(root.getAttribute('role')).toBe('presentation');
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(1, 2, 3)');
  expect(getComputedStyle(list).flexDirection).toBe('row');
  expect(stepItems).toHaveLength(3);
  expect(stepItems[0]?.getAttribute('aria-current')).toBeNull();
  expect(stepItems[1]?.getAttribute('aria-current')).toBe('step');
  expect(stepItems[2]?.getAttribute('aria-current')).toBeNull();
  expect(stepIcons[0]).toHaveClass('Mui-completed');
  expect(stepIcons[0]?.textContent).toBe('');
  expect(stepIcons[1]).toHaveClass('Mui-active');
  expect(stepIcons[1]?.textContent).toBe('2');
  expect(stepIcons[2]?.textContent).toBe('3');
  expect(stepItems[0]?.textContent).toContain('Completed: Start');
  expect(stepItems[1]?.textContent).toContain('Current: Review');
  await expect.element(screen.getByText('Optional')).toBeVisible();
  await expect.element(screen.getByText('Review details')).toBeVisible();
  expect(list.querySelectorAll('[role="presentation"]')).toHaveLength(0);
  expect(screen.baseElement.querySelectorAll('[role="presentation"]')).toHaveLength(2);
});

it('renders vertical progress without completed indicators when requested', async () => {
  const screen = await renderComponent(
    <Stepper
      activeStep={'current'}
      direction={STEPPER_DIRECTION.VERTICAL}
      hideCompletedIndicator
      steps={[
        {
          key: 'start',
          label: 'Start',
        },
        {
          key: 'current',
          label: 'Current',
        },
      ]}
    />,
  );
  const list = getRequiredElement<HTMLOListElement>(screen.baseElement, 'ol');
  const stepItems = list.querySelectorAll('li');
  const stepIcons = list.querySelectorAll('.MuiStepIcon-root');

  expect(getComputedStyle(list).flexDirection).toBe('column');
  expect(stepItems).toHaveLength(2);
  expect(stepItems[0]?.getAttribute('aria-current')).toBeNull();
  expect(stepItems[1]?.getAttribute('aria-current')).toBe('step');
  expect(stepIcons[0]).not.toHaveClass('Mui-completed');
  expect(stepIcons[1]).toHaveClass('Mui-active');
  expect(list.querySelectorAll('[role="presentation"]')).toHaveLength(2);
  expect(screen.baseElement.querySelectorAll('[role="presentation"]')).toHaveLength(3);
});

it('renders an empty horizontal stepper for an empty step list', async () => {
  const screen = await renderComponent(
    <Stepper
      activeStep={'missing'}
      steps={[]}
    />,
  );
  const list = getRequiredElement<HTMLOListElement>(screen.baseElement, 'ol');

  expect(list.children).toHaveLength(0);
  expect(screen.baseElement.querySelectorAll('[role="presentation"]')).toHaveLength(2);
});
