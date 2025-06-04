import { useTheme } from '@mui/material';
import { Box } from '@mui/system';
import MDEditor from '@uiw/react-md-editor';
import { useMemo } from 'react';
import rehypeSanitize from 'rehype-sanitize';
import type { Options } from 'rehype-sanitize';

export type MarkdownContentProps = {
  readonly source: string;
};

export const MarkdownContent = ({ source }: MarkdownContentProps) => {
  const theme = useTheme();
  const remarkRehypeOptions = useMemo<Options>(() => ({
    attributes: {
      a: ['target', 'href'],
    },
    tagNames: ['a', 'p', 'strong', 'ul', 'li', 'ol', 'img', 'del', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'em', 'pre'],
  }), []);

  const rehypePlugins = useMemo(() => {
    return [[rehypeSanitize, remarkRehypeOptions]];
  }, [remarkRehypeOptions]);

  return (
    <Box sx={{
      '& *': {
        fontSize: '1rem',
        fontFamily: theme.typography.fontFamily,
      },
    }}
    >
      <MDEditor.Markdown
        rehypePlugins={rehypePlugins as []}
        remarkRehypeOptions={remarkRehypeOptions}
        source={source}
      />
    </Box>
  );
};
