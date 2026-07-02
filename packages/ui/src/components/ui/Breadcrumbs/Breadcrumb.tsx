import {
  Link,
  Typography,
} from '@mui/material';
import type {
  ReactElement,
  MouseEvent as ReactMouseEvent,
} from 'react';
import {
  useCallback,
  useMemo,
} from 'react';
import type { UIMatch } from 'react-router';

import { BreadcrumbService } from '../../../classes/services/BreadcrumbService';
import { RouterService } from '../../../classes/services/RouterService';
import { useSubscribable } from '../../../hooks/useSubscribable';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';

type BreadcrumbProps = {
  readonly isLast: boolean;
  readonly item: UIMatch<unknown, MyNonIndexRouteObject['handle']>;
};

export const Breadcrumb = ({ isLast, item }: BreadcrumbProps): ReactElement => {
  const breadcrumbsTitles = useSubscribable(BreadcrumbService.getInstance());

  const title = useMemo(() => {
    if (breadcrumbsTitles[item.handle.title]) {
      return breadcrumbsTitles[item.handle.title];
    }
    return item.handle.title;
  }, [breadcrumbsTitles, item.handle.title]);

  const onLinkClick = useCallback(async (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    await RouterService.getInstance().router.navigate(item.pathname);
  }, [item.pathname]);

  if (!isLast) {
    return (
      <Link
        color={'inherit'}
        href={item.pathname}
        onClick={onLinkClick}
        underline={'hover'}
      >
        {title}
      </Link>

    );
  }
  return (
    <Typography
      color={'textPrimary'}
      component={'h1'}
    >
      {title}
    </Typography>
  );
};
