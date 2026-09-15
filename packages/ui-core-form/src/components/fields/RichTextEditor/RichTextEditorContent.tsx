import {
  Box,
  useTheme,
} from '@mui/material';
import { RichTextReadOnly } from 'mui-tiptap';

import { useRichTextEditorExtensions } from './useRichTextEditorExtensions';

export type RichTextEditorContentProps = {
  readonly source: string;
};

export const RichTextEditorContent = ({ source }: RichTextEditorContentProps) => {
  const extensions = useRichTextEditorExtensions({
    placeholder: '',
  });
  const theme = useTheme();

  return (
    <Box
      sx={{
        '& *': {
          fontFamily: theme.typography.fontFamily,
          fontSize: '1rem',
        },
      }}
    >
      <RichTextReadOnly
        content={source}
        extensions={extensions}
      />
    </Box>
  );
};
