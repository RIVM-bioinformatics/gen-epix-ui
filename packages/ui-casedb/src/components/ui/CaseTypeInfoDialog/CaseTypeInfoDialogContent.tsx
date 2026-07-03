import {
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import type { WithDialogRenderProps } from '@gen-epix/ui';
import {
  ResponseHandler,
  RichTextEditorContent,
  useArray,
} from '@gen-epix/ui';

import type { CaseTypeAbacContext } from '../../../context/caseTypeAbac';
import { CaseTypeAbacContextProvider } from '../../../context/caseTypeAbac';
import {
  useDataCollectionsMapQuery,
  useDataCollectionsQuery,
} from '../../../dataHooks/useDataCollectionsQuery';
import { useDiseasesMapQuery } from '../../../dataHooks/useDiseasesQuery';
import { useEtiologicalAgentsMapQuery } from '../../../dataHooks/useEtiologicalAgentsQuery';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

import { CaseTypeInfoValues } from './CaseTypeInfoValues';
import { CaseTypeInfoTrees } from './CaseTypeInfoTrees';
import { CaseTypeInfoRegions } from './CaseTypeInfoRegions';
import { CaseTypeInfoData } from './CaseTypeInfoData';
import { CaseTypeInfoAccessRights } from './CaseTypeInfoAccessRights';

export type CaseTypeInfoDialogContentProps = Pick<WithDialogRenderProps, 'onPermalinkChange' | 'onTitleChange'>;

export const CaseTypeInfoDialogContent = ({ onPermalinkChange, onTitleChange }: CaseTypeInfoDialogContentProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const diseasesMapQuery = useDiseasesMapQuery();
  const etiologicalAgentsMapQuery = useEtiologicalAgentsMapQuery();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const dataCollectionsQuery = useDataCollectionsQuery();
  const loadables = useArray([dataCollectionsMapQuery, dataCollectionsQuery, diseasesMapQuery, etiologicalAgentsMapQuery]);

  const dashboardStore = use(DashboardStoreContext);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);

  const getDiseaseName = useCallback((id: string) => {
    if (!id || !diseasesMapQuery.map.has(id)) {
      return undefined;
    }
    const disease = diseasesMapQuery.map.get(id);
    const code = disease.icd_code ? ` (ICD Code: ${disease.icd_code})` : '';

    return `${disease.name}${code}`;
  }, [diseasesMapQuery.map]);

  const getEtiologicalAgentName = useCallback((id: string) => {
    if (!id || !etiologicalAgentsMapQuery.map.has(id)) {
      return undefined;
    }
    const etiologicalAgent = etiologicalAgentsMapQuery.map.get(id);

    return `${etiologicalAgent.name} (${etiologicalAgent.type})`;
  }, [etiologicalAgentsMapQuery.map]);

  useEffect(() => {
    onTitleChange(completeCaseType.name);
  }, [completeCaseType.name, onTitleChange]);

  useEffect(() => {
    if (completeCaseType) {
      onPermalinkChange(CaseTypeUtil.createCaseTypeLink(completeCaseType, true));
    }
  }, [completeCaseType.name, completeCaseType.id, onPermalinkChange, completeCaseType]);

  const caseTypeAbacContextValue = useMemo<CaseTypeAbacContext>(() => {
    return {
      caseTypeAccessAbacDict: completeCaseType.case_type_access_abacs,
      userDataCollections: dataCollectionsQuery.data,
      userDataCollectionsMap: dataCollectionsMapQuery.map,
    };
  }, [completeCaseType.case_type_access_abacs, dataCollectionsMapQuery.map, dataCollectionsQuery.data]);

  return (
    <ResponseHandler
      loadables={loadables}
      shouldHideActionButtons
    >
      <CaseTypeAbacContextProvider caseTypeAbac={caseTypeAbacContextValue}>
        <Box
          sx={{
            '& dd': {
              marginLeft: theme.spacing(1),
            },
            '& dl': {
              margin: 0,
            },
            '& dt': {
              fontWeight: 'bold',
            },
          }}
        >
          <Box
            sx={{
              marginBottom: 1,
            }}
          >
            <RichTextEditorContent source={completeCaseType?.description || t`No description available`} />
          </Box>
          <CaseTypeInfoData
            name={getDiseaseName(completeCaseType.disease_id)}
            title={t`Disease`}
          />
          <CaseTypeInfoData
            name={getEtiologicalAgentName(completeCaseType.etiological_agent_id)}
            title={t`Etiological agent`}
          />
          <Box
            sx={{
              marginY: 3,
            }}
          >
            <Typography
              component={'h4'}
              sx={{
                marginY: 1,
              }}
              variant={'h4'}
            >
              {t`Variables by dimension`}
            </Typography>
            <CaseTypeInfoValues
              completeCaseType={completeCaseType}
            />
          </Box>
          <Box
            sx={{
              marginY: 3,
            }}
          >
            <Typography
              component={'h4'}
              sx={{
                marginY: 1,
              }}
              variant={'h4'}
            >
              {t`Trees`}
            </Typography>
            <CaseTypeInfoTrees
              completeCaseType={completeCaseType}
            />
          </Box>
          <Box
            sx={{
              marginY: 3,
            }}
          >
            <Typography
              component={'h4'}
              sx={{
                marginY: 1,
              }}
              variant={'h4'}
            >
              {t`Regions`}
            </Typography>
            <CaseTypeInfoRegions
              completeCaseType={completeCaseType}
            />
          </Box>
          <Box
            sx={{
              marginY: 3,
            }}
          >
            <Typography
              component={'h4'}
              sx={{
                marginY: 1,
              }}
              variant={'h4'}
            >
              {t`Access rights`}
            </Typography>
            <CaseTypeInfoAccessRights
              completeCaseType={completeCaseType}
            />
          </Box>
        </Box>
      </CaseTypeAbacContextProvider>
    </ResponseHandler>
  );
};
