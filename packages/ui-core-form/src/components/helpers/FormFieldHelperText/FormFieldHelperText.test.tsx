import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { FormFieldHelperText } from './FormFieldHelperText';

describe('FormFieldHelperText', () => {
  it('shows errors before warning and info messages and honors noIndent', async () => {
    const screen = await renderComponent(
      <FormFieldHelperText
        errorMessage={'A field error'}
        infoMessage={'More information'}
        noIndent
        warningMessage={'A field warning'}
      />,
    );
    const alert = screen.getByRole('alert');
    const alertElement = screen.container.querySelector<HTMLElement>('[role="alert"]');

    await expect.element(alert).toHaveTextContent('A field error');
    await expect.element(alert).toHaveClass('Mui-error');
    expect(alertElement).not.toBeNull();
    expect(window.getComputedStyle(alertElement).marginLeft).toBe('0px');

    await screen.rerender(
      <FormFieldHelperText errorMessage={'A field error'} />,
    );
    const indentedAlert = screen.container.querySelector<HTMLElement>('[role="alert"]');

    expect(indentedAlert).not.toBeNull();
    expect(window.getComputedStyle(indentedAlert).marginLeft).toBe('-16px');
  });

  it('shows warnings before info and uses the default indentation', async () => {
    const screen = await renderComponent(
      <FormFieldHelperText
        infoMessage={'More information'}
        warningMessage={'A field warning'}
      />,
    );
    const alert = screen.getByRole('alert');
    const alertElement = screen.container.querySelector<HTMLElement>('[role="alert"]');

    await expect.element(alert).toHaveTextContent('A field warning');
    await expect.element(alert).toHaveClass('Mui-warning');
    expect(alertElement).not.toBeNull();
    expect(window.getComputedStyle(alertElement).marginLeft).toBe('-16px');

    await screen.rerender(
      <FormFieldHelperText
        noIndent
        warningMessage={'A field warning'}
      />,
    );
    const unindentedAlert = screen.container.querySelector<HTMLElement>('[role="alert"]');

    expect(unindentedAlert).not.toBeNull();
    expect(window.getComputedStyle(unindentedAlert).marginLeft).toBe('0px');
  });

  it('shows information with noIndent', async () => {
    const screen = await renderComponent(
      <FormFieldHelperText
        infoMessage={'More information'}
        noIndent
      />,
    );
    const alert = screen.getByRole('alert');
    const alertElement = screen.container.querySelector<HTMLElement>('[role="alert"]');

    await expect.element(alert).toHaveTextContent('More information');
    expect(alertElement).not.toBeNull();
    expect(window.getComputedStyle(alertElement).marginLeft).toBe('0px');

    await screen.rerender(
      <FormFieldHelperText infoMessage={'More information'} />,
    );
    const indentedAlert = screen.container.querySelector<HTMLElement>('[role="alert"]');

    expect(indentedAlert).not.toBeNull();
    expect(window.getComputedStyle(indentedAlert).marginLeft).toBe('-16px');
  });

  it('renders nothing when all messages are empty or omitted', async () => {
    const screen = await renderComponent(
      <FormFieldHelperText
        errorMessage={''}
        infoMessage={''}
        warningMessage={''}
      />,
    );

    expect(screen.container.querySelector('[role="alert"]')).toBeNull();
  });
});
