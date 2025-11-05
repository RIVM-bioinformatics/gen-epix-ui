import debounce from 'lodash/debounce';

import { LogLevel } from '../../../api';
import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { AuthenticationManager } from '../AuthenticationManager';
import { ConfigManager } from '../ConfigManager';
import { LogManager } from '../LogManager';
import { TimeUtil } from '../../../utils/TimeUtil';

export type InactivityState = {
  isIdle: boolean;
  idleDiff: number;
  notificationDiff: number;
  readableIdleDiff: string;
  readableNotificationDiff: string;
};

export class InactivityManager extends SubscribableAbstract<InactivityState> {
  private static __instance: InactivityManager;
  private idleSince: number = Date.now();
  private idleDiff: number = 0;
  private notificationDiff: number = 0;
  private isIdle: boolean = false;
  private readonly onActivityDebounced: () => void;

  private constructor() {
    super(new Subject<InactivityState>({
      isIdle: false,
      idleDiff: 0,
      notificationDiff: 0,
      readableIdleDiff: '',
      readableNotificationDiff: '',
    }));

    const ALLOWED_IDLE_TIME_MS = ConfigManager.instance.config.userInactivityConfirmation.ALLOWED_IDLE_TIME_MS;
    const NOTIFICATION_TIME_MS = ConfigManager.instance.config.userInactivityConfirmation.NOTIFICATION_TIME_MS;

    this.onActivityDebounced = debounce(this.onActivity.bind(this), 1000, {
      leading: true,
      trailing: true,
    });

    ['mousemove', 'keydown', 'scroll'].forEach((event) => window.addEventListener(event, this.onActivityDebounced));

    setInterval(() => {
      if (this.idleSince > 0 && (Date.now() - ALLOWED_IDLE_TIME_MS) > this.idleSince) {
        this.idleDiff = Date.now() - this.idleSince;
        this.isIdle = true;

        const notificationEndTime = this.idleSince + ALLOWED_IDLE_TIME_MS + NOTIFICATION_TIME_MS;
        this.notificationDiff = notificationEndTime - Date.now();

        if (this.notificationDiff < 0) {
          this.logout();
        }

        if (this.isIdle) {
          this.next({
            isIdle: this.isIdle,
            idleDiff: this.idleDiff,
            notificationDiff: this.notificationDiff,
            readableIdleDiff: TimeUtil.getReadableTimeRemaining(this.idleDiff),
            readableNotificationDiff: TimeUtil.getReadableTimeRemaining(this.notificationDiff),
          });
        }
      }
    }, 500);
  }

  private onActivity(): void {
    if (this.isIdle) {
      return;
    }
    this.idleSince = Date.now();
  }

  public static get instance(): InactivityManager {
    if (!this.__instance) {
      this.__instance = new InactivityManager();
    }
    return this.__instance;
  }

  public reset(): void {
    this.idleSince = Date.now();
    this.isIdle = false;
    this.idleDiff = 0;
    this.notificationDiff = 0;
  }

  public logout(): void {
    LogManager.instance.log([{
      topic: 'USER_LOGOUT_BY_INACTIVITY',
      level: LogLevel.TRACE,
      detail: AuthenticationManager.instance.authContextProps.user,
    }]);
    LogManager.instance.flushLog();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    AuthenticationManager.instance.authContextProps.signoutRedirect();
  }

}
