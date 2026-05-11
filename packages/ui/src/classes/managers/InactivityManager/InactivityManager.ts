import throttle from 'lodash/throttle';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';

import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { HmrUtil } from '../../../utils/HmrUtil';
import { AuthenticationManager } from '../AuthenticationManager';
import { ConfigManager } from '../ConfigManager';
import { LogManager } from '../LogManager';
import { TimeUtil } from '../../../utils/TimeUtil';

export type InactivityState = {
  idleDiff: number;
  isIdle: boolean;
  notificationDiff: number;
  readableIdleDiff: string;
  readableNotificationDiff: string;
};

export class InactivityManager extends SubscribableAbstract<InactivityState> {
  private static __instance: InactivityManager;

  private idleDiff: number = 0;

  private idleSince: number = Date.now();
  private isIdle: boolean = false;
  private isPaused: boolean = false;
  private notificationDiff: number = 0;
  private readonly onActivityDebounced: () => void;

  private constructor() {
    super(new Subject<InactivityState>({
      idleDiff: 0,
      isIdle: false,
      notificationDiff: 0,
      readableIdleDiff: '',
      readableNotificationDiff: '',
    }));

    const ALLOWED_IDLE_TIME_MS = ConfigManager.getInstance().config.userInactivityConfirmation.ALLOWED_IDLE_TIME_MS;
    const NOTIFICATION_TIME_MS = ConfigManager.getInstance().config.userInactivityConfirmation.NOTIFICATION_TIME_MS;

    this.onActivityDebounced = throttle(this.onActivity.bind(this), 1000, {
      leading: true,
      trailing: true,
    });

    ['mousemove', 'keydown', 'scroll'].forEach((event) => window.addEventListener(event, this.onActivityDebounced));

    setInterval(() => {
      if (this.idleSince > 0 && (Date.now() - ALLOWED_IDLE_TIME_MS) > this.idleSince && !this.isPaused) {
        this.idleDiff = Date.now() - this.idleSince;
        this.isIdle = true;

        const notificationEndTime = this.idleSince + ALLOWED_IDLE_TIME_MS + NOTIFICATION_TIME_MS;
        this.notificationDiff = notificationEndTime - Date.now();

        if (this.notificationDiff < 0) {
          this.logout();
        }

        if (this.isIdle) {
          this.doNext();
        }
      }
    }, 500);
  }

  public static getInstance(): InactivityManager {
    InactivityManager.__instance = HmrUtil.getHmrSingleton('inactivityManager', InactivityManager.__instance, () => new InactivityManager());
    return InactivityManager.__instance;
  }

  public logout(): void {
    LogManager.getInstance().log([{
      detail: AuthenticationManager.getInstance().authContextProps.user,
      level: CommonDbLogLevel.TRACE,
      topic: 'USER_LOGOUT_BY_INACTIVITY',
    }]);
    LogManager.getInstance().flushLog();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    AuthenticationManager.getInstance().authContextProps.signoutRedirect();
  }

  public pause(): void {
    this.isPaused = true;
    this.reset();
  }

  public reset(): void {
    this.idleSince = Date.now();
    this.isIdle = false;
    this.idleDiff = 0;
    this.notificationDiff = 0;
    this.doNext();
  }

  public resume(): void {
    this.isPaused = false;
    this.reset();
  }

  private doNext(): void {
    this.next({
      idleDiff: this.idleDiff,
      isIdle: this.isIdle,
      notificationDiff: this.notificationDiff,
      readableIdleDiff: TimeUtil.getReadableTimeRemaining(this.idleDiff),
      readableNotificationDiff: TimeUtil.getReadableTimeRemaining(this.notificationDiff),
    });
  }

  private onActivity(): void {
    if (this.isIdle) {
      return;
    }
    this.idleSince = Date.now();
  }

}
