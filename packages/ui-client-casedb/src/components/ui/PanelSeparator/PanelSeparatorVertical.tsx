import {
  Box,
  styled,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SeparatorProps } from 'react-resizable-panels';
import { Separator } from 'react-resizable-panels';

const StyledSeparator = styled(Separator)(() => ({}));

export const PanelSeparatorVertical = (props: SeparatorProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <StyledSeparator
      {...props}
      aria-label={t('Vertical separator')}
      sx={{
        '&:hover > div': {
          background: theme.palette.primary.main,
          margin: '0 4px ',
          width: '3px',
        },
        width: '11px',
      }}
    >
      <Box
        sx={{
          background: theme.palette.divider,
          height: '100%',
          margin: '0 5px',
          width: '1px',
        }}
      />
    </StyledSeparator>
  );
};
