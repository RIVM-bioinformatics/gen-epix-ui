import type { BadgeOwnProps } from '@mui/material';
import {
  Tooltip,
  IconButton,
  useTheme,
  Badge,
} from '@mui/material';
import type { ReactElement } from 'react';

import type { PropsWithTestIdAttributes } from '../../../models/testId';
import { TestIdUtil } from '../../../utils/TestIdUtil';


export type SidebarMenuItemProps = PropsWithTestIdAttributes<{
  readonly title: string;
  readonly onClick: () => void;
  readonly icon: ReactElement;
  readonly badgeContent?: string | number;
  readonly badgeColor?: BadgeOwnProps['color'];
  readonly first?: boolean;
}>;

export const SidebarMenuItem = ({
  title,
  onClick,
  icon,
  badgeContent,
  first,
  badgeColor = 'secondary',
  testIdAttributes,
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
        sx={{
          padding: 0,
          marginTop: theme.spacing(first ? 0 : 2),
          marginLeft: theme.spacing(-1),
        }}
        onClick={onClick}
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
