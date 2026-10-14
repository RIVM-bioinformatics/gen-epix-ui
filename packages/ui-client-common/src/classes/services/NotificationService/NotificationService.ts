import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';
import { SubscribableAbstract } from '@gen-epix/ui-core/classes/abstracts/SubscribableAbstract';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import {
  inject,
  container as rootContainer,
  singleton,
} from 'tsyringe';

import type { Notification } from '../../../models/notification';
import { CONFIG_TOKEN } from '../../../constants/config';
import type { ConfigBase } from '../../../models/config';

@singleton()
export class NotificationService extends SubscribableAbstract<Notification[]> {
  private readonly config: Pick<ConfigBase, 'notifications'>;
  private readonly notificationTimeouts: Record<string, ReturnType<typeof setTimeout>>;

  public constructor(@inject(CONFIG_TOKEN) config: ConfigBase) {
    super(new Subject<Notification[]>([]));
    this.config = config;
    this.notificationTimeouts = {};
  }

  public static getInstance(): NotificationService {
    return rootContainer.resolve(NotificationService);
  }

  public clearNotification(key: string): void {
    this.subject.next(this.subject.data.filter(x => x.key !== key));
    if (this.notificationTimeouts[key]) {
      clearTimeout(this.notificationTimeouts[key]);
      delete this.notificationTimeouts[key];
    }
  }

  public clearNotifications(): void {
    this.subject.next([]);
    Object.keys(this.notificationTimeouts).forEach(key => {
      clearTimeout(this.notificationTimeouts[key]);
      delete this.notificationTimeouts[key];
    });
  }

  public fulfillNotification(key: string, message: Notification['message'], severity: Notification['severity']): void {
    this.subject.next(this.subject.data.map(x => {
      if (x.key === key) {
        return {
          ...x,
          isLoading: false,
          message,
          severity,
        };
      }
      return x;
    }));
  }

  public hideAllNotifications(): void {
    this.subject.next(this.subject.data.map(x => ({
      ...x,
      visible: false,
    })));
  }

  public hideNotification(key: string): void {
    this.subject.next(this.subject.data.map(x => {
      if (x.key === key) {
        return {
          ...x,
          visible: false,
        };
      }
      return x;
    }));
    clearTimeout(this.notificationTimeouts[key]);
    delete this.notificationTimeouts[key];
  }

  public showNotification(notification: Omit<Notification, 'key' | 'timestamp' | 'visible'>): string {
    const key = StringUtil.createUuid();
    const autoHideAfterMs = notification.autoHideAfterMs ?? this.config.notifications.autoHideAfterMs;

    this.subject.next([
      {
        ...notification,
        autoHideAfterMs,
        key,
        timestamp: new Date().getTime(),
        visible: true,
      },
      ...this.subject.data,
    ]);

    if (isFinite(autoHideAfterMs)) {
      this.notificationTimeouts[key] = setTimeout(() => {
        this.subject.next(this.subject.data.map(x => {
          if (x.key === key) {
            return {
              ...x,
              visible: false,
            };
          }
          return x;
        }));
      }, autoHideAfterMs);
    }
    return key;
  }
}
