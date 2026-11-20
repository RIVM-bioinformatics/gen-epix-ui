import type { PropsWithChildren } from 'react';
import {
  useCallback,
  useEffect,
} from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useFormContext } from 'react-hook-form';

import { renderComponent } from '../../../test/lib';

import { RichTextEditor } from './RichTextEditor';

type RichTextForm = {
  content: string;
};

const FocusRichTextEditor = ({ children }: PropsWithChildren) => {
  const { reset, setFocus } = useFormContext<RichTextForm>();
  const onSetTargetContent = useCallback(() => reset({ content: '<p>Target content</p>' }), [reset]);

  useEffect(() => {
    setFocus('content');
  }, [setFocus]);

  return (
    <>
      {children}
      <button
        onClick={onSetTargetContent}
        type={'button'}
      >
        {'Set target content'}
      </button>
    </>
  );
};

describe('RichTextEditor', () => {
  it('updates the form and callback once per edit and focuses through the form ref', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <>
        <RichTextEditor<RichTextForm, 'content'>
          infoMessage={'Write a description'}
          label={'Description'}
          name={'content'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Outside editor'}
        </button>
      </>,
      {
        form: { defaultValues: { content: '<p>Initial content</p>' } },
        wrapper: FocusRichTextEditor,
      },
    );
    const editor = screen.getByRole('textbox');

    await expect.element(editor).toHaveFocus();
    await expect.element(screen.getByText('Initial content')).toBeVisible();
    await expect.element(screen.getByText('Write a description')).toBeVisible();

    await editor.fill('First edit');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.lastCall?.[0]).toContain('First edit');
    await expect.element(screen.getByText(/First edit/)).toBeVisible();

    await editor.fill('Second edit');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.lastCall?.[0]).toContain('Second edit');
    await expect.element(screen.getByText(/Second edit/)).toBeVisible();
    await screen.getByRole('button', { name: 'Outside editor' }).click();
  });

  it('clears editor content and reports reset through the callback', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <RichTextEditor<RichTextForm, 'content'>
        label={'Description'}
        name={'content'}
        onChange={onChange}
      />,
      { form: { defaultValues: { content: '<p>Remove this content</p>' } } },
    );

    await expect.element(screen.getByText('Remove this content')).toBeVisible();
    await screen.getByTestId('RichTextEditor').hover();
    await screen.getByRole('button', { name: 'Clear rich text editor content' }).click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith('');
    await expect.element(screen.getByRole('textbox')).toHaveTextContent('');
    await expect.element(screen.getByRole('textbox')).not.toHaveTextContent('Remove this content');
  });

  it('updates the form when no optional callback is supplied', async () => {
    const screen = await renderComponent(
      <>
        <RichTextEditor<RichTextForm, 'content'>
          label={'Description'}
          name={'content'}
        />
        <button type={'button'}>
          {'Outside editor'}
        </button>
      </>,
      {
        form: { defaultValues: { content: '' } },
        wrapper: FocusRichTextEditor,
      },
    );
    const editor = screen.getByRole('textbox');

    await editor.fill('Text without callback');
    await expect.element(editor).toHaveTextContent('Text without callback');
    await screen.getByTestId('RichTextEditor').hover();
    await screen.getByRole('button', { name: 'Clear rich text editor content' }).click();
    await expect.element(editor).toHaveTextContent('');
  });

  it('ignores editor updates matching the current form value', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <RichTextEditor<RichTextForm, 'content'>
        label={'Description'}
        name={'content'}
        onChange={onChange}
      />,
      {
        form: { defaultValues: { content: '<p>Original content</p>' } },
        wrapper: FocusRichTextEditor,
      },
    );
    const editor = screen.getByRole('textbox');

    await screen.getByRole('button', { name: 'Set target content' }).click();
    await editor.fill('Target content');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders a read-only editor and errors while disabled', async () => {
    const screen = await renderComponent(
      <RichTextEditor<RichTextForm, 'content'>
        disabled
        label={'Description'}
        name={'content'}
        required
        warningMessage={'Check the description'}
      />,
      {
        form: {
          defaultValues: { content: '<p>Read only</p>' },
          errors: { content: { message: 'Description is invalid', type: 'manual' } },
        },
      },
    );
    const editor = screen.getByRole('textbox');

    await expect.element(editor).toHaveAttribute('contenteditable', 'false');
    await expect.element(screen.getByText('Read only')).toBeVisible();
    await expect.element(screen.getByText('Description is invalid')).toBeVisible();
    await expect.element(screen.getByText('Description *')).toBeVisible();
    expect(screen.baseElement.querySelector('[data-testid="RichTextEditor-reset"]')).toBeNull();
    expect(screen.baseElement.textContent).not.toContain('Privacy notice');
  });

  it('hides the editor and reset while loading and shows the privacy notice', async () => {
    const screen = await renderComponent(
      <RichTextEditor<RichTextForm, 'content'>
        label={'Description'}
        loading
        name={'content'}
      />,
      { form: { defaultValues: { content: '' } } },
    );

    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    await expect.element(screen.getByText('Privacy notice')).toBeVisible();
    expect(screen.baseElement.querySelector('[contenteditable="true"]')).toBeNull();
    expect(screen.baseElement.querySelector('[data-testid="RichTextEditor-reset"]')).toBeNull();
  });
});
