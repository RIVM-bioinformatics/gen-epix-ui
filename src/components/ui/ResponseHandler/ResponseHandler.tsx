import type {
  PropsWithChildren,
  ReactNode,
} from 'react';
import type { CircularProgressProps } from '@mui/material';

import { Spinner } from '../Spinner';
import { GenericErrorMessage } from '../GenericErrorMessage';
import type { Loadable } from '../../../models/dataHooks';

export type ResponseHandlerProps = PropsWithChildren<{
  readonly isLoading?: boolean;
  readonly error?: unknown;
  readonly enabled?: boolean;
  readonly loadingMessage?: string;
  readonly loadables?: Loadable[];
  readonly shouldHideActionButtons?: boolean;
  readonly inlineSpinner?: boolean;
  readonly spinnerSize?: CircularProgressProps['size'];
  readonly loadingContent?: ReactNode;
  readonly takingLongerTimeoutMs?: number;
}>;

export const ResponseHandler = ({
  children,
  isLoading: userIsLoading,
  error: userError,
  enabled,
  loadingMessage,
  loadables,
  shouldHideActionButtons,
  inlineSpinner,
  spinnerSize,
  loadingContent,
  takingLongerTimeoutMs,
}: ResponseHandlerProps): ReactNode => {
  if (enabled === false) {
    return children;
  }

  const error = userError || (loadables?.find((loadable) => loadable.error))?.error;
  const isLoading = userIsLoading || (loadables?.some((loadable) => loadable.isLoading));

  return (
    <>
      {error && (
        <GenericErrorMessage
          error={error}
          shouldHideActionButtons={shouldHideActionButtons}
        />
      )}
      {isLoading && !error && (
        <>
          {!!loadingContent && loadingContent}
          {!loadingContent && (
            <Spinner
              inline={inlineSpinner}
              label={loadingMessage}
              size={spinnerSize}
              takingLongerTimeoutMs={takingLongerTimeoutMs}
            />
          )}
        </>

      )}
      {!isLoading && !error && children}
    </>
  );
};
