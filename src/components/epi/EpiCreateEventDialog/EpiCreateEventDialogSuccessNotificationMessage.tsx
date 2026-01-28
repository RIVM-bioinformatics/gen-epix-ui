import { t } from 'i18next';
import { Box } from '@mui/material';

import type { CaseSet } from '../../../api';
import { CaseSetUtil } from '../../../utils/CaseSetUtil';
import { NavLink } from '../../ui/NavLink';

export type EpiCreateEventDialogSuccessNotificationMessageProps = {
  readonly caseSet: CaseSet;
  readonly isCreating?: boolean;
};

export const EpiCreateEventDialogSuccessNotificationMessage = ({ caseSet, isCreating }: EpiCreateEventDialogSuccessNotificationMessageProps) => {
  return (
    <Box>
      <Box>
        {isCreating && t('Successfully created event: {{name}}', { name: caseSet.name })}
        {!isCreating && t('Successfully edited event: {{name}}', { name: caseSet.name })}
      </Box>
      <Box marginY={2}>
        <NavLink
          activeAsText
          to={CaseSetUtil.createCaseSetLink(caseSet)}
        >
          {t('View event: {{name}}', { name: caseSet.name })}
        </NavLink>
      </Box>
    </Box>
  );
};
