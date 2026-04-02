import type { E2ETreeContract } from '../models/e2e';

declare global {
  interface Window {
    __GEN_EPIX_E2E__?: {
      version: 1;
      widgets: {
        TREE?: E2ETreeContract;
      };
    };
  }
}

export {};
