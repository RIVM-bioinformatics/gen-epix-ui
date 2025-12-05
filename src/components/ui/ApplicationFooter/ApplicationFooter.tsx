import {
  useTheme,
  Box,
  Container,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import {
  useCallback,
  useState,
  useId,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';

import { ApplicationFooterLink } from '../ApplicationFooterLink';
import { ApplicationFooterLinkSection } from '../ApplicationFooterLinkSection';
import { ConfigManager } from '../../../classes/managers/ConfigManager';

export type ApplicationFooterProps = {
  readonly fullWidth?: boolean;
};

export const ApplicationFooter = ({ fullWidth }: ApplicationFooterProps) => {
  const theme = useTheme();
  const navId = useId();
  const [t] = useTranslation();

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

  return (
    <Box
      component={'footer'}
      sx={{
        background: theme.palette.secondary.main,
        [theme.breakpoints.up('md')]: {
          paddingBottom: theme.spacing(1),
        },
        position: 'relative',
      }}
    >
      <IconButton
        aria-label={t`Toggle footer menu`}
        aria-controls={navId}
        sx={{
          color: theme.palette.primary.contrastText,
          [theme.breakpoints.up('md')]: {
            display: 'none',
          },
        }}
        onClick={onMenuButtonClick}
      >
        <MenuIcon />
      </IconButton>
      <Container
        maxWidth={fullWidth ? false : 'xl'}
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          [theme.breakpoints.up('sm')]: {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
          [theme.breakpoints.up('md')]: {
            gridTemplateColumns: 'repeat(4, 1fr)',
          },
          paddingLeft: '0 !important',
          paddingRight: '0 !important',
          [theme.breakpoints.down('md')]: {
            display: isMenuOpen ? 'block' : 'none',
            position: 'absolute',
            background: theme.palette.secondary.main,
            bottom: theme.spacing(5),
            left: 0,
            width: '100%',
          },
        }}
      >
        {ConfigManager.instance.config.footer.sections.map((section) => (
          <ApplicationFooterLinkSection
            key={section.header}
            header={section.header}
          >
            {section.items.map((item) => (
              <ApplicationFooterLink
                key={item.label}
                href={item.href}
                marginBottom={0.5}
                onClick={item.onClick}
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
