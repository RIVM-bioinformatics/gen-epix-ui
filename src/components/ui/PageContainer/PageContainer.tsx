import {
  Box,
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import {
  type ReactNode,
  type ReactElement,
  useEffect,
} from 'react';

import { Breadcrumbs } from '../Breadcrumbs';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { PageEventBusManager } from '../../../classes/managers/PageEventBusManager';
import { WindowManager } from '../../../classes/managers/WindowManager';
import { useUpdateDocumentTitle } from '../../../hooks/useUpdateDocumentTitle';
import type { PropsWithTestIdAttributes } from '../../../models/testId';

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

  const hasContentHeaderArea = contentHeader || contentActions;
  const hasFooterArea = !fullHeight && !singleAction;
  const { ApplicationHeader, ApplicationFooter } = ConfigManager.instance.config;

  useEffect(() => {
    const pageName = testIdAttributes['data-testid'];
    if (ignorePageEvent || !pageName) {
      return;
    }

    if (ConfigManager.instance.config.enablePageVents) {
      PageEventBusManager.instance.emit('changePage', {
        pageName: testIdAttributes['data-testid'],
        location: WindowManager.instance.window.location,
      });
    }
  }, [ignorePageEvent, testIdAttributes]);

  return (
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
          component={'article'}
          maxWidth={fullWidth ? false : 'xl'}
          sx={{
            position: 'relative',
            minWidth: theme.breakpoints.values.lg,
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
              {children}
            </Box>
          )}
          {!singleAction && children}
        </Container>
      </Box>

      {hasFooterArea && (
        <Box
          component={'footer'}
          sx={{
            background: theme.palette.secondary.main,
            paddingBottom: theme.spacing(1),
          }}
        >
          <Container
            maxWidth={fullWidth ? false : 'xl'}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              paddingLeft: '0 !important',
              paddingRight: '0 !important',
            }}
          >

            <ApplicationFooter />
          </Container>
        </Box>
      )}
    </Box>
  );
};
