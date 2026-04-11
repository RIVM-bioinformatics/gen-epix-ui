import {
  Box,
  Container,
  IconButton,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { ConfigManager } from '../../../classes/managers/ConfigManager';

import { ApplicationFooterLink } from './ApplicationFooterLink';
import { ApplicationFooterLinkSection } from './ApplicationFooterLinkSection';

export type ApplicationFooterProps = {
  readonly fullWidth?: boolean;
};

export const ApplicationFooter = ({ fullWidth }: ApplicationFooterProps) => {
  const theme = useTheme();
  const navId = useId();
  const { t } = useTranslation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMenuOpen]);

  const onMenuButtonClick = useCallback(() => {
    setIsMenuOpen(x => !x);
  }, []);

  const footer = useMemo(() => ConfigManager.instance.config.createFooter(t), [t]);

  return (
    <Box
      component={'footer'}
      sx={{
        background: theme['gen-epix'].footer.background,
        position: 'relative',
        [theme.breakpoints.up('md')]: {
          paddingBottom: theme.spacing(1),
        },
      }}
    >
      <IconButton
        aria-controls={navId}
        aria-label={t`Toggle footer menu`}
        onClick={onMenuButtonClick}
        sx={{
          color: theme.palette.primary.contrastText,
          [theme.breakpoints.up('md')]: {
            display: 'none',
          },
        }}
      >
        <MenuIcon />
      </IconButton>
      <Container
        maxWidth={fullWidth ? false : 'xl'}
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          [theme.breakpoints.down('md')]: {
            background: theme['gen-epix'].footer.background,
            bottom: theme.spacing(5),
            display: isMenuOpen ? 'block' : 'none',
            left: 0,
            position: 'absolute',
            width: '100%',
            zIndex: theme.zIndex.appBar - 1,
          },
          [theme.breakpoints.up('md')]: {
            gridTemplateColumns: `repeat(${footer.sections.length}, 1fr)`,
          },
          [theme.breakpoints.up('sm')]: {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
        }}
      >
        {footer.sections.map((section) => (
          <ApplicationFooterLinkSection
            header={section.header}
            key={section.header}
          >
            {section.items.map((item) => (
              <ApplicationFooterLink
                href={item.href}
                key={item.label}
                onClick={item.onClick}
                sx={{ mb: 0.5 }}
              >
                {item.label}
              </ApplicationFooterLink>
            ))}
          </ApplicationFooterLinkSection>
        ))}
      </Container>
    </Box>
  );
};
