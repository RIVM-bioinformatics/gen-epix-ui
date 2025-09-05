import { IconButton } from '@mui/material';
import { Fragment } from 'react/jsx-runtime';
import CodeIcon from '@mui/icons-material/Code';
import {
  useCallback,
  useState,
} from 'react';
import type { MouseEvent } from 'react';

import { InfoMenu } from './InfoMenu';

export const ApplicationBarActionsInfoItem = () => {
  const [infoMenuAnchorElement, setInfoMenuAnchorElement] = useState<null | HTMLElement>(null);

  const onInfoMenuIconClick = useCallback((event: MouseEvent<HTMLElement>): void => {
    setInfoMenuAnchorElement(event.currentTarget);
  }, []);

  const onInfoMenuClose = useCallback(() => {
    setInfoMenuAnchorElement(null);
  }, []);

  return (
    <Fragment>
      <IconButton
        color={'inherit'}
        title={'Code information'}
        onClick={onInfoMenuIconClick}
      >
        <CodeIcon color={'inherit'} />
      </IconButton>
      {infoMenuAnchorElement && (
        <InfoMenu
          anchorElement={infoMenuAnchorElement}
          onClose={onInfoMenuClose}
        />
      )}

    </Fragment>
  );
};
