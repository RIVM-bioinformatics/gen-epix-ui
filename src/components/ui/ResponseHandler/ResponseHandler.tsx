import type {
  PropsWithChildren,
  ReactNode,
} from 'react';
import type { CircularProgressProps } from '@mui/material';

import { Spinner } from '../Spinner';
import { GenericErrorMessage } from '../GenericErrorMessage';
import type { Loadable } from '../../../models/dataHooks';

export type ResponseHandlerProps = PropsWithChildren<{
  readonly isPending?: boolean;
  readonly error?: unknown;
  readonly enabled?: boolean;
  readonly loadingMessage?: string;
  readonly loadables?: Loadable[];
  readonly shouldHideActionButtons?: boolean;
  readonly inlineSpinner?: boolean;
  readonly spinnerSize?: CircularProgressProps['size'];
  readonly loadingContent?: ReactNode;
}>;

export const ResponseHandler = ({
  children,
  isPending: userIsPending,
  error: userError,
  enabled,
  loadingMessage,
  loadables,
  shouldHideActionButtons,
  inlineSpinner,
  spinnerSize,
  loadingContent,
}: ResponseHandlerProps): ReactNode => {
  if (enabled === false) {
    return children;
  }

  const error = userError || (loadables?.find((loadable) => loadable.error))?.error;
  const isPending = userIsPending || (loadables?.some((loadable) => loadable.isLoading));

  return (
    <>
      {error && (
        <GenericErrorMessage
          error={error}
          shouldHideActionButtons={shouldHideActionButtons}
        />
      )}
      {isPending && !error && (
        <>
          {!!loadingContent && loadingContent}
          {!loadingContent && (
            <Spinner
              inline={inlineSpinner}
              label={loadingMessage}
              size={spinnerSize}
            />
          )}
        </>

      )}
      {!isPending && !error && children}
    </>
  );
};
