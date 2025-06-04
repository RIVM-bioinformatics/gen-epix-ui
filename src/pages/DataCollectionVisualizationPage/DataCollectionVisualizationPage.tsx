import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import type { EChartsReactProps } from 'echarts-for-react';
import EChartsReact from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import {
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';

import { PageContainer } from '../../components/ui/PageContainer';
import { ResponseHandler } from '../../components/ui/ResponseHandler';
import { useDataCollections } from '../../dataHooks/useDataCollections';
import { useOrganizationMap } from '../../dataHooks/useOrganizations';
import { TestIdUtil } from '../../utils/TestIdUtil';


echarts.use([TooltipComponent, LegendComponent, CanvasRenderer]);

type Node = {
  id: string;
  name: string;
  symbolSize: number;
  x: number;
  y: number;
  value: number;
  category: number;
};

type Links = {
  source: string;
  target: string;
};

type Category = {
  name: string;
};

type Graph = {
  nodes: Node[];
  links: Links[];
  categories: Category[];
};

const DataCollectionVisualizationPageContent = () => {
  const dataCollections = useDataCollections();
  const organizationMap = useOrganizationMap();

  const loadables = useMemo(() => [
    dataCollections,
    organizationMap,
  ], [dataCollections, organizationMap]);

  const chartRef = useRef<EChartsReact>(null);

  const events = useMemo<EChartsReactProps['onEvents']>(() => {
    return {
      click: (event: unknown) => {
        console.log(event);
      },
    };
  }, []);

  const graph = useMemo<Graph>(() => {
    if (loadables.some((loadable) => loadable.isLoading)) {
      return {
        categories: [],
        links: [],
        nodes: [],
      };
    }

    const categories: Category[] = [
      {
        name: 'Data Collection',
      },
      {
        name: 'Organization',
      },
    ];

    const dataCollectionNodes: Node[] = [];
    const dataCollectionsLinks: Links[] = [];

    const organizationNodes: Node[] = [];
    const organizationLinks: Links[] = [];
    const numDataCollectionSourceLinks: { [key: string]: number } = {};
    const numOrganizationPolicies: { [key: string]: number } = {};

    // organizationDataCollectionPolicies.data?.forEach((organizationDataCollectionPolicy) => {
    //   // dataCollectionsLinks.push({
    //   //   source: organizationDataCollectionPolicy.source_data_collection_id,
    //   //   target: organizationDataCollectionPolicy.data_collection_id,
    //   // });
    //   organizationLinks.push({
    //     source: organizationDataCollectionPolicy.organization_id,
    //     target: organizationDataCollectionPolicy.data_collection_id,
    //   });

    //   if (!numDataCollectionSourceLinks[organizationDataCollectionPolicy.data_collection_id]) {
    //     numDataCollectionSourceLinks[organizationDataCollectionPolicy.data_collection_id] = 0;
    //   }
    //   numDataCollectionSourceLinks[organizationDataCollectionPolicy.data_collection_id]++;

    //   if (!numOrganizationPolicies[organizationDataCollectionPolicy.organization_id]) {
    //     numOrganizationPolicies[organizationDataCollectionPolicy.organization_id] = 0;
    //   }
    //   numOrganizationPolicies[organizationDataCollectionPolicy.organization_id]++;
    // });

    Object.entries(numOrganizationPolicies).forEach(([organizationId, numPolicies]) => {
      organizationNodes.push({
        id: organizationId,
        name: organizationMap.map.get(organizationId)?.name || 'Unknown',
        symbolSize: 15 + (numPolicies * 0.5),
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        value: 1,
        category: 1,
      });
    });

    dataCollections.data?.forEach((dataCollection) => {
      dataCollectionNodes.push({
        id: dataCollection.id,
        name: dataCollection.name,
        symbolSize: 15 + ((numDataCollectionSourceLinks[dataCollection.id] || 1) * 1.5),
        x: 1000 + Math.random() * 1000,
        y: Math.random() * 1000,
        value: 1,
        category: 0,
      });
    });

    return {
      categories,
      links: [...dataCollectionsLinks, ...organizationLinks],
      nodes: [...dataCollectionNodes, ...organizationNodes],
    } satisfies Graph;
  }, [dataCollections.data, loadables, organizationMap.map]);

  const getOptions = useCallback(() => {
    return {
      tooltip: {},
      legend: [
        {
          // selectedMode: 'single',
          data: graph.categories.map((a) => a.name),
        },
      ],
      animationDuration: 1500,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          // name: 'Les Miserables',
          type: 'graph',
          legendHoverLink: false,
          layout: 'none',
          data: graph.nodes,
          links: graph.links,
          categories: graph.categories,
          roam: true,
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
          },
          labelLayout: {
            hideOverlap: true,
          },
          lineStyle: {
            color: 'source',
            curveness: 0.3,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 10,
            },
          },
        },
      ],
    };
  }, [graph.categories, graph.links, graph.nodes]);

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateRows: 'auto max-content',
        height: '100%',
      }}
    >
      <ResponseHandler
        loadables={loadables}
      >
        <EChartsReact
          echarts={echarts}
          notMerge
          onEvents={events}
          option={getOptions()}
          ref={chartRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}
        />
      </ResponseHandler>
    </Box>
  );
};

export const DataCollectionVisualizationPage = () => {
  const [t] = useTranslation();

  return (
    <PageContainer
      showBreadcrumbs
      testIdAttributes={TestIdUtil.createAttributes('DataCollectionVisualizationPage')}
      title={t`Data collection visualization`}
    >
      <DataCollectionVisualizationPageContent />
    </PageContainer>
  );
};
