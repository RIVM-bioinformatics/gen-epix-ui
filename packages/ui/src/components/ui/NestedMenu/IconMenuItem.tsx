import type { MenuItemProps } from '@mui/material/MenuItem';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import type { SxProps } from '@mui/material';
import type {
  MouseEvent,
  ReactNode,
  Ref,
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
  readonly checked?: 'false' | 'mixed' | 'true';
  readonly className?: string;
  readonly disabled?: boolean;
  readonly divider?: boolean;
  readonly label?: string;
  readonly leftIcon?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly MenuItemProps?: MenuItemProps;
  readonly onClick?: (event: MouseEvent<HTMLElement>) => void;
  readonly ref?: Ref<HTMLLIElement>;
  readonly rightIcon?: ReactNode;
  readonly sx?: SxProps;
};

export const IconMenuItem = ({ checked, className, label, leftIcon, MenuItemProps, ref, rightIcon, ...props }: IconMenuItemProps) => {
  return (
    <StyledMenuItem
      {...MenuItemProps}
      className={className}
      ref={ref}
      {...props}
      aria-checked={checked}
      role={checked ? 'menuitemcheckbox' : 'menuitem'}
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
