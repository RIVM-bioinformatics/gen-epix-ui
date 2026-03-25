import {
  useTheme,
  Box,
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
          fontSize: '1rem',
          fontFamily: theme.typography.fontFamily,
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
