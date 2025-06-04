import {
  beforeAll,
  vi,
} from 'vitest';

import { ConfigManager } from '../classes/managers/ConfigManager';
import type { Config } from '../models/config';
import { setup } from '../setup/setup';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

setup();

vi.setConfig({
  testTimeout: 10000,
});

beforeAll(() => {
  ConfigManager.instance.config = {
    epiTree: {
      MIN_SCALE_WIDTH_PX: 48,
      MAX_SCALE_WIDTH_PX: 144,
      SCALE_INCREMENTS: [1, 2, 5, 10, 20, 50],
    },
    epiMap: {
      MIN_PIE_CHART_RADIUS: 4,
    },
    outages: {
      NUM_HOURS_TO_SHOW_SOON_ACTIVE_OUTAGES: 8,
    },
  } as Config;
});
