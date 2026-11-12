import { keyframes } from '@emotion/react';
import {
  Box,
  Switch,
  Typography,
  useTheme,
} from '@mui/material';
import { container } from 'tsyringe';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { EventBusService } from '../../../classes/services/EventBusService';

const switchStamp = keyframes`
  0% {
    filter: blur(4px);
    opacity: 0;
    transform: translate3d(0, 0, -6rem) scale(10);
  }

  62% {
    filter: blur(0);
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(0.96);
  }

  82% {
    transform: scale(1.04);
  }

  100% {
    filter: blur(0);
    opacity: 1;
    transform: none;
  }
`;

export type TreeLineListLinkToggleProps = {
  readonly isLinked: boolean;
};

export const TreeLineListLinkToggle = ({ isLinked }: TreeLineListLinkToggleProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [animationKey, setAnimationKey] = useState(0);
  const previousIsLinkedRef = useRef(isLinked);
  const userInitiatedUnlinkRef = useRef(false);
  const onUserInitiatedUnlink = useCallback((payload: { readonly userInitiated: boolean } | undefined) => {
    userInitiatedUnlinkRef.current = payload?.userInitiated ?? false;
  }, []);

  useEffect(() => {
    const eventBusService = container.resolve(EventBusService);
    // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
    const removeUnlinkEventListener = eventBusService.addEventListener('onUnlinkLineListAndTree', onUserInitiatedUnlink);
    return () => {
      removeUnlinkEventListener();
    };
  }, [onUserInitiatedUnlink]);

  useEffect(() => {
    if (previousIsLinkedRef.current !== isLinked) {
      const shouldAnimate = previousIsLinkedRef.current && !isLinked && !userInitiatedUnlinkRef.current;
      previousIsLinkedRef.current = isLinked;
      userInitiatedUnlinkRef.current = false;
      if (shouldAnimate && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        setAnimationKey((currentAnimationKey) => currentAnimationKey + 1);
      }
    }
  }, [isLinked]);

  return (
    <Box
      aria-hidden
      component={'span'}
      sx={{
        alignItems: 'center',
        display: 'inline-flex',
        gap: 0.25,
        perspective: '600px',
      }}
    >
      <Box
        key={animationKey}
        sx={{
          animation: animationKey > 0
            ? `${switchStamp} 650ms cubic-bezier(0.22, 1.4, 0.36, 1) both`
            : 'none',
          transformStyle: 'preserve-3d',
        }}
      >
        <Switch
          checked={isLinked}
          size={'small'}
          slotProps={{
            input: {
              'aria-hidden': true,
              tabIndex: -1,
            },
          }}
          sx={{
            '& .MuiSwitch-switchBase:not(.Mui-checked)': {
              color: theme.palette.error.main,
            },
            '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
              backgroundColor: theme.palette.error.main,
              opacity: 0.5,
            },
            pointerEvents: 'none',
          }}
        />
      </Box>
      <Typography
        component={'span'}
        sx={{
          color: isLinked ? theme.palette.primary.main : theme.palette.error.main,
          fontSize: '0.6875rem',
          fontWeight: 700,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        {isLinked ? t`Linked` : t`Unlinked`}
      </Typography>
    </Box>
  );
};
