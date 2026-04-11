import type { BadgeOwnProps } from '@mui/material';
import {
  Badge,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import type { ReactElement } from 'react';

import type { PropsWithTestIdAttributes } from '../../../models/testId';
import { TestIdUtil } from '../../../utils/TestIdUtil';


export type SidebarMenuItemProps = PropsWithTestIdAttributes<{
  readonly badgeColor?: BadgeOwnProps['color'];
  readonly badgeContent?: number | string;
  readonly first?: boolean;
  readonly icon: ReactElement;
  readonly onClick: () => void;
  readonly title: string;
}>;

export const SidebarMenuItem = ({
  badgeColor = 'secondary',
  badgeContent,
  first,
  icon,
  onClick,
  testIdAttributes,
  title,
}: SidebarMenuItemProps) => {
  const theme = useTheme();

  return (
    <Tooltip
      arrow
      placement={'right'}
      title={title}
    >
      <IconButton
        {...TestIdUtil.createAttributes('SidebarMenuItem', testIdAttributes)}
        aria-label={title}
        color={'primary'}
        onClick={onClick}
        sx={{
          marginLeft: theme.spacing(-1),
          marginTop: theme.spacing(first ? 0 : 2),
          padding: 0,
        }}
      >
        <Badge
          badgeContent={badgeContent ?? 0}
          color={badgeColor}
          sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 15, minWidth: 15 } }}
        >
          {icon}
        </Badge>
      </IconButton>
    </Tooltip>
  );
};
