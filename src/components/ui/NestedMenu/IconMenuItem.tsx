import type { MenuItemProps } from '@mui/material/MenuItem';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import type { SxProps } from '@mui/material';
import type {
  MouseEvent,
  ReactNode,
  RefObject,
} from 'react';

const StyledMenuItem = styled(MenuItem)({
  display: 'flex',
  justifyContent: 'space-between',
  paddingLeft: '4px',
  paddingRight: '4px',
});

const StyledTypography = styled(Typography)({
  paddingLeft: '8px',
  paddingRight: '8px',
  textAlign: 'left',
});

const FlexBox = styled(Box)({
  display: 'flex',
});

type IconMenuItemProps = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly MenuItemProps?: MenuItemProps;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly leftIcon?: ReactNode;
  readonly onClick?: (event: MouseEvent<HTMLElement>) => void;
  readonly ref?: RefObject<HTMLLIElement>;
  readonly rightIcon?: ReactNode;
  readonly sx?: SxProps;
  readonly divider?: boolean;
};

export const IconMenuItem = ({ MenuItemProps, className, label, leftIcon, rightIcon, ref, ...props }: IconMenuItemProps) => {
  return (
    <StyledMenuItem
      {...MenuItemProps}
      className={className}
      ref={ref}
      {...props}
    >
      <FlexBox>
        {leftIcon}
        <StyledTypography>
          {label}
        </StyledTypography>
      </FlexBox>
      {rightIcon}
    </StyledMenuItem>
  );
};
