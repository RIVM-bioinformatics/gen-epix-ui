import { StringUtil } from '../../../utils/StringUtil';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { HmrUtil } from '../../../utils/HmrUtil';
import { ConfigManager } from '../ConfigManager';
import type { Notification } from '../../../models/notification';

export class NotificationManager extends SubscribableAbstract<Notification[]> {
  public static get instance(): NotificationManager {
    NotificationManager.__instance = HmrUtil.getHmrSingleton('notificationManager', NotificationManager.__instance, () => new NotificationManager());
    return NotificationManager.__instance;
  }

  private static __instance: NotificationManager;

  private readonly notificationTimeouts: Record<string, ReturnType<typeof setTimeout>>;

  private constructor() {
    super(new Subject<Notification[]>([]));
    this.notificationTimeouts = {};
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
    const autoHideAfterMs = notification.autoHideAfterMs ?? ConfigManager.getInstance().config.notifications.autoHideAfterMs;

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
