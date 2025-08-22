import { t } from 'i18next';
import type { ReactElement } from 'react';

import { AxiosUtil } from '../AxiosUtil';

export class NotificationUtil {
  public static wrapErrorNotificationMessage(message: string | ReactElement, error: unknown): string | ReactElement {
    if (AxiosUtil.isAxiosForbiddenError(error)) {
      message = t('{{message}} - You do not have permission to perform this action.', { message });
    }
    if (AxiosUtil.isAxiosUnauthorizedError(error)) {
      message = t('{{message}} - You are not logged in.', { message });
    }
    if (AxiosUtil.isAxiosNotFoundError(error)) {
      message = t('{{message}} - The item you are trying to edit does not exist.', { message });
    }
    if (AxiosUtil.isAxiosBadRequestError(error)) {
      message = t('{{message}} - Bad request. The input data was not correct.', { message });
    }
    if (AxiosUtil.isAxiosConflictError(error)) {
      message = t('{{message}} - Conflict. The request could not be completed due to a conflict with the current state of the resource.', { message });
    }
    if (AxiosUtil.isAxiosInternalServerError(error)) {
      message = t('{{message}} - Internal Server Error. Please try again later.', { message });
    }
    return message;
  }
}
