import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { ConfigService } from '@gen-epix/ui';
import type { FieldValues } from 'react-hook-form';

import {
  DASHBOARD_ARRANGEMENT_ORIENTATION,
  WIDGET_CONSTRAINT_CARDINAL_DIRECTION,
} from '../../models/dashboard';
import type {
  DashboardArrangement,
  DashboardArrangementConfig,
  WidgetDataBase,
  WidgetsConfig,
} from '../../models/dashboard';
import type { CaseDbConfig } from '../../models/config';

import { DashboardUtil } from './DashboardUtil';

// ---------------------------------------------------------------------------
// Shorthands
// ---------------------------------------------------------------------------

const H = DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL;
const V = DASHBOARD_ARRANGEMENT_ORIENTATION.VERTICAL;
const EAST = WIDGET_CONSTRAINT_CARDINAL_DIRECTION.EAST;
const WEST = WIDGET_CONSTRAINT_CARDINAL_DIRECTION.WEST;
const SOUTH = WIDGET_CONSTRAINT_CARDINAL_DIRECTION.SOUTH;
const NORTH = WIDGET_CONSTRAINT_CARDINAL_DIRECTION.NORTH;

// ---------------------------------------------------------------------------
// Layout factory helpers
// ---------------------------------------------------------------------------

const leaf = (name: string): { name: string; size: number } => ({ name, size: 50 });
const grp = (
  orientation: DASHBOARD_ARRANGEMENT_ORIENTATION,
  cells: DashboardArrangement['cells'],
  size = 50,
): DashboardArrangement => ({ cells, orientation, size });

// ---------------------------------------------------------------------------
// Fixed arrangements used across multiple test suites
//
// Adjacency facts are derived in comments so tests are self-documenting.
// ---------------------------------------------------------------------------

/** H [ A | B ]
 *  A.EAST=[B]  B.WEST=[A]  no north/south adjacency
 */
const FLAT_H = grp(H, [leaf('A'), leaf('B')], 100);

/** V [ A / B ]
 *  A.SOUTH=[B]  B.NORTH=[A]  no east/west adjacency
 */
const FLAT_V = grp(V, [leaf('A'), leaf('B')], 100);

/** H [ A | V[B/C] ]
 *  A.EAST=[B,C]  B.WEST=C.WEST=[A]  B.SOUTH=[C]  C.NORTH=[B]
 */
const NESTED_HV = grp(H, [leaf('A'), grp(V, [leaf('B'), leaf('C')])], 100);

/** V [ H[A|B] / H[C|D] ]
 *  A.EAST=[B]  A.SOUTH=B.SOUTH=[C,D]  C.NORTH=D.NORTH=[A,B]  C.EAST=[D]
 */
const FOUR = grp(V, [grp(H, [leaf('A'), leaf('B')], 70), grp(H, [leaf('C'), leaf('D')], 30)], 100);

/** V [ V[A/B] / C ]
 *  Tests getBoundaryLeafZones SOUTH+VERTICAL: south boundary of V[A/B] is its last leaf B
 *  B.SOUTH=[C]  C.NORTH=[B]  A.SOUTH=[B]  B.NORTH=[A]
 */
const VERT_VERT_L = grp(V, [grp(V, [leaf('A'), leaf('B')]), leaf('C')], 100);

/** V [ C / V[A/B] ]
 *  Tests getBoundaryLeafZones NORTH+VERTICAL: north boundary of V[A/B] is its first leaf A
 *  C.SOUTH=[A]  A.NORTH=[C]  A.SOUTH=[B]  B.NORTH=[A]
 */
const VERT_VERT_R = grp(V, [leaf('C'), grp(V, [leaf('A'), leaf('B')])], 100);

/** H [ V[A/B] | C ]
 *  Tests getBoundaryLeafZones EAST+VERTICAL: east boundary of V[A/B] includes all leaves [A, B]
 *  A.EAST=B.EAST=[C]  C.WEST=[A,B]
 */
const HORIZ_VERT_L = grp(H, [grp(V, [leaf('A'), leaf('B')]), leaf('C')], 100);

