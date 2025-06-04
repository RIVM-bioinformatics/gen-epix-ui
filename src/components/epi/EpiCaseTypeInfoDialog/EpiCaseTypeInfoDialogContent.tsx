import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  useContext,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import type { EpiCaseTypeAbacContextValue } from '../../../context/epiCaseTypeAbac';
import { EpiCaseTypeAbacProvider } from '../../../context/epiCaseTypeAbac';
import {
  useDataCollectionsMap,
  useDataCollections,
} from '../../../dataHooks/useDataCollections';
import { useDiseasesMap } from '../../../dataHooks/useDiseases';
import { useEtiologicalAgentsMap } from '../../../dataHooks/useEtiologicalAgents';
import { EpiStoreContext } from '../../../stores/epiStore';
import { MarkdownContent } from '../../ui/MarkdownContent';
import { ResponseHandler } from '../../ui/ResponseHandler';

import { EpiCaseTypeInfoValues } from './EpiCaseTypeInfoValues';
import { EpiCaseTypeInfoTrees } from './EpiCaseTypeInfoTrees';
import { EpiCaseTypeInfoRegions } from './EpiCaseTypeInfoRegions';
import { EpiCaseTypeInfoData } from './EpiCaseTypeInfoData';
import { EpiCaseTypeInfoAccessRights } from './EpiCaseTypeInfoAccessRights';

export type EpiCaseTypeInfoDialogContentProps = {
  readonly onTitleChange: (title: string) => void;
};

export const EpiCaseTypeInfoDialogContent = ({ onTitleChange }: EpiCaseTypeInfoDialogContentProps) => {
  const [t] = useTranslation();
  const theme = useTheme();
  const diseasesMap = useDiseasesMap();
  const etiologicalAgentsMap = useEtiologicalAgentsMap();
  const dataCollectionsMapQuery = useDataCollectionsMap();
  const dataCollectionsQuery = useDataCollections();
  const loadables = useMemo(() => [dataCollectionsMapQuery, dataCollectionsQuery, diseasesMap, etiologicalAgentsMap], [dataCollectionsMapQuery, dataCollectionsQuery, diseasesMap, etiologicalAgentsMap]);

  const epiStore = useContext(EpiStoreContext);
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);

  const getDiseaseName = useCallback((id: string) => {
    if (!id || !diseasesMap.map.has(id)) {
      return undefined;
    }
    const disease = diseasesMap.map.get(id);
    const code = disease.icd_code ? ` (ICD Code: ${disease.icd_code})` : '';

    return `${disease.name}${code}`;
  }, [diseasesMap.map]);

  const getEtiologicalAgentName = useCallback((id: string) => {
    if (!id || !etiologicalAgentsMap.map.has(id)) {
      return undefined;
    }
    const etiologicalAgent = etiologicalAgentsMap.map.get(id);

    return `${etiologicalAgent.name} (${etiologicalAgent.type})`;
  }, [etiologicalAgentsMap.map]);

  useEffect(() => {
    onTitleChange(completeCaseType.name);
  }, [completeCaseType.name, onTitleChange]);

  const caseTypeAbacContextValue = useMemo<EpiCaseTypeAbacContextValue>(() => {
    return {
      userDataCollections: dataCollectionsQuery.data,
      userDataCollectionsMap: dataCollectionsMapQuery.map,
      caseTypeAccessAbacDict: completeCaseType.case_type_access_abacs,
    };
  }, [completeCaseType.case_type_access_abacs, dataCollectionsMapQuery.map, dataCollectionsQuery.data]);

  return (
    <ResponseHandler
      loadables={loadables}
      shouldHideActionButtons
    >
      <EpiCaseTypeAbacProvider caseTypeAbac={caseTypeAbacContextValue}>
        <Box
          sx={{
            '& dl': {
              margin: 0,
            },
            '& dt': {
              fontWeight: 'bold',
            },
            '& dd': {
              marginLeft: theme.spacing(1),
            },
          }}
        >
          <Box marginBottom={1}>
            <MarkdownContent source={completeCaseType?.description || t`No description available`} />
          </Box>

          <EpiCaseTypeInfoData
            name={getDiseaseName(completeCaseType.disease_id)}
            title={t`Disease`}
          />

          <EpiCaseTypeInfoData
            name={getEtiologicalAgentName(completeCaseType.etiological_agent_id)}
            title={t`Etiological agent`}
          />

          <Box marginY={3}>
            <Typography
              component={'h4'}
              marginY={1}
              variant={'h4'}
            >
              {t`Variables by dimension`}
            </Typography>
            <EpiCaseTypeInfoValues
              completeCaseType={completeCaseType}
            />
          </Box>

          <Box marginY={3}>
            <Typography
              component={'h4'}
              marginY={1}
              variant={'h4'}
            >
              {t`Trees`}
            </Typography>
            <EpiCaseTypeInfoTrees
              completeCaseType={completeCaseType}
            />
          </Box>

          <Box marginY={3}>
            <Typography
              component={'h4'}
              marginY={1}
              variant={'h4'}
            >
              {t`Regions`}
            </Typography>
            <EpiCaseTypeInfoRegions
              completeCaseType={completeCaseType}
            />
          </Box>

          <Box marginY={3}>
            <Typography
              component={'h4'}
              marginY={1}
              variant={'h4'}
            >
              {t`Access rights`}
            </Typography>
            <EpiCaseTypeInfoAccessRights
              completeCaseType={completeCaseType}
            />
          </Box>
        </Box>
      </EpiCaseTypeAbacProvider>
    </ResponseHandler>
  );
};
