import { t } from 'i18next';
import {
  createElement,
  Fragment,
} from 'react';
import type { ReactElement } from 'react';

import { AxiosUtil } from '../AxiosUtil';

export class NotificationUtil {
  public static wrapErrorNotificationMessage(message: ReactElement | string, error: unknown): ReactElement | string {
    const appendTranslatedError = (translationKey: string) => {
      if (typeof message === 'string') {
        message = t(translationKey, { message });
      } else {
        const translatedSuffix = t(translationKey, { message: '' });
        message = createElement(Fragment, null, message, translatedSuffix);
      }
    };

    if (AxiosUtil.isAxiosForbiddenError(error)) {
      appendTranslatedError('{{message}} - You do not have permission to perform this action.');
    }
    if (AxiosUtil.isAxiosUnauthorizedError(error)) {
      appendTranslatedError('{{message}} - You are not logged in.');
    }
    if (AxiosUtil.isAxiosNotFoundError(error)) {
      appendTranslatedError('{{message}} - The item does not exist.');
    }
    if (AxiosUtil.isAxiosBadRequestError(error)) {
      appendTranslatedError('{{message}} - Bad request. The input data was not correct.');
    }
    if (AxiosUtil.isAxiosConflictError(error)) {
      appendTranslatedError('{{message}} - Conflict. The request could not be completed due to a conflict with the current state of the resource.');
    }
    if (AxiosUtil.isAxiosInternalServerError(error)) {
      appendTranslatedError('{{message}} - Internal Server Error. Please try again later.');
    }
    return message;
  }
}
