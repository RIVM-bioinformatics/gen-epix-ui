import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createElement } from 'react';

import { NotificationUtil } from './NotificationUtil';

const i18nMocks = vi.hoisted(() => ({
  t: vi.fn((translationKey: string, options?: { message?: string }) => {
    return translationKey.replace('{{message}}', options?.message ?? '');
  }),
}));

vi.mock('i18next', () => ({
  t: i18nMocks.t,
}));

const STATUS_DESCRIPTIONS = [
  [403, 'You do not have permission to perform this action.'],
  [401, 'You are not logged in.'],
  [404, 'The item does not exist.'],
  [400, 'Bad request. The input data was not correct.'],
  [409, 'Conflict. The request could not be completed due to a conflict with the current state of the resource.'],
  [500, 'Internal Server Error. Please try again later.'],
] as const;

const createAxiosError = (status: number) => ({
  isAxiosError: true,
  response: { status },
});

afterEach(() => {
  i18nMocks.t.mockClear();
});

describe('NotificationUtil.wrapErrorNotificationMessage', () => {
  it.each(STATUS_DESCRIPTIONS)('appends the description for HTTP status %s', (status, description) => {
    const message = 'Unable to save';

    const result = NotificationUtil.wrapErrorNotificationMessage(message, createAxiosError(status));

    expect(result).toBe(`${message} - ${description}`);
    expect(i18nMocks.t).toHaveBeenCalledExactlyOnceWith(`{{message}} - ${description}`, { message });
  });

  it.each([
    { description: 'an unmapped Axios status', error: createAxiosError(418) },
    { description: 'a non-Axios object', error: { status: 418 } },
    { description: 'null', error: null },
    { description: 'undefined', error: undefined },
  ])('returns the original string for $description', ({ error }) => {
    const message = 'Unable to save';

    const result = NotificationUtil.wrapErrorNotificationMessage(message, error);

    expect(result).toBe(message);
    expect(i18nMocks.t).not.toHaveBeenCalled();
  });

  it('passes a React message to the translator and returns its translated result', () => {
    const message = createElement('strong', null, 'Unable to save');
    i18nMocks.t.mockReturnValueOnce('translated notification');

    const result = NotificationUtil.wrapErrorNotificationMessage(message, createAxiosError(401));

    expect(result).toBe('translated notification');
    expect(i18nMocks.t).toHaveBeenCalledExactlyOnceWith(
      '{{message}} - You are not logged in.',
      { message },
    );
  });

  it('propagates translation failures', () => {
    const translationError = new Error('Translation failed');
    i18nMocks.t.mockImplementationOnce(() => {
      throw translationError;
    });

    expect(() => NotificationUtil.wrapErrorNotificationMessage('Unable to save', createAxiosError(401)))
      .toThrow(translationError);
  });

  it('returns the original React message when the error has no mapped status', () => {
    const message = createElement('strong', null, 'Unable to save');

    const result = NotificationUtil.wrapErrorNotificationMessage(message, { status: 418 });

    expect(result).toBe(message);
    expect(i18nMocks.t).not.toHaveBeenCalled();
  });

  it('supports an empty string message', () => {
    const result = NotificationUtil.wrapErrorNotificationMessage('', createAxiosError(404));

    expect(result).toBe(' - The item does not exist.');
  });
});
