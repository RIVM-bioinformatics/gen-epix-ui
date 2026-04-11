import type { UIMatch } from 'react-router-dom';
import { useMatches } from 'react-router-dom';
import {
  Breadcrumbs as MuiBreadcrumbs,
  useTheme,
} from '@mui/material';

import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { TestIdUtil } from '../../../utils/TestIdUtil';

import { Breadcrumb } from './Breadcrumb';

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
          isLast={index === matches.length - 1}
          item={match}
          key={match.id}
        />
      ))}
    </MuiBreadcrumbs>
  );
};
