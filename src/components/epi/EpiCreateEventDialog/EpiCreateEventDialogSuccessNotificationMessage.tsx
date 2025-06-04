import { t } from 'i18next';
import { Box } from '@mui/material';

import type { CaseSet } from '../../../api';
import { EpiCaseSetUtil } from '../../../utils/EpiCaseSetUtil';
import { LspNavLink } from '../../ui/LspNavLink';

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
        <LspNavLink
          activeAsText
          to={EpiCaseSetUtil.createCaseSetLink(caseSet)}
        >
          {t('View event: {{name}}', { name: caseSet.name })}
        </LspNavLink>
      </Box>
    </Box>
  );
};
