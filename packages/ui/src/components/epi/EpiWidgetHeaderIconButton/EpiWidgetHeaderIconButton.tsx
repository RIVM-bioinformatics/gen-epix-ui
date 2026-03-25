import type { IconButtonProps } from '@mui/material';
import {
  IconButton,
  Tooltip,
} from '@mui/material';

export interface WidgetHeaderIconButtonProps extends IconButtonProps {
  readonly label: string;
}

export const WidgetHeaderIconButton = ({ label, ...props }: WidgetHeaderIconButtonProps) => {
  const iconButtonElement = (
    <IconButton
      {...props}
      aria-label={label}
      color={'primary'}
      sx={{
        ...props.sx,
        '& svg': {
          fontSize: 18,
        },
      }}
    />
  );

  // Note: disabled buttons cannot have a tooltip
  if (props.disabled) {
    return iconButtonElement;
  }

  return (
    <Tooltip
      arrow
      placement={'bottom'}
      title={label}
    >
      {iconButtonElement}
    </Tooltip>
  );
};
