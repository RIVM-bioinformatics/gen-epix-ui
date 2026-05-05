import { useTranslation } from 'react-i18next';
import {
  Outlet,
  useLocation,
} from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';

import { AuthorizationManager } from '../../classes/managers/AuthorizationManager';
import { RouterManager } from '../../classes/managers/RouterManager';
import { PageContainer } from '../../components/ui/PageContainer';
import { ADMIN_PAGE_CATEGORY } from '../../models/admin';
import type { MyNonIndexRouteObject } from '../../models/reactRouter';
import { TestIdUtil } from '../../utils/TestIdUtil';


export type AdminPageProps = {
  readonly routes: MyNonIndexRouteObject[];
};

type Category = {
  items: MyNonIndexRouteObject[];
  label: string;
  name: string;
};

export const AdminPage = ({ routes }: AdminPageProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();

  const menuItems = useMemo(() => {
    const items = routes
      .map(r => r.children?.length ? r.children.find(child => child.index) as MyNonIndexRouteObject : r)
      .filter(r => {
        const hasPermission = AuthorizationManager.getInstance().doesUserHavePermission(r.handle.requiredPermissions);
        return !r.handle?.hidden && hasPermission;
      });
    return items;
  }, [routes]);

  const categoryToLabelMap = useMemo<Record<ADMIN_PAGE_CATEGORY, string>>(() => {
    return {
      [ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS]: t`Access rights`,
      [ADMIN_PAGE_CATEGORY.HELPERS]: t`Helpers`,
      [ADMIN_PAGE_CATEGORY.REFERENCE_DATA]: t`Reference data`,
      [ADMIN_PAGE_CATEGORY.SYSTEM]: t`System`,
      [ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS]: t`Users and organizations`,
    };
  }, [t]);


  const categories = useMemo<Category[]>(() => {
    return [
      ADMIN_PAGE_CATEGORY.USERS_AND_ORGANIZATIONS,
      ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS,
      ADMIN_PAGE_CATEGORY.SYSTEM,
      ADMIN_PAGE_CATEGORY.REFERENCE_DATA,
      ADMIN_PAGE_CATEGORY.HELPERS,
    ].map(category => {
      return {
        items: menuItems.filter(r => r.handle.category as ADMIN_PAGE_CATEGORY === category),
        label: categoryToLabelMap[category],
        name: category,
      };
    }).filter(c => c.items.length);
  }, [categoryToLabelMap, menuItems]);

  const onCardClick = useCallback(async (path: string) => {
    await RouterManager.getInstance().router.navigate(path);
  }, []);

  if (location?.pathname !== '/management') {
    return (
      <Outlet />
    );
  }

  return (
    <PageContainer
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('AdminPage')}
      title={t`Management`}
    >
      <Box>
        {categories.map(category => (
          <Box
            key={category.name}
            sx={{
              marginBottom: 3,
              marginTop: 1,
            }}
          >
            <Typography
              component={'h2'}
              sx={{
                marginBottom: 1,
              }}
              variant={'h3'}
            >
              {category.label}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: theme.spacing(1),
                gridTemplateColumns: 'repeat(1, 1fr)',
                [theme.breakpoints.up('lg')]: {
                  gridTemplateColumns: 'repeat(3, 1fr)',
                },
                [theme.breakpoints.up('md')]: {
                  gridTemplateColumns: 'repeat(2, 1fr)',
                },
                [theme.breakpoints.up('xl')]: {
                  gridTemplateColumns: 'repeat(4, 1fr)',
                },
              }}
            >
              {category.items.map(item => (
                <Card
                  key={item.path}
                  square
                  sx={{
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <CardActionArea
                    // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                    onClick={async () => onCardClick(item.path)}
                  >
                    <CardHeader title={item.handle.title} />
                    <CardContent>
                      {item.handle.subTitle}
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
            <Divider
              sx={{
                marginBottom: 2,
                marginTop: 2,
              }}
            />
          </Box>
        ))}
      </Box>
    </PageContainer>
  );
};
