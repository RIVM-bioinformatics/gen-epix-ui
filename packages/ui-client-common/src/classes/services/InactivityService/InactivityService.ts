import throttle from 'lodash/throttle';
import { CommonDbLogLevel } from '@gen-epix/api-commondb';
import { SubscribableAbstract } from '@gen-epix/ui-core/classes/abstracts/SubscribableAbstract';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import {
  inject,
  container as rootContainer,
  singleton,
} from 'tsyringe';

import { AuthenticationService } from '../AuthenticationService';
import { LogService } from '../LogService';
import { TimeUtil } from '../../../utils/TimeUtil';
import { CONFIG_TOKEN } from '../../../constants/config.constants';
import type { ConfigBase } from '../../../models/config.models';

export type InactivityState = {
  idleDiff: number;
  isIdle: boolean;
  notificationDiff: number;
  readableIdleDiff: string;
  readableNotificationDiff: string;
};

@singleton()
export class InactivityService extends SubscribableAbstract<InactivityState> {
  private idleDiff: number = 0;

  private idleSince: number = Date.now();
  private isIdle: boolean = false;
  private isPaused: boolean = false;
  private notificationDiff: number = 0;
  private readonly onActivityDebounced: () => void;

  public constructor(@inject(CONFIG_TOKEN) config: ConfigBase) {
    super(new Subject<InactivityState>({
      idleDiff: 0,
      isIdle: false,
      notificationDiff: 0,
      readableIdleDiff: '',
      readableNotificationDiff: '',
    }));

    this.onActivityDebounced = throttle(this.onActivity.bind(this), 1000, {
      leading: true,
      trailing: true,
    });

    const { ALLOWED_IDLE_TIME_MS, NOTIFICATION_TIME_MS } = config.userInactivityConfirmation;
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

  public static getInstance(): InactivityService {
    return rootContainer.resolve(InactivityService);
  }

  public logout(): void {
    LogService.getInstance().log([{
      detail: AuthenticationService.getInstance().authContextProps.user,
      level: CommonDbLogLevel.TRACE,
      topic: 'USER_LOGOUT_BY_INACTIVITY',
    }]);
    LogService.getInstance().flushLog();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    AuthenticationService.getInstance().authContextProps.signoutRedirect();
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
