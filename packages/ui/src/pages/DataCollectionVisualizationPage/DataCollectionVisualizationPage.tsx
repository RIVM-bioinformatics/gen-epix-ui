import { useTranslation } from 'react-i18next';
import {
  Autocomplete,
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import EChartsReact from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import { GraphChart } from 'echarts/charts';
import {
  type MouseEvent as ReactMouseEvent,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import type {
  EChartsOption,
  GraphSeriesOption,
} from 'echarts';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import type { OrganizationAccessCasePolicy } from '@gen-epix/api-casedb';

import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import { useDataCollectionsMapQuery } from '../../dataHooks/useDataCollectionsQuery';
import { useOrganizationAccessCasePoliciesQuery } from '../../dataHooks/useOrganizationAccessCasePoliciesQuery';
import { useOrganizationShareCasePoliciesQuery } from '../../dataHooks/useOrganizationShareCasePoliciesQuery';
import { useOrganizationMapQuery } from '../../dataHooks/useOrganizationsQuery';
import { useArray } from '../../hooks/useArray';
import { EffectiveRightsUtil } from '../../utils/EffectiveRightsUtil';
import { LoadableUtil } from '../../utils/LoadableUtil';
import { StringUtil } from '../../utils/StringUtil';
import { TestIdUtil } from '../../utils/TestIdUtil';

echarts.use([TooltipComponent, CanvasRenderer, GraphChart]);

type AccessLink = {
  accessPolicyCount: number;
  accessRights: AccessRightsSummary;
  dataCollectionName: string;
  lineStyle: NonNullable<GraphSeriesOption['lineStyle']>;
  linkType: 'access';
  organizationName: string;
  sharePolicyCount: number;
  source: string;
  sourceDataCollectionNames: string[];
  target: string;
  value: number;
};

type AccessRightsSummary = Pick<OrganizationAccessCasePolicy, 'add_case_set' | 'add_case' | 'is_private' | 'read_case_set' | 'remove_case_set' | 'remove_case' | 'write_case_set'>;

type Category = {
  name: string;
};

type Graph = {
  categories: Category[];
  links: Link[];
  nodes: Node[];
  totalAccessLinks: number;
  totalDataCollections: number;
  totalOrganizations: number;
  totalShareLinks: number;
  zoom: number;
};

type GraphTooltipParams = {
  data: Link | Node;
  dataType?: 'edge' | 'node';
};

type Link = AccessLink | ShareLink;

type Node = {
  accessLinkCount: number;
  category: number;
  id: string;
  itemStyle: {
    borderColor: string;
    borderWidth: number;
    color: string;
  };
  label: NonNullable<GraphSeriesOption['label']>;
  name: string;
  nodeType: 'dataCollection' | 'organization';
  shareInCount: number;
  shareOutCount: number;
  symbol: 'circle' | 'roundRect';
  symbolSize: number;
  value: number;
  x: number;
  y: number;
};

type SelectionOption = {
  label: string;
  value: string;
};

type SelectionType = 'dataCollection' | 'organization';

type ShareLink = {
  lineStyle: NonNullable<GraphSeriesOption['lineStyle']>;
  linkType: 'share';
  organizationNames: string[];
  sharePolicyCount: number;
  source: string;
  sourceDataCollectionName: string;
  target: string;
  targetDataCollectionName: string;
  value: number;
};

const EMPTY_GRAPH: Graph = {
  categories: [],
  links: [],
  nodes: [],
  totalAccessLinks: 0,
  totalDataCollections: 0,
  totalOrganizations: 0,
  totalShareLinks: 0,
  zoom: 1,
};

const GRAPH_LAYOUT = {
  bottomPadding: 72,
  fitZoomSafetyFactor: 0.94,
  labelPadding: 12,
  nodeLabelWidth: 220,
  organizationX: 120,
  rowGap: 68,
  singleRowVerticalOffset: 96,
  sourceDataCollectionX: 1060,
  targetAndSourceDataCollectionX: 820,
  targetDataCollectionX: 620,
  topPadding: 72,
  viewportHorizontalPadding: 24,
  viewportVerticalPadding: 24,
} as const;

export const DataCollectionVisualizationPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectionType, setSelectionType] = useState<SelectionType>('organization');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(null);
  const dataCollectionMapQuery = useDataCollectionsMapQuery();
  const organizationMapQuery = useOrganizationMapQuery();
  const organizationAccessCasePoliciesQuery = useOrganizationAccessCasePoliciesQuery(policies => policies.filter(policy => policy.is_active));
  const organizationShareCasePoliciesQuery = useOrganizationShareCasePoliciesQuery(policies => policies.filter(policy => policy.is_active));

  const loadables = useArray([
    dataCollectionMapQuery,
    organizationMapQuery,
    organizationAccessCasePoliciesQuery,
    organizationShareCasePoliciesQuery,
  ]);

  const organizationOptions = useMemo<SelectionOption[]>(() => {
    return Array.from(organizationMapQuery.map.values())
      .map(organization => ({
        label: organization.name,
        value: organization.id,
      }))
      .sort((a, b) => StringUtil.advancedSortComperator(a.label, b.label));
  }, [organizationMapQuery.map]);

  const dataCollectionOptions = useMemo<SelectionOption[]>(() => {
    return Array.from(dataCollectionMapQuery.map.values())
      .map(dataCollection => ({
        label: dataCollection.name,
        value: dataCollection.id,
      }))
      .sort((a, b) => StringUtil.advancedSortComperator(a.label, b.label));
  }, [dataCollectionMapQuery.map]);

  const selectionOptions = useMemo(() => {
    return selectionType === 'organization' ? organizationOptions : dataCollectionOptions;
  }, [dataCollectionOptions, organizationOptions, selectionType]);

  const selectedOption = useMemo(() => {
    return selectionOptions.find(option => option.value === selectedEntityId) ?? null;
  }, [selectedEntityId, selectionOptions]);

  const selectionLabel = selectionType === 'organization' ? t`Organization` : t`Data collection`;
  const hasSelection = !!selectedEntityId;

  const onSelectionTypeChange = useCallback((_event: ReactMouseEvent<HTMLElement>, nextSelectionType: null | SelectionType) => {
    if (!nextSelectionType || nextSelectionType === selectionType) {
      return;
    }

    setSelectionType(nextSelectionType);
    setSelectedEntityId(null);
  }, [selectionType]);

  const getSelectionOptionLabel = useCallback((option: SelectionOption) => {
    return option.label;
  }, []);

  const isSelectionOptionEqualToValue = useCallback((option: SelectionOption, value: SelectionOption) => {
    return option.value === value.value;
  }, []);

  const onSelectionChange = useCallback((_event: SyntheticEvent, nextOption: null | SelectionOption) => {
    setSelectedEntityId(nextOption?.value ?? null);
  }, []);

  const renderSelectionInput = useCallback((params: AutocompleteRenderInputParams) => {
    return (
      <TextField
        {...params}
        label={selectionLabel}
        required
        size={'small'}
      />
    );
  }, [selectionLabel]);

  const graph = useMemo<Graph>(() => {
    if (LoadableUtil.isSomeLoading(loadables)) {
      return EMPTY_GRAPH;
    }

    if (!selectedEntityId) {
      return EMPTY_GRAPH;
    }

    const categories: Category[] = [
      {
        name: t`Organization`,
      },
      {
        name: t`Data collection`,
      },
    ];

    const organizationNodeColor = theme.palette.primary.main;
    const organizationNodeBorderColor = theme.palette.primary.dark;
    const dataCollectionNodeColor = theme.palette.secondary.main;
    const dataCollectionNodeBorderColor = theme.palette.secondary.dark;
    const accessLinkColor = theme.palette.primary.light;
    const shareLinkColor = theme.palette.warning.main;

    const policyGroups = EffectiveRightsUtil.getOrganizationPolicyGroups({
      organizationAccessCasePolicies: organizationAccessCasePoliciesQuery.data,
      organizationShareCasePolicies: organizationShareCasePoliciesQuery.data,
    });

    const filteredPolicyGroups = policyGroups.filter(policyGroup => {
      if (selectionType === 'organization') {
        return policyGroup.organization_id === selectedEntityId;
      }

      return policyGroup.data_collection_id === selectedEntityId
        || policyGroup.share_case_policies.some(policy => policy.from_data_collection_id === selectedEntityId);
    });

    const nodesById = new Map<string, Omit<Node, 'accessLinkCount' | 'label' | 'shareInCount' | 'shareOutCount' | 'symbolSize' | 'value' | 'x' | 'y'>>();
    const nodeStats = new Map<string, Pick<Node, 'accessLinkCount' | 'shareInCount' | 'shareOutCount'>>();
    const accessLinks: AccessLink[] = [];
    const shareLinksByKey = new Map<string, {
      organizationNames: Set<string>;
      sharePolicyCount: number;
      source: string;
      sourceDataCollectionName: string;
      target: string;
      targetDataCollectionName: string;
    }>();

    const buildNodeLabel = (position: 'left' | 'right'): Node['label'] => {
      return {
        color: theme.palette.text.primary,
        distance: 8,
        fontSize: 12,
        formatter: '{b}',
        overflow: 'truncate',
        position,
        show: true,
        width: GRAPH_LAYOUT.nodeLabelWidth,
      };
    };

    const ensureNode = (params: {
      borderColor: string;
      category: number;
      color: string;
      id: string;
      name: string;
      nodeType: Node['nodeType'];
      symbol: Node['symbol'];
    }) => {
      if (nodesById.has(params.id)) {
        return;
      }

      nodesById.set(params.id, {
        category: params.category,
        id: params.id,
        itemStyle: {
          borderColor: params.borderColor,
          borderWidth: 1.5,
          color: params.color,
        },
        name: params.name,
        nodeType: params.nodeType,
        symbol: params.symbol,
      });
    };

    const incrementNodeStat = (nodeId: string, key: keyof Pick<Node, 'accessLinkCount' | 'shareInCount' | 'shareOutCount'>) => {
      const currentStats = nodeStats.get(nodeId) ?? {
        accessLinkCount: 0,
        shareInCount: 0,
        shareOutCount: 0,
      };

      currentStats[key] += 1;
      nodeStats.set(nodeId, currentStats);
    };

    filteredPolicyGroups.forEach(policyGroup => {
      const organizationNodeId = `organization:${policyGroup.organization_id}`;
      const targetDataCollectionNodeId = `dataCollection:${policyGroup.data_collection_id}`;
      const organizationName = organizationMapQuery.map.get(policyGroup.organization_id)?.name ?? policyGroup.organization_id;
      const targetDataCollectionName = dataCollectionMapQuery.map.get(policyGroup.data_collection_id)?.name ?? policyGroup.data_collection_id;
      const sourceDataCollectionNames = Array.from(new Set(policyGroup.share_case_policies.map(policy => dataCollectionMapQuery.map.get(policy.from_data_collection_id)?.name ?? policy.from_data_collection_id))).sort();

      const accessRights = policyGroup.access_case_policies.reduce<AccessRightsSummary>((summary, policy) => {
        return {
          add_case: summary.add_case || policy.add_case,
          add_case_set: summary.add_case_set || policy.add_case_set,
          is_private: summary.is_private || policy.is_private,
          read_case_set: summary.read_case_set || policy.read_case_set,
          remove_case: summary.remove_case || policy.remove_case,
          remove_case_set: summary.remove_case_set || policy.remove_case_set,
          write_case_set: summary.write_case_set || policy.write_case_set,
        };
      }, {
        add_case: false,
        add_case_set: false,
        is_private: false,
        read_case_set: false,
        remove_case: false,
        remove_case_set: false,
        write_case_set: false,
      });

      ensureNode({
        borderColor: organizationNodeBorderColor,
        category: 0,
        color: organizationNodeColor,
        id: organizationNodeId,
        name: organizationName,
        nodeType: 'organization',
        symbol: 'roundRect',
      });
      ensureNode({
        borderColor: dataCollectionNodeBorderColor,
        category: 1,
        color: dataCollectionNodeColor,
        id: targetDataCollectionNodeId,
        name: targetDataCollectionName,
        nodeType: 'dataCollection',
        symbol: 'circle',
      });

      accessLinks.push({
        accessPolicyCount: policyGroup.access_case_policies.length,
        accessRights,
        dataCollectionName: targetDataCollectionName,
        lineStyle: {
          color: accessLinkColor,
          curveness: 0.08,
          opacity: 0.5,
          width: 1.5 + Math.min(policyGroup.access_case_policies.length * 0.35, 1.5),
        },
        linkType: 'access',
        organizationName,
        sharePolicyCount: policyGroup.share_case_policies.length,
        source: organizationNodeId,
        sourceDataCollectionNames,
        target: targetDataCollectionNodeId,
        value: Math.max(policyGroup.access_case_policies.length, 1),
      });

      incrementNodeStat(organizationNodeId, 'accessLinkCount');
      incrementNodeStat(targetDataCollectionNodeId, 'accessLinkCount');

      policyGroup.share_case_policies.forEach(sharePolicy => {
        const sourceDataCollectionNodeId = `dataCollection:${sharePolicy.from_data_collection_id}`;
        const sourceDataCollectionName = dataCollectionMapQuery.map.get(sharePolicy.from_data_collection_id)?.name ?? sharePolicy.from_data_collection_id;
        const shareLinkKey = `${sourceDataCollectionNodeId}::${targetDataCollectionNodeId}`;
        const existingShareLink = shareLinksByKey.get(shareLinkKey);

        ensureNode({
          borderColor: dataCollectionNodeBorderColor,
          category: 1,
          color: dataCollectionNodeColor,
          id: sourceDataCollectionNodeId,
          name: sourceDataCollectionName,
          nodeType: 'dataCollection',
          symbol: 'circle',
        });

        if (existingShareLink) {
          existingShareLink.organizationNames.add(organizationName);
          existingShareLink.sharePolicyCount += 1;
          return;
        }

        shareLinksByKey.set(shareLinkKey, {
          organizationNames: new Set([organizationName]),
          sharePolicyCount: 1,
          source: sourceDataCollectionNodeId,
          sourceDataCollectionName,
          target: targetDataCollectionNodeId,
          targetDataCollectionName,
        });
      });
    });

    const shareLinks = Array.from(shareLinksByKey.values()).map(shareLink => {
      incrementNodeStat(shareLink.source, 'shareOutCount');
      incrementNodeStat(shareLink.target, 'shareInCount');

      return {
        lineStyle: {
          color: shareLinkColor,
          curveness: 0.28,
          opacity: 0.45,
          type: 'dashed',
          width: 1.25 + Math.min(shareLink.sharePolicyCount * 0.3, 1.25),
        },
        linkType: 'share',
        organizationNames: Array.from(shareLink.organizationNames).sort(),
        sharePolicyCount: shareLink.sharePolicyCount,
        source: shareLink.source,
        sourceDataCollectionName: shareLink.sourceDataCollectionName,
        target: shareLink.target,
        targetDataCollectionName: shareLink.targetDataCollectionName,
        value: Math.max(shareLink.sharePolicyCount, 1),
      } satisfies ShareLink;
    });

    const rawNodes = Array.from(nodesById.values())
      .map(node => {
        const stats = nodeStats.get(node.id) ?? {
          accessLinkCount: 0,
          shareInCount: 0,
          shareOutCount: 0,
        };
        const totalConnections = stats.accessLinkCount + stats.shareInCount + stats.shareOutCount;

        return {
          ...node,
          accessLinkCount: stats.accessLinkCount,
          label: buildNodeLabel('right'),
          shareInCount: stats.shareInCount,
          shareOutCount: stats.shareOutCount,
          symbolSize: node.nodeType === 'organization'
            ? Math.min(22 + (stats.accessLinkCount * 2), 34)
            : Math.min(18 + (totalConnections * 1.5), 30),
          value: totalConnections,
          x: 0,
          y: 0,
        } satisfies Node;
      });

    const getDataCollectionLayoutRank = (node: Node) => {
      if (node.accessLinkCount > 0 && node.shareOutCount > 0) {
        return 1;
      }
      if (node.accessLinkCount > 0) {
        return 0;
      }
      return 2;
    };

    const getDataCollectionX = (node: Node) => {
      if (node.accessLinkCount > 0 && node.shareOutCount > 0) {
        return GRAPH_LAYOUT.targetAndSourceDataCollectionX;
      }
      if (node.accessLinkCount > 0) {
        return GRAPH_LAYOUT.targetDataCollectionX;
      }
      return GRAPH_LAYOUT.sourceDataCollectionX;
    };

    const getDataCollectionLabelPosition = (node: Node): 'left' | 'right' => {
      return node.accessLinkCount > 0 && node.shareOutCount === 0 ? 'left' : 'right';
    };

    const isSingleNodePair = rawNodes.filter(node => node.nodeType === 'organization').length === 1
      && rawNodes.filter(node => node.nodeType === 'dataCollection').length === 1;

    const organizationNodes = rawNodes
      .filter(node => node.nodeType === 'organization')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((node, index) => {
        return {
          ...node,
          label: buildNodeLabel('right'),
          x: GRAPH_LAYOUT.organizationX,
          y: GRAPH_LAYOUT.topPadding + (index * GRAPH_LAYOUT.rowGap),
        } satisfies Node;
      });

    const dataCollectionNodes = rawNodes
      .filter(node => node.nodeType === 'dataCollection')
      .sort((a, b) => {
        const rankDifference = getDataCollectionLayoutRank(a) - getDataCollectionLayoutRank(b);
        if (rankDifference !== 0) {
          return rankDifference;
        }
        return a.name.localeCompare(b.name);
      })
      .map((node, index) => {
        return {
          ...node,
          label: buildNodeLabel(getDataCollectionLabelPosition(node)),
          x: getDataCollectionX(node),
          y: GRAPH_LAYOUT.topPadding + (index * GRAPH_LAYOUT.rowGap) + (isSingleNodePair ? GRAPH_LAYOUT.singleRowVerticalOffset : 0),
        } satisfies Node;
      });

    const nodes = [...organizationNodes, ...dataCollectionNodes];
    const nodeBounds = nodes.reduce((bounds, node) => {
      return {
        maxX: Math.max(bounds.maxX, node.x),
        maxY: Math.max(bounds.maxY, node.y),
        minX: Math.min(bounds.minX, node.x),
        minY: Math.min(bounds.minY, node.y),
      };
    }, {
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
    });

    const contentBounds = nodes.reduce((bounds, node) => {
      const halfSymbolSize = node.symbolSize / 2;
      const labelPadding = GRAPH_LAYOUT.nodeLabelWidth + GRAPH_LAYOUT.labelPadding;
      const labelPosition = node.label.position === 'left' ? 'left' : 'right';

      return {
        maxX: Math.max(bounds.maxX, node.x + halfSymbolSize + (labelPosition === 'right' ? labelPadding : 0)),
        maxY: Math.max(bounds.maxY, node.y + halfSymbolSize + GRAPH_LAYOUT.viewportVerticalPadding),
        minX: Math.min(bounds.minX, node.x - halfSymbolSize - (labelPosition === 'left' ? labelPadding : 0)),
        minY: Math.min(bounds.minY, node.y - halfSymbolSize - GRAPH_LAYOUT.viewportVerticalPadding),
      };
    }, {
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
    });

    const nodeWidth = Math.max(nodeBounds.maxX - nodeBounds.minX, 1);
    const nodeHeight = Math.max(nodeBounds.maxY - nodeBounds.minY, 1);
    const contentWidth = Math.max(contentBounds.maxX - contentBounds.minX, 1);
    const contentHeight = Math.max(contentBounds.maxY - contentBounds.minY, 1);
    const zoom = Math.max(
      Math.min(
        (nodeWidth / contentWidth),
        (nodeHeight / contentHeight),
        1,
      ) * GRAPH_LAYOUT.fitZoomSafetyFactor,
      0.1,
    );

    return {
      categories,
      links: [...accessLinks, ...shareLinks],
      nodes,
      totalAccessLinks: accessLinks.length,
      totalDataCollections: dataCollectionNodes.length,
      totalOrganizations: organizationNodes.length,
      totalShareLinks: shareLinks.length,
      zoom,
    } satisfies Graph;
  }, [dataCollectionMapQuery.map, loadables, organizationAccessCasePoliciesQuery.data, organizationMapQuery.map, organizationShareCasePoliciesQuery.data, selectedEntityId, selectionType, t, theme.palette.primary.dark, theme.palette.primary.light, theme.palette.primary.main, theme.palette.secondary.dark, theme.palette.secondary.main, theme.palette.text.primary, theme.palette.warning.main]);

  const formatAccessRights = useCallback((accessRights: AccessRightsSummary) => {
    const enabledRights = [
      accessRights.add_case ? t`Add case` : null,
      accessRights.remove_case ? t`Remove case` : null,
      accessRights.add_case_set ? t`Add case set` : null,
      accessRights.remove_case_set ? t`Remove case set` : null,
      accessRights.read_case_set ? t`Read case set` : null,
      accessRights.write_case_set ? t`Write case set` : null,
      accessRights.is_private ? t`Private` : null,
    ].filter((value): value is string => !!value);

    return enabledRights.length > 0 ? enabledRights.join(', ') : t`None`;
  }, [t]);

  const formatList = useCallback((items: string[]) => {
    return items.length > 0 ? items.join(', ') : t`None`;
  }, [t]);

  const getOptions = useCallback(() => {
    return {
      animation: false,
      series: [
        {
          bottom: GRAPH_LAYOUT.viewportVerticalPadding,
          categories: graph.categories,
          center: ['50%', '50%'],
          data: graph.nodes,
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: 8,
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 3,
            },
          },
          layout: 'none',
          left: GRAPH_LAYOUT.viewportHorizontalPadding,
          lineStyle: {
            opacity: 0.45,
          },
          links: graph.links,
          right: GRAPH_LAYOUT.viewportHorizontalPadding,
          roam: true,
          roamTrigger: 'global',
          scaleLimit: {
            max: 4,
            min: 0.1,
          },
          top: GRAPH_LAYOUT.viewportVerticalPadding,
          type: 'graph',
          zoom: graph.zoom,
        } satisfies GraphSeriesOption,
      ],
      tooltip: {
        formatter: (params: unknown) => {
          const typedParams = params as GraphTooltipParams;

          if (typedParams.dataType === 'node') {
            const node = typedParams.data as Node;

            if (node.nodeType === 'organization') {
              return [
                `<strong>${node.name}</strong>`,
                `${t('Accessible data collections')}: ${node.accessLinkCount}`,
                `${t('Connected share routes')}: ${node.shareInCount + node.shareOutCount}`,
              ].join('<br/>');
            }

            return [
              `<strong>${node.name}</strong>`,
              `${t('Organization access links')}: ${node.accessLinkCount}`,
              `${t('Incoming share routes')}: ${node.shareInCount}`,
              `${t('Outgoing share routes')}: ${node.shareOutCount}`,
            ].join('<br/>');
          }

          const link = typedParams.data as Link;

          if (link.linkType === 'access') {
            return [
              `<strong>${link.organizationName} -> ${link.dataCollectionName}</strong>`,
              `${t('Type')}: ${t`Organization access`}`,
              `${t('Active access policies')}: ${link.accessPolicyCount}`,
              `${t('Enabled access rights')}: ${formatAccessRights(link.accessRights)}`,
              `${t('Share source collections')}: ${formatList(link.sourceDataCollectionNames)}`,
            ].join('<br/>');
          }

          return [
            `<strong>${link.sourceDataCollectionName} -> ${link.targetDataCollectionName}</strong>`,
            `${t('Type')}: ${t`Organization share`}`,
            `${t('Active share policies')}: ${link.sharePolicyCount}`,
            `${t('Organizations')}: ${formatList(link.organizationNames)}`,
          ].join('<br/>');
        },
      },
    } satisfies EChartsOption;
  }, [formatAccessRights, formatList, graph.categories, graph.links, graph.nodes, graph.zoom, t]);

  return (
    <PageContainer
      fullHeight
      fullWidth
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('DataCollectionVisualizationPage')}
      title={t`Data collection visualization`}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateRows: 'auto minmax(0, 1fr)',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <ResponseHandler
          loadables={loadables}
        >
          <Box
            sx={{
              borderRadius: 2,
              display: 'grid',
              gap: 2,
              px: 2,
              py: 2,
            }}
          >
            <Box
              sx={{
                alignItems: 'end',
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  md: 'max-content minmax(320px, 520px)',
                  xs: '1fr',
                },
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gap: 0.75,
                }}
              >
                <Typography
                  color={'text.secondary'}
                  variant={'overline'}
                >
                  {t`Type`}
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  onChange={onSelectionTypeChange}
                  size={'small'}
                  value={selectionType}
                >
                  <ToggleButton value={'organization'}>
                    {t`Organization`}
                  </ToggleButton>
                  <ToggleButton value={'dataCollection'}>
                    {t`Data collection`}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Autocomplete
                disablePortal
                getOptionLabel={getSelectionOptionLabel}
                isOptionEqualToValue={isSelectionOptionEqualToValue}
                noOptionsText={t`No results`}
                onChange={onSelectionChange}
                options={selectionOptions}
                renderInput={renderSelectionInput}
                value={selectedOption}
              />
            </Box>
            {hasSelection ? (
              <Box
                sx={{
                  color: 'text.secondary',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box component={'span'}>
                  {t('Organizations: {{count}}', { count: graph.totalOrganizations })}
                </Box>
                <Box component={'span'}>
                  {t('Data collections: {{count}}', { count: graph.totalDataCollections })}
                </Box>
                <Box component={'span'}>
                  {t('Access links: {{count}}', { count: graph.totalAccessLinks })}
                </Box>
                <Box component={'span'}>
                  {t('Share routes: {{count}}', { count: graph.totalShareLinks })}
                </Box>
                <Box component={'span'}>
                  {t`Solid links show organization access policies. Dashed links show sharing routes between data collections.`}
                </Box>
              </Box>
            ) : (
              <Typography color={'text.secondary'}>
                {t`Select an organization or data collection to show the visualization.`}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              borderRadius: 2,
              height: '100%',
              minHeight: 0,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            {hasSelection && graph.nodes.length > 0 ? (
              <EChartsReact
                echarts={echarts}
                notMerge
                option={getOptions()}
                style={{
                  height: '100%',
                  width: '100%',
                }}
              />
            ) : (
              <Box
                sx={{
                  color: 'text.secondary',
                  display: 'grid',
                  height: '100%',
                  placeItems: 'center',
                  px: 3,
                  textAlign: 'center',
                }}
              >
                {hasSelection
                  ? t`No active organization access or share policies are available to visualize.`
                  : t`Select an organization or data collection to show the visualization.`}
              </Box>
            )}
          </Box>
        </ResponseHandler>
      </Box>
    </PageContainer>
  );
};
