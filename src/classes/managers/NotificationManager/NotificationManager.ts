import { StringUtil } from '../../../utils/StringUtil';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { ConfigManager } from '../ConfigManager';
import type { Notification } from '../../../models/notification';

export class NotificationManager extends SubscribableAbstract<Notification[]> {
  private readonly notificationTimeouts: Record<string, ReturnType<typeof setTimeout>>;

  private static __instance: NotificationManager;

  public static get instance(): NotificationManager {
    NotificationManager.__instance = NotificationManager.__instance || new NotificationManager();
    return NotificationManager.__instance;
  }

  private constructor() {
    super(new Subject<Notification[]>([]));
    this.notificationTimeouts = {};
  }

  public hideAllNotifications(): void {
    this.subject.next(this.subject.data.map(x => ({
      ...x,
      visible: false,
    })));
  }

  public clearNotifications(): void {
    this.subject.next([]);
    Object.keys(this.notificationTimeouts).forEach(key => {
      clearTimeout(this.notificationTimeouts[key]);
      delete this.notificationTimeouts[key];
    });
  }

  public clearNotification(key: string): void {
    this.subject.next(this.subject.data.filter(x => x.key !== key));
    if (this.notificationTimeouts[key]) {
      clearTimeout(this.notificationTimeouts[key]);
      delete this.notificationTimeouts[key];
    }
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

  public fulfillNotification(key: string, message: Notification['message'], severity: Notification['severity']): void {
    this.subject.next(this.subject.data.map(x => {
      if (x.key === key) {
        return {
          ...x,
          message,
          severity,
          isLoading: false,
        };
      }
      return x;
    }));
  }

  public showNotification(notification: Omit<Notification, 'key' | 'visible' | 'timestamp'>): string {
    const key = StringUtil.createUuid();
    const autoHideAfterMs = notification.autoHideAfterMs ?? ConfigManager.instance.config.notifications.autoHideAfterMs;

    this.subject.next([
      {
        ...notification,
        key,
        autoHideAfterMs,
        visible: true,
        timestamp: new Date().getTime(),
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
