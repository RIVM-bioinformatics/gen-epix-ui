import {
  Box,
  Container,
  Link,
  Typography,
  useTheme,
} from '@mui/material';
import {
  type ReactElement,
  type ReactNode,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';

import { Breadcrumbs } from '../Breadcrumbs';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { PageEventBusManager } from '../../../classes/managers/PageEventBusManager';
import { WindowManager } from '../../../classes/managers/WindowManager';
import { useUpdateDocumentTitle } from '../../../hooks/useUpdateDocumentTitle';
import type { PropsWithTestIdAttributes } from '../../../models/testId';
import { ApplicationFooter } from '../ApplicationFooter/ApplicationFooter';

export type PageContainerProps = PropsWithTestIdAttributes<{
  readonly children: ReactNode;
  readonly contentActions?: ReactElement;
  readonly contentHeader?: ReactElement | string;
  readonly fullHeight?: boolean;
  readonly fullWidth?: boolean;
  readonly ignorePageEvent?: boolean;
  readonly showBreadcrumbs?: boolean;
  readonly singleAction?: boolean;
  readonly title: string;
}>;

export const PageContainer = ({
  children,
  contentActions,
  contentHeader,
  fullHeight,
  fullWidth,
  ignorePageEvent,
  showBreadcrumbs,
  singleAction,
  testIdAttributes,
  title,
}: PageContainerProps): ReactElement => {
  useUpdateDocumentTitle(title);
  const theme = useTheme();
  const { t } = useTranslation();

  const hasContentHeaderArea = contentHeader || contentActions;
  const hasFooterArea = !fullHeight && !singleAction;
  const { ApplicationHeader } = ConfigManager.getInstance().config;

  useEffect(() => {
    const pageName = testIdAttributes['data-testid'];
    if (ignorePageEvent || !pageName) {
      return;
    }

    if (ConfigManager.getInstance().config.enablePageEvents) {
      PageEventBusManager.instance.emit('changePage', {
        location: WindowManager.instance.window.location,
        pageName: testIdAttributes['data-testid'],
      });
    }
  }, [ignorePageEvent, testIdAttributes]);

  return (
    <>
      <Box
        component={'nav'}
        sx={{
          background: theme.palette.background.default,
          marginTop: '-1px',
          position: 'absolute',
          top: 0,
          zIndex: theme.zIndex.appBar + 10,
        }}
      >
        <Link
          component={'a'}
          href={'#main-content'}
          sx={{
            '&:focus, &:active': {
              clip: 'auto',
              height: 'auto',
              overflow: 'visible',
              position: 'static',
              whiteSpace: 'normal',
              width: 'auto',
            },
            border: 0,
            height: '1px',
            left: 0,
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            whiteSpace: 'nowrap',

            width: '1px',
          }}
        >
          {t`Skip to main content`}
        </Link>
      </Box>
      <Box
        data-page-container
        {...testIdAttributes}
        sx={{
          display: 'grid',
          gridTemplateRows: `max-content auto ${hasFooterArea ? 'max-content' : ''}`,
          height: '100%',
        }}
      >
        <ApplicationHeader
          fullHeight={fullHeight}
          fullWidth={fullWidth}
          singleAction={singleAction}
        />
        <Box
          id={ConfigManager.getInstance().config.layout.MAIN_CONTENT_ID}
          sx={{
            display: 'grid',
            gridTemplateRows: `${showBreadcrumbs ? 'max-content' : ''} auto`,
            height: '100%',
          }}
        >
          {showBreadcrumbs && (
            <Container
              maxWidth={fullWidth ? false : 'xl'}
              sx={{
                paddingLeft: `${theme.spacing(fullWidth ? 1 : 2)} !important`,
                paddingRight: `${theme.spacing(fullWidth ? 1 : 2)} !important`,
              }}
            >
              <Breadcrumbs />
            </Container>
          )}
          <Container
            maxWidth={fullWidth ? false : 'xl'}
            sx={{
              display: 'grid',
              gridTemplateRows: `${hasContentHeaderArea ? 'max-content' : ''} auto`,
              height: '100%',
              paddingLeft: `${theme.spacing(fullWidth ? 1 : 2)} !important`,
              paddingRight: `${theme.spacing(fullWidth ? 1 : 2)} !important`,
              position: 'relative',
            }}
          >
            {hasContentHeaderArea && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: theme.spacing(1),
                }}
              >
                {contentHeader && typeof contentHeader === 'string' && (
                  <Box>
                    <Typography variant={'h2'}>
                      {contentHeader}
                    </Typography>
                  </Box>
                )}
                {contentHeader && typeof contentHeader !== 'string' && contentHeader}
                {contentActions && (
                  <Box>
                    {contentActions}
                  </Box>
                )}
              </Box>
            )}
            {singleAction && (
              <Box
                sx={{
                  marginY: 1,
                }}
              >
                <Box
                  component={'a'}
                  href={'#main-content'}
                  id={'main-content'}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                />
                {children}
              </Box>
            )}
            {!singleAction && (
              <>
                <Box
                  component={'a'}
                  href={'#main-content'}
                  id={'main-content'}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                />
                {children}
              </>
            )}
          </Container>
        </Box>
        {hasFooterArea && (
          <ApplicationFooter fullWidth={fullWidth} />
        )}
      </Box>
    </>
  );
};
