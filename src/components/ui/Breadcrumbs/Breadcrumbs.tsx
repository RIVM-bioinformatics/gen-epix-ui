import type { UIMatch } from 'react-router-dom';
import { useMatches } from 'react-router-dom';
import {
  Link,
  Breadcrumbs as MuiBreadcrumbs,
  Typography,
  useTheme,
} from '@mui/material';
import type {
  MouseEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

import { BreadcrumbManager } from '../../../classes/managers/BreadcrumbManager';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { useSubscribable } from '../../../hooks/useSubscribable';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { TestIdUtil } from '../../../utils/TestIdUtil';

type BreadcrumbProps = {
  readonly item: UIMatch<unknown, MyNonIndexRouteObject['handle']>;
  readonly isLast: boolean;
};

const Breadcrumb = ({ item, isLast }: BreadcrumbProps): ReactElement => {
  const { t } = useTranslation();
  const breadcrumbsTitles = useSubscribable(BreadcrumbManager.instance);

  const title = useMemo(() => {
    if (breadcrumbsTitles[item.handle.titleKey]) {
      return breadcrumbsTitles[item.handle.titleKey];
    }
    return t(item.handle.titleKey);
  }, [breadcrumbsTitles, item.handle.titleKey, t]);

  const onLinkClick = useCallback(async (event: MouseEvent) => {
    event.preventDefault();
    await RouterManager.instance.router.navigate(item.pathname);
  }, [item.pathname]);

  if (!isLast) {
    return (
      <Link
        color={'inherit'}
        href={item.pathname}
        underline={'hover'}
        onClick={onLinkClick}
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

export const Breadcrumbs = () => {
  const matches = (useMatches() as UIMatch<unknown, MyNonIndexRouteObject['handle']>[])
    // remove hidden routes
    .filter((match) => !match.handle.hidden)
    // remove equal routes (must be in separate filter)
    .filter((match, index, originalMatches) => !originalMatches.slice(index + 1).find(m => m.pathname === `${match.pathname}/`));
  const theme = useTheme();

  return (
    <MuiBreadcrumbs
      aria-label={'breadcrumbs'}
      {...TestIdUtil.createAttributes('Breadcrumbs')}
      sx={{
        height: theme.spacing(3),
      }}
    >
      {matches.map((match, index) => (
        <Breadcrumb
          key={match.id}
          isLast={index === matches.length - 1}
          item={match}
        />
      ))}
    </MuiBreadcrumbs>
  );
};
