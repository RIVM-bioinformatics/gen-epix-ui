import { Box } from '@mui/material';
import type { PropsWithChildren } from 'react';

export type CustomTabPanelProps = PropsWithChildren<{
  readonly index: number;
  readonly value: number;
}>;

export const CustomTabPanel = (props: CustomTabPanelProps) => {
  const { children, index, value, ...other } = props;

  return (
    <div
      aria-labelledby={`simple-tab-${index}`}
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      role={'tabpanel'}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};
