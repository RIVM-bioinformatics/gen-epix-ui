import { withDialog } from '../../../hoc/withDialog';

import type { ConfirmationProps } from './ConfirmationRender';
import { ConfirmationRender } from './ConfirmationRender';

export const Confirmation = withDialog<ConfirmationProps, unknown>(ConfirmationRender, {
  fullWidth: true,
  maxWidth: 'sm',
  testId: 'Confirmation',
});
