import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { RichTextEditorContent } from './RichTextEditorContent';

describe('RichTextEditorContent', () => {
  it('renders formatted source content and updates when the source changes', async () => {
    const screen = await renderComponent(
      <RichTextEditorContent source={'<p>Read-only <strong>content</strong></p>'} />,
    );

    await expect.element(screen.getByText('Read-only content')).toBeVisible();

    await screen.rerender(
      <RichTextEditorContent source={'<p>Updated content</p>'} />,
    );

    await expect.element(screen.getByText('Updated content')).toBeVisible();
    await expect.element(screen.getByText('Read-only content')).not.toBeInTheDocument();
  });

  it('renders an empty source without content', async () => {
    const screen = await renderComponent(
      <RichTextEditorContent source={''} />,
    );

    await expect.element(screen.getByRole('textbox')).not.toBeInTheDocument();
  });
});
