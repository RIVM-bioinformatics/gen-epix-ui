import { addHours } from 'date-fns';

import type { Outage } from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import type { CategorizedOutages } from '../../models/outage';

export class OutageUtil {
  public static getCategorizedOutages(outages: Outage[]): CategorizedOutages {
    const visibleOutages = outages.filter((outage) => {
      if (outage.is_visible) {
        return true;
      }
      if (outage.visible_from || outage.visible_to) {
        const now = new Date();
        if (outage.visible_from && outage.visible_to) {
          return now >= new Date(outage.visible_from) && now < new Date(outage.visible_to);
        }
        if (outage.visible_from && now >= new Date(outage.visible_from)) {
          return true;
        }
        if (outage.visible_to && now < new Date(outage.visible_to)) {
          return true;
        }
        return false;
      }
    });

    const activeOutages = outages.filter((outage) => {
      if (outage.is_active) {
        return true;
      }
      if (outage.active_from || outage.active_to) {
        const now = new Date();
        if (outage.active_from && outage.active_to) {
          return now >= new Date(outage.active_from) && now < new Date(outage.active_to);
        }
        if (outage.active_from && now >= new Date(outage.active_from)) {
          return true;
        }
        if (outage.active_to && now < new Date(outage.active_to)) {
          return true;
        }
        return false;
      }
    });
    const activeOutageIds = activeOutages.map((outage) => outage.id);

    const soonActiveOutages = outages.filter((outage) => {
      if (activeOutageIds.includes(outage.id)) {
        return false;
      }
      if (outage.is_active) {
        return true;
      }
      if (outage.active_from || outage.active_to) {
        const now = new Date();
        const soon = addHours(now, ConfigManager.instance.config.outages.NUM_HOURS_TO_SHOW_SOON_ACTIVE_OUTAGES);
        if (outage.active_from && outage.active_to) {
          return soon >= new Date(outage.active_from) && now < new Date(outage.active_to);
        }
        if (outage.active_from && soon >= new Date(outage.active_from)) {
          return true;
        }
        if (outage.active_to && now < new Date(outage.active_to)) {
          return true;
        }
        return false;
      }
    });

    return {
      visibleOutages,
      activeOutages,
      soonActiveOutages,
    };
  }
}