/** H [ A | H[B|C] ]
 *  Tests getBoundaryLeafZones WEST+HORIZONTAL: west boundary of H[B|C] is its first leaf B
 *  A.EAST=[B]  B.WEST=[A]
 */
const HORIZ_HORIZ_R = grp(H, [leaf('A'), grp(H, [leaf('B'), leaf('C')])], 100);

/** H [ H[A|B] | C ]
 *  Tests getBoundaryLeafZones EAST+HORIZONTAL: east boundary of H[A|B] is its last leaf B
 *  B.EAST=[C]  C.WEST=[B]
 */
const HORIZ_HORIZ_L = grp(H, [grp(H, [leaf('A'), leaf('B')]), leaf('C')], 100);

/** H [ A | H[] ]
 *  Tests getBoundaryLeafZones cells.length === 0: empty group contributes no zones
 *  A.EAST=[]
 */
const EMPTY_IN_HORIZ = grp(H, [leaf('A'), grp(H, [])], 100);

/** H [ V[A/B] | V[C/D] ]
 *  Tests getSiblingZonesInSameCellsArray: search for zone C bypasses the first
 *  nested group and finds it in the second group.
 *  C's direct sibling = D
 */
const TWO_NESTED = grp(H, [grp(V, [leaf('A'), leaf('B')]), grp(V, [leaf('C'), leaf('D')])], 100);

// ---------------------------------------------------------------------------
// Widgets config helpers
// ---------------------------------------------------------------------------

const noop: () => null = () => null;

const makeWidgets = (): WidgetsConfig<FieldValues, WidgetDataBase, WidgetDataBase> => ({
  unconstrained: {
    component: noop as never,
    widgetLabel: 'Unconstrained',
  },
  withAdjacent: {
    component: noop as never,
    constraints: [{ require_adjacent: { direction: EAST, widgetName: 'unconstrained' } }],
    widgetLabel: 'With Adjacent',
  },
  withEmptyConstraint: {
    component: noop as never,
    constraints: [{}],
    widgetLabel: 'With Empty Constraint',
  },
  withSibling: {
    component: noop as never,
    constraints: [{ require_adjacent_direct_sibling: { direction: EAST, widgetName: 'unconstrained' } }],
    widgetLabel: 'With Sibling',
  },
});

// ---------------------------------------------------------------------------
// ConfigService mock helper
// ---------------------------------------------------------------------------

