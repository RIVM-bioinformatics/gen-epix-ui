import { renderHook } from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { useRichTextEditorExtensions } from './useRichTextEditorExtensions';

describe('useRichTextEditorExtensions', () => {
  it('returns the configured extensions and applies the optional placeholder', () => {
    const { result } = renderHook(() => useRichTextEditorExtensions());
    const extensionNames = result.current.map((extension) => extension.name);
    const getExtension = (name: string) => {
      const extension = result.current.find((candidate) => candidate.name === name);
      if (!extension) {
        throw new Error(`Expected ${name} extension to be configured`);
      }
      return extension;
    };

    expect(extensionNames.indexOf('table')).toBeLessThan(extensionNames.indexOf('tableRow'));
    expect(extensionNames.indexOf('bold')).toBeLessThan(extensionNames.indexOf('blockquote'));
    expect(getExtension('table').options).toMatchObject({ resizable: true });
    expect(getExtension('textAlign').options).toMatchObject({
      types: ['heading', 'paragraph', 'image'],
    });
    expect(getExtension('highlight').options).toMatchObject({ multicolor: true });
    expect(getExtension('taskItem').options).toMatchObject({ nested: true });
    expect(getExtension('placeholder').options).toMatchObject({ placeholder: undefined });
  });

  it('memoizes extensions until the placeholder changes', () => {
    const { rerender, result } = renderHook(
      ({ placeholder }) => useRichTextEditorExtensions({ placeholder }),
      { initialProps: { placeholder: 'Initial placeholder' } },
    );
    const initialExtensions = result.current;
    const initialPlaceholder = result.current.find((extension) => extension.name === 'placeholder');

    expect(initialPlaceholder?.options).toMatchObject({ placeholder: 'Initial placeholder' });

    rerender({ placeholder: 'Initial placeholder' });

    expect(result.current).toBe(initialExtensions);

    rerender({ placeholder: 'Updated placeholder' });

    expect(result.current).not.toBe(initialExtensions);
    expect(result.current.find((extension) => extension.name === 'placeholder')?.options)
      .toMatchObject({ placeholder: 'Updated placeholder' });
  });
});
