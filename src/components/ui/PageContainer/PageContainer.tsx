import {
  Box,
  Container,
  Link,
  Typography,
  useTheme,
} from '@mui/material';
import {
  type ReactNode,
  type ReactElement,
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
  readonly title: string;
  readonly showBreadcrumbs?: boolean;
  readonly fullWidth?: boolean;
  readonly fullHeight?: boolean;
  readonly singleAction?: boolean;
  readonly contentHeader?: string | ReactElement;
  readonly contentActions?: ReactElement;
  readonly ignorePageEvent?: boolean;
}>;

export const PageContainer = ({
  children,
  title,
  testIdAttributes,
  showBreadcrumbs,
  fullWidth,
  fullHeight,
  singleAction,
  contentHeader,
  contentActions,
  ignorePageEvent,
}: PageContainerProps): ReactElement => {
  useUpdateDocumentTitle(title);
  const theme = useTheme();
  const { t } = useTranslation();

  const hasContentHeaderArea = contentHeader || contentActions;
  const hasFooterArea = !fullHeight && !singleAction;
  const { ApplicationHeader } = ConfigManager.instance.config;

  useEffect(() => {
    const pageName = testIdAttributes['data-testid'];
    if (ignorePageEvent || !pageName) {
      return;
    }

    if (ConfigManager.instance.config.enablePageEvents) {
      PageEventBusManager.instance.emit('changePage', {
        pageName: testIdAttributes['data-testid'],
        location: WindowManager.instance.window.location,
      });
    }
  }, [ignorePageEvent, testIdAttributes]);

  return (
    <>
      <Box
        component={'nav'}
        sx={{
          marginTop: '-1px',
          position: 'absolute',
          background: theme.palette.background.default,
          top: 0,
          zIndex: theme.zIndex.appBar + 10,
        }}
      >
        <Link
          component={'a'}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            border: 0,

            '&:focus, &:active': {
              position: 'static',
              width: 'auto',
              height: 'auto',
              overflow: 'visible',
              clip: 'auto',
              whiteSpace: 'normal',
            },
          }}
          href={'#main-content'}
        >
          {t`Skip to main content`}
        </Link>
      </Box>
      <Box
        data-page-container
        {...testIdAttributes}
        sx={{
          height: '100%',
          display: 'grid',
          gridTemplateRows: `max-content auto ${hasFooterArea ? 'max-content' : ''}`,
        }}
      >
        <ApplicationHeader
          fullHeight={fullHeight}
          fullWidth={fullWidth}
          singleAction={singleAction}
        />
        <Box
          id={ConfigManager.instance.config.layout.MAIN_CONTENT_ID}
          sx={{
            height: '100%',
            display: 'grid',
            gridTemplateRows: `${showBreadcrumbs ? 'max-content' : ''} auto`,
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
              position: 'relative',
              paddingLeft: `${theme.spacing(fullWidth ? 1 : 2)} !important`,
              paddingRight: `${theme.spacing(fullWidth ? 1 : 2)} !important`,
              height: '100%',
              display: 'grid',
              gridTemplateRows: `${hasContentHeaderArea ? 'max-content' : ''} auto`,
            }}
          >
            {hasContentHeaderArea && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: 'row',
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
              <Box marginY={1}>
                <Box
                  component={'a'}
                  tabIndex={-1}
                  id={'main-content'}
                  href={'#main-content'}
                  style={{ display: 'none' }}
                />
                {children}
              </Box>
            )}
            {!singleAction && (
              <>
                <Box
                  component={'a'}
                  tabIndex={-1}
                  id={'main-content'}
                  href={'#main-content'}
                  style={{ display: 'none' }}
                />
                {children}
              </>
            )}
          </Container>
        </Box>
        {hasFooterArea && (
          <ApplicationFooter />
        )}
      </Box>
    </>
  );
};