const mockDashboard = (overrides: Partial<CaseDbConfig['dashboard']>): void => {
  vi.spyOn(ConfigService.getInstance<CaseDbConfig>(), 'config', 'get').mockReturnValue({
    dashboard: overrides,
  } as unknown as CaseDbConfig);
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DashboardUtil', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  describe('getAdjacentZones', () => {
    describe('flat horizontal layout H[A|B]', () => {
      it('A.EAST = [B]', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_H, 'A', EAST)).toEqual(['B']);
      });

      it('B.WEST = [A]', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_H, 'B', WEST)).toEqual(['A']);
      });

      it('A.WEST = [] (no zone to the left)', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_H, 'A', WEST)).toEqual([]);
      });

      it('A.NORTH = [] (flat horizontal has no vertical adjacency)', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_H, 'A', NORTH)).toEqual([]);
      });

      it('A.SOUTH = []', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_H, 'A', SOUTH)).toEqual([]);
      });
    });

    describe('flat vertical layout V[A/B]', () => {
      it('A.SOUTH = [B]', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_V, 'A', SOUTH)).toEqual(['B']);
      });

      it('B.NORTH = [A]', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_V, 'B', NORTH)).toEqual(['A']);
      });

      it('A.EAST = [] (flat vertical has no horizontal adjacency)', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_V, 'A', EAST)).toEqual([]);
      });

      it('A.WEST = []', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_V, 'A', WEST)).toEqual([]);
      });
    });

    describe('nested H[A | V[B/C]] layout', () => {
      it('A.EAST = [B, C] (A shares a border with the full west face of the nested column)', () => {
        expect(DashboardUtil.getAdjacentZones(NESTED_HV, 'A', EAST)).toEqual(['B', 'C']);
      });

      it('B.WEST = [A]', () => {
        expect(DashboardUtil.getAdjacentZones(NESTED_HV, 'B', WEST)).toEqual(['A']);
      });

      it('C.WEST = [A]', () => {
        expect(DashboardUtil.getAdjacentZones(NESTED_HV, 'C', WEST)).toEqual(['A']);
      });

      it('B.SOUTH = [C]', () => {
        expect(DashboardUtil.getAdjacentZones(NESTED_HV, 'B', SOUTH)).toEqual(['C']);
      });

      it('C.NORTH = [B]', () => {
        expect(DashboardUtil.getAdjacentZones(NESTED_HV, 'C', NORTH)).toEqual(['B']);
      });

      it('A.SOUTH = [] (A is not vertically adjacent to B or C)', () => {
        expect(DashboardUtil.getAdjacentZones(NESTED_HV, 'A', SOUTH)).toEqual([]);
      });
    });

    describe('four-zone V[ H[A|B] / H[C|D] ] layout', () => {
      it('A.SOUTH = [C, D]', () => {
        expect(DashboardUtil.getAdjacentZones(FOUR, 'A', SOUTH)).toEqual(['C', 'D']);
      });

      it('B.SOUTH = [C, D]', () => {
        expect(DashboardUtil.getAdjacentZones(FOUR, 'B', SOUTH)).toEqual(['C', 'D']);
      });

      it('C.NORTH = [A, B]', () => {
        expect(DashboardUtil.getAdjacentZones(FOUR, 'C', NORTH)).toEqual(['A', 'B']);
      });

      it('D.NORTH = [A, B]', () => {
        expect(DashboardUtil.getAdjacentZones(FOUR, 'D', NORTH)).toEqual(['A', 'B']);
      });

      it('A.EAST = [B]', () => {
        expect(DashboardUtil.getAdjacentZones(FOUR, 'A', EAST)).toEqual(['B']);
      });

      it('C.EAST = [D]', () => {
        expect(DashboardUtil.getAdjacentZones(FOUR, 'C', EAST)).toEqual(['D']);
      });
    });

    describe('boundary-leaf edge cases (exercises all getBoundaryLeafZones branches)', () => {
      it('SOUTH+VERTICAL: south boundary of a vertical group is its last leaf — V[ V[A/B] / C ]', () => {
        expect(DashboardUtil.getAdjacentZones(VERT_VERT_L, 'B', SOUTH)).toEqual(['C']);
        expect(DashboardUtil.getAdjacentZones(VERT_VERT_L, 'C', NORTH)).toEqual(['B']);
      });

      it('NORTH+VERTICAL: north boundary of a vertical group is its first leaf — V[ C / V[A/B] ]', () => {
        expect(DashboardUtil.getAdjacentZones(VERT_VERT_R, 'C', SOUTH)).toEqual(['A']);
        expect(DashboardUtil.getAdjacentZones(VERT_VERT_R, 'A', NORTH)).toEqual(['C']);
      });

      it('EAST+VERTICAL: east boundary of a vertical group includes all its leaves — H[ V[A/B] | C ]', () => {
        expect(DashboardUtil.getAdjacentZones(HORIZ_VERT_L, 'A', EAST)).toEqual(['C']);
        expect(DashboardUtil.getAdjacentZones(HORIZ_VERT_L, 'B', EAST)).toEqual(['C']);
        expect(DashboardUtil.getAdjacentZones(HORIZ_VERT_L, 'C', WEST)).toEqual(['A', 'B']);
      });

      it('WEST+HORIZONTAL: west boundary of a horizontal group is its first leaf — H[ A | H[B|C] ]', () => {
        expect(DashboardUtil.getAdjacentZones(HORIZ_HORIZ_R, 'A', EAST)).toEqual(['B']);
        expect(DashboardUtil.getAdjacentZones(HORIZ_HORIZ_R, 'B', WEST)).toEqual(['A']);
      });

      it('EAST+HORIZONTAL: east boundary of a horizontal group is its last leaf — H[ H[A|B] | C ]', () => {
        expect(DashboardUtil.getAdjacentZones(HORIZ_HORIZ_L, 'B', EAST)).toEqual(['C']);
        expect(DashboardUtil.getAdjacentZones(HORIZ_HORIZ_L, 'C', WEST)).toEqual(['B']);
      });

      it('cells.length === 0: an empty group contributes no adjacent zones — H[ A | H[] ]', () => {
        expect(DashboardUtil.getAdjacentZones(EMPTY_IN_HORIZ, 'A', EAST)).toEqual([]);
      });

      it('returns [] for a zone that does not exist in the arrangement', () => {
        expect(DashboardUtil.getAdjacentZones(FLAT_H, 'Z', EAST)).toEqual([]);
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('getArrangementGroupInfos', () => {
    it('returns a single root entry for a layout with only leaf cells', () => {
      expect(DashboardUtil.getArrangementGroupInfos(FLAT_H, 'pfx')).toEqual([
        { groupId: 'pfx-root', orientation: H },
      ]);
    });

    it('appends an entry for each nested group with the correct index-based path', () => {
      expect(DashboardUtil.getArrangementGroupInfos(NESTED_HV, 'pfx')).toEqual([
        { groupId: 'pfx-root', orientation: H },
        { groupId: 'pfx-root-1', orientation: V },
      ]);
    });

    it('recurses into all nested levels', () => {
      expect(DashboardUtil.getArrangementGroupInfos(FOUR, 'pfx')).toEqual([
        { groupId: 'pfx-root', orientation: V },
        { groupId: 'pfx-root-0', orientation: H },
        { groupId: 'pfx-root-1', orientation: H },
      ]);
    });

    it('uses "root" as the default path parameter', () => {
      const [first] = DashboardUtil.getArrangementGroupInfos(FLAT_V, 'x');
      expect(first.groupId).toBe('x-root');
    });
  });

  // -------------------------------------------------------------------------
  describe('getArrangementWidgetAssignments', () => {
    it('returns null for every zone when no assignments object is provided', () => {
      expect(DashboardUtil.getArrangementWidgetAssignments(FLAT_H)).toEqual({ A: null, B: null });
    });

    it('maps each zone to its provided assignment', () => {
      expect(DashboardUtil.getArrangementWidgetAssignments(FLAT_H, { A: 'w1', B: 'w2' })).toEqual({
        A: 'w1',
        B: 'w2',
      });
    });

    it('returns null for zones absent from the provided assignments', () => {
      expect(DashboardUtil.getArrangementWidgetAssignments(FLAT_H, { A: 'w1' })).toEqual({
        A: 'w1',
        B: null,
      });
    });

    it('collects all leaf zones from a nested layout', () => {
      expect(DashboardUtil.getArrangementWidgetAssignments(NESTED_HV, { A: 'w1', B: 'w2', C: 'w3' })).toEqual({
        A: 'w1',
        B: 'w2',
        C: 'w3',
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('getAvailableWidgets', () => {
    const ARRANGEMENT_KEY = 'layout';

    const setup = (arrangement: DashboardArrangement): void => {
      mockDashboard({ ARRANGEMENT_OPTIONS: { [ARRANGEMENT_KEY]: arrangement } });
    };

    const cfg = (assignments: Record<string, null | string>): DashboardArrangementConfig => ({
      arrangementKey: ARRANGEMENT_KEY,
      arrangementWidgetAssignments: assignments,
    });

    it('includes unconstrained widgets not yet assigned to any zone', () => {
      const widgets = makeWidgets();
      setup(FLAT_H);
      expect(DashboardUtil.getAvailableWidgets(cfg({ A: null, B: null }), 'A', widgets)).toContain('unconstrained');
    });

    it('excludes widgets already assigned to another zone', () => {
      const widgets = makeWidgets();
      setup(FLAT_H);
      // 'unconstrained' is assigned to zone B; asking what can go in zone A
      expect(DashboardUtil.getAvailableWidgets(cfg({ A: null, B: 'unconstrained' }), 'A', widgets)).not.toContain('unconstrained');
    });

    it('does not exclude the widget currently occupying the target zone', () => {
      // zone A already holds 'unconstrained'; it should still appear as an option for A
      const widgets = makeWidgets();
      setup(FLAT_H);
      expect(DashboardUtil.getAvailableWidgets(cfg({ A: 'unconstrained', B: null }), 'A', widgets)).toContain('unconstrained');
    });

    it('includes a widget whose require_adjacent constraint is satisfied', () => {
      // withAdjacent requires 'unconstrained' to the EAST; B (east of A) is assigned 'unconstrained'
      const widgets = makeWidgets();
      setup(FLAT_H);
      expect(DashboardUtil.getAvailableWidgets(cfg({ A: null, B: 'unconstrained' }), 'A', widgets)).toContain('withAdjacent');
    });

    it('excludes a widget whose require_adjacent constraint is not satisfied', () => {
      const widgets = makeWidgets();
      setup(FLAT_H);
      expect(DashboardUtil.getAvailableWidgets(cfg({ A: null, B: null }), 'A', widgets)).not.toContain('withAdjacent');
    });

    it('includes a widget whose require_adjacent_direct_sibling constraint is satisfied', () => {
      // withSibling requires 'unconstrained' in a direct sibling; B is the only direct sibling of A in FLAT_H
      const widgets = makeWidgets();
      setup(FLAT_H);
      expect(DashboardUtil.getAvailableWidgets(cfg({ A: null, B: 'unconstrained' }), 'A', widgets)).toContain('withSibling');
    });

    it('excludes a widget whose require_adjacent_direct_sibling constraint is not satisfied', () => {
      const widgets = makeWidgets();
      setup(FLAT_H);
      expect(DashboardUtil.getAvailableWidgets(cfg({ A: null, B: null }), 'A', widgets)).not.toContain('withSibling');
    });

    it('treats a constraint with neither field set as automatically satisfied', () => {
      const widgets = makeWidgets();
      setup(FLAT_H);
      expect(DashboardUtil.getAvailableWidgets(cfg({ A: null, B: null }), 'A', widgets)).toContain('withEmptyConstraint');
    });

    it('direct-sibling constraint is NOT satisfied by a zone in a different nested group', () => {
      // NESTED_HV: H[ A | V[B/C] ] — A has no direct leaf siblings in root.cells
      // 'unconstrained' is assigned to B, but B is inside the sub-group, not a direct sibling of A
      const widgets = makeWidgets();
      setup(NESTED_HV);
      expect(
        DashboardUtil.getAvailableWidgets(cfg({ A: null, B: 'unconstrained', C: null }), 'A', widgets),
      ).not.toContain('withSibling');
    });

    it('direct-sibling constraint is satisfied within a nested group', () => {
      // NESTED_HV: B and C are direct siblings inside V[B/C]; C holds 'unconstrained'
      const widgets = makeWidgets();
      setup(NESTED_HV);
      expect(
        DashboardUtil.getAvailableWidgets(cfg({ A: null, B: null, C: 'unconstrained' }), 'B', widgets),
      ).toContain('withSibling');
    });

    it('sibling search continues past the first nested group when the zone is in the second group', () => {
      // TWO_NESTED: H[ V[A/B] | V[C/D] ] — zone C is in the second group; D is its direct sibling
      const widgets = makeWidgets();
      setup(TWO_NESTED);
      expect(
        DashboardUtil.getAvailableWidgets(cfg({ A: null, B: null, C: null, D: 'unconstrained' }), 'C', widgets),
      ).toContain('withSibling');
    });

    it('sibling search returns [] for a zone not present in the arrangement', () => {
      // Zone 'Z' is unknown → sibling list is empty → constraint not satisfied
      const widgets = makeWidgets();
      setup(FLAT_H);
      expect(
        DashboardUtil.getAvailableWidgets(cfg({ A: 'unconstrained', B: null }), 'Z', widgets),
      ).not.toContain('withSibling');
    });
  });

  // -------------------------------------------------------------------------
  describe('getCaseCount', () => {
    const c = (count: null | number): CaseDbCase => ({ count } as unknown as CaseDbCase);

    it('returns 0 for an empty array', () => {
      expect(DashboardUtil.getCaseCount([])).toBe(0);
    });

    it('sums explicit count values', () => {
      expect(DashboardUtil.getCaseCount([c(3), c(2)])).toBe(5);
    });

    it('treats a null count as 1', () => {
      expect(DashboardUtil.getCaseCount([c(null)])).toBe(1);
    });

    it('handles a mix of explicit and null counts', () => {
      expect(DashboardUtil.getCaseCount([c(3), c(null), c(2)])).toBe(6);
    });
  });

  // -------------------------------------------------------------------------
  describe('getEnabledWidgets', () => {
    const cfg = (assignments: Record<string, null | string>): DashboardArrangementConfig => ({
      arrangementKey: 'key',
      arrangementWidgetAssignments: assignments,
    });

    beforeEach(() => {
      mockDashboard({ ARRANGEMENT_OPTIONS: { key: FLAT_H } });
    });

    it('returns only the zones with a non-null widget assignment', () => {
      expect(DashboardUtil.getEnabledWidgets(cfg({ A: 'widgetA', B: null }))).toEqual(['A']);
    });

    it('returns an empty array when no zone is assigned', () => {
      expect(DashboardUtil.getEnabledWidgets(cfg({ A: null, B: null }))).toEqual([]);
    });

    it('returns all zones when every zone is assigned', () => {
      expect(DashboardUtil.getEnabledWidgets(cfg({ A: 'widgetA', B: 'widgetB' }))).toEqual(['A', 'B']);
    });
  });

  // -------------------------------------------------------------------------
  describe('getSelectedRows', () => {
    const row = (id: string): CaseDbCase => ({ id } as unknown as CaseDbCase);

    it('returns only cases whose id is in the selectedIds list', () => {
      expect(DashboardUtil.getSelectedRows([row('r1'), row('r2'), row('r3')], ['r1', 'r3'])).toEqual([
        row('r1'),
        row('r3'),
      ]);
    });

    it('returns an empty array when selectedIds is empty', () => {
      expect(DashboardUtil.getSelectedRows([row('r1')], [])).toEqual([]);
    });

    it('returns an empty array when cases is empty', () => {
      expect(DashboardUtil.getSelectedRows([], ['r1'])).toEqual([]);
    });

    it('returns an empty array when no id matches', () => {
      expect(DashboardUtil.getSelectedRows([row('r1')], ['r99'])).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('isArrangementWidgetAssignmentsValid', () => {
    const widgets: WidgetsConfig<FieldValues, WidgetDataBase, WidgetDataBase> = {
      widgetA: { component: noop as never, widgetLabel: 'A' },
    };

    it('returns true when all assigned widget names exist in the config', () => {
      expect(DashboardUtil.isArrangementWidgetAssignmentsValid({ z1: 'widgetA' }, widgets)).toBe(true);
    });

    it('treats null assignments as valid (no widget placed in that zone)', () => {
      expect(DashboardUtil.isArrangementWidgetAssignmentsValid({ z1: null }, widgets)).toBe(true);
    });

    it('treats empty-string assignments as valid', () => {
      expect(DashboardUtil.isArrangementWidgetAssignmentsValid({ z1: '' }, widgets)).toBe(true);
    });

    it('returns false when a widget name is absent from the config', () => {
      expect(DashboardUtil.isArrangementWidgetAssignmentsValid({ z1: 'unknown' }, widgets)).toBe(false);
    });

    it('returns false when any single assignment is invalid even if others are valid', () => {
      expect(DashboardUtil.isArrangementWidgetAssignmentsValid({ z1: 'widgetA', z2: 'unknown' }, widgets)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('isSingleWidget', () => {
    const cfg = (assignments: Record<string, null | string>): DashboardArrangementConfig => ({
      arrangementKey: 'key',
      arrangementWidgetAssignments: assignments,
    });

    it('returns true when there is exactly one zone in the layout and it is assigned', () => {
      mockDashboard({ ARRANGEMENT_OPTIONS: { key: grp(H, [leaf('A')], 100) } });
      expect(DashboardUtil.isSingleWidget(cfg({ A: 'widgetA' }), 'A')).toBe(true);
    });

    it('returns false when the arrangement contains more than one zone', () => {
      mockDashboard({ ARRANGEMENT_OPTIONS: { key: FLAT_H } });
      expect(DashboardUtil.isSingleWidget(cfg({ A: 'widgetA', B: 'widgetB' }), 'A')).toBe(false);
    });

    it('returns falsy when the target zone has no widget assigned', () => {
      mockDashboard({ ARRANGEMENT_OPTIONS: { key: grp(H, [leaf('A')], 100) } });
      expect(DashboardUtil.isSingleWidget(cfg({ A: null }), 'A')).toBeFalsy();
    });
  });

  // -------------------------------------------------------------------------
  describe('removeInvalidWidgetAssignments', () => {
    const ARRANGEMENT_KEY = 'layout';

    const setup = (arrangement: DashboardArrangement): void => {
      mockDashboard({ ARRANGEMENT_OPTIONS: { [ARRANGEMENT_KEY]: arrangement } });
    };

    const cfg = (assignments: Record<string, null | string>): DashboardArrangementConfig => ({
      arrangementKey: ARRANGEMENT_KEY,
      arrangementWidgetAssignments: assignments,
    });

    it('returns the config unchanged when all assignments satisfy their constraints', () => {
      // withAdjacent in A requires 'unconstrained' to EAST; B has 'unconstrained' ✓
      const widgets = makeWidgets();
      setup(FLAT_H);
      const input = cfg({ A: 'withAdjacent', B: 'unconstrained' });
      expect(DashboardUtil.removeInvalidWidgetAssignments(input, widgets)).toEqual(input);
    });

    it('returns the config unchanged when all assignments are null', () => {
      const widgets = makeWidgets();
      setup(FLAT_H);
      const input = cfg({ A: null, B: null });
      expect(DashboardUtil.removeInvalidWidgetAssignments(input, widgets)).toEqual(input);
    });

    it('keeps a validly assigned unconstrained widget', () => {
      const widgets = makeWidgets();
      setup(FLAT_H);
      const input = cfg({ A: 'unconstrained', B: null });
      expect(DashboardUtil.removeInvalidWidgetAssignments(input, widgets)).toEqual(input);
    });

    it('does not remove a widget whose constraint object has no fields (always satisfied)', () => {
      const widgets = makeWidgets();
      setup(FLAT_H);
      const input = cfg({ A: 'withEmptyConstraint', B: null });
      expect(DashboardUtil.removeInvalidWidgetAssignments(input, widgets)).toEqual(input);
    });

    it('nulls a zone whose require_adjacent constraint is not satisfied', () => {
      // withAdjacent requires 'unconstrained' to EAST; B is empty → constraint fails
      const widgets = makeWidgets();
      setup(FLAT_H);
      const result = DashboardUtil.removeInvalidWidgetAssignments(cfg({ A: 'withAdjacent', B: null }), widgets);
      expect(result.arrangementWidgetAssignments).toEqual({ A: null, B: null });
    });

    it('nulls a zone whose require_adjacent_direct_sibling constraint is not satisfied', () => {
      // withSibling requires 'unconstrained' as a direct sibling; B is empty → constraint fails
      const widgets = makeWidgets();
      setup(FLAT_H);
      const result = DashboardUtil.removeInvalidWidgetAssignments(cfg({ A: 'withSibling', B: null }), widgets);
      expect(result.arrangementWidgetAssignments).toEqual({ A: null, B: null });
    });

    it('cascades: removing one widget causes a dependent widget to be removed in the next pass', () => {
      // Y requires 'X' as a direct sibling; Z requires 'Y' as a direct sibling.
      // A='Y', B='Z': pass 1 — Y in A fails (B has Z, not X) → A cleared;
      //               Z in B still passes (A had Y in original assignments).
      // pass 2 — Z in B now fails (A is null, not Y) → B cleared.
      const cascadeWidgets: WidgetsConfig<FieldValues, WidgetDataBase, WidgetDataBase> = {
        X: { component: noop as never, widgetLabel: 'X' },
        Y: {
          component: noop as never,
          constraints: [{ require_adjacent_direct_sibling: { direction: EAST, widgetName: 'X' } }],
          widgetLabel: 'Y',
        },
        Z: {
          component: noop as never,
          constraints: [{ require_adjacent_direct_sibling: { direction: EAST, widgetName: 'Y' } }],
          widgetLabel: 'Z',
        },
      };
      setup(FLAT_H);
      const result = DashboardUtil.removeInvalidWidgetAssignments(cfg({ A: 'Y', B: 'Z' }), cascadeWidgets);
      expect(result.arrangementWidgetAssignments).toEqual({ A: null, B: null });
    });
  });

  // -------------------------------------------------------------------------
  describe('validateAndMigrateArrangementConfig', () => {
    const WIDGETS: WidgetsConfig<FieldValues, WidgetDataBase, WidgetDataBase> = {
      widgetA: { component: noop as never, widgetLabel: 'A' },
    };

    beforeEach(() => {
      mockDashboard({
        ARRANGEMENT_OPTIONS: { layout1: FLAT_H, layout2: FLAT_V },
        DEFAULT_ARRANGEMENT_KEY: 'layout1',
        DEFAULT_WIDGET_ASSIGNMENTS: {
          layout1: { A: 'widgetA', B: null },
          layout2: { A: null, B: 'widgetA' },
        },
        WIDGETS,
      });
    });

    it('returns the config unchanged when both the key and assignments are valid', () => {
      const config = { arrangementKey: 'layout1', arrangementWidgetAssignments: { A: 'widgetA', B: null as string } };
      expect(DashboardUtil.validateAndMigrateArrangementConfig(config)).toEqual(config);
    });

    it('resets the arrangement key to the default when the key is not in ARRANGEMENT_OPTIONS', () => {
      const result = DashboardUtil.validateAndMigrateArrangementConfig({
        arrangementKey: 'unknown',
        arrangementWidgetAssignments: {},
      });
      expect(result.arrangementKey).toBe('layout1');
    });

    it('resets the arrangement key when it is an empty string', () => {
      const result = DashboardUtil.validateAndMigrateArrangementConfig({
        arrangementKey: '',
        arrangementWidgetAssignments: {},
      });
      expect(result.arrangementKey).toBe('layout1');
    });

    it('resets widget assignments when they reference an unknown widget name', () => {
      const result = DashboardUtil.validateAndMigrateArrangementConfig({
        arrangementKey: 'layout1',
        arrangementWidgetAssignments: { A: 'unknownWidget' },
      });
      expect(result.arrangementWidgetAssignments).toEqual({ A: 'widgetA', B: null });
    });

    it('falls back to the default-key assignments when the current key has no entry in DEFAULT_WIDGET_ASSIGNMENTS', () => {
      // layout2 is intentionally absent from DEFAULT_WIDGET_ASSIGNMENTS
      mockDashboard({
        ARRANGEMENT_OPTIONS: { layout1: FLAT_H, layout2: FLAT_V },
        DEFAULT_ARRANGEMENT_KEY: 'layout1',
        DEFAULT_WIDGET_ASSIGNMENTS: {
          layout1: { A: 'widgetA', B: null },
        },
        WIDGETS,
      });
      const result = DashboardUtil.validateAndMigrateArrangementConfig({
        arrangementKey: 'layout2',
        arrangementWidgetAssignments: { A: 'unknownWidget' },
      });
      expect(result.arrangementWidgetAssignments).toEqual({ A: 'widgetA', B: null });
    });
  });

  // -------------------------------------------------------------------------
  describe('createDashboardArrangementConfigInitialState', () => {
    it('returns the default arrangement key and its corresponding default widget assignments', () => {
      mockDashboard({
        DEFAULT_ARRANGEMENT_KEY: 'layout1',
        DEFAULT_WIDGET_ASSIGNMENTS: { layout1: { A: 'widgetA', B: null } },
      });
      expect(DashboardUtil.createDashboardArrangementConfigInitialState()).toEqual({
        arrangementKey: 'layout1',
        arrangementWidgetAssignments: { A: 'widgetA', B: null },
      });
    });
  });
});
