import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbOutage } from '@gen-epix/api-commondb';

import type { CategorizedOutages } from '../../models/outage.models';

import { outagesStore } from './outagesStore';

const EMPTY_OUTAGES: CategorizedOutages = {
  activeOutages: [],
  soonActiveOutages: [],
  visibleOutages: [],
};

describe('outagesStore', () => {
  afterEach(() => {
    outagesStore.getState().setCategorizedOutages(EMPTY_OUTAGES);
  });

  it('starts with empty outage categories', () => {
    const { activeOutages, soonActiveOutages, visibleOutages } = outagesStore.getState();

    expect(activeOutages).toEqual([]);
    expect(soonActiveOutages).toEqual([]);
    expect(visibleOutages).toEqual([]);
  });

  it('stores each categorized outage collection without removing store actions', () => {
    const activeOutage: CommonDbOutage = { id: 'active' };
    const soonActiveOutage: CommonDbOutage = { id: 'soon' };
    const visibleOutage: CommonDbOutage = { id: 'visible' };
    const categorizedOutages: CategorizedOutages = {
      activeOutages: [activeOutage],
      soonActiveOutages: [soonActiveOutage],
      visibleOutages: [visibleOutage],
    };

    outagesStore.getState().setCategorizedOutages(categorizedOutages);

    const state = outagesStore.getState();
    expect(state.activeOutages).toEqual([activeOutage]);
    expect(state.soonActiveOutages).toEqual([soonActiveOutage]);
    expect(state.visibleOutages).toEqual([visibleOutage]);
    expect(state.setCategorizedOutages).toBeTypeOf('function');
  });

  it('replaces populated categories with empty collections', () => {
    outagesStore.getState().setCategorizedOutages({
      activeOutages: [{ id: 'active' }],
      soonActiveOutages: [{ id: 'soon' }],
      visibleOutages: [{ id: 'visible' }],
    });

    outagesStore.getState().setCategorizedOutages(EMPTY_OUTAGES);

    expect(outagesStore.getState()).toMatchObject(EMPTY_OUTAGES);
  });
});
