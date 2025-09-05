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
import { EpiCaseTypeAbacContextProvider } from '../../../context/epiCaseTypeAbac';
import {
  useDataCollectionsMapQuery,
  useDataCollectionsQuery,
} from '../../../dataHooks/useDataCollectionsQuery';
import { useDiseasesMapQuery } from '../../../dataHooks/useDiseasesQuery';
import { useEtiologicalAgentsMapQuery } from '../../../dataHooks/useEtiologicalAgentsQuery';
import { EpiStoreContext } from '../../../stores/epiStore';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { useArray } from '../../../hooks/useArray';
import type { WithDialogRenderProps } from '../../../hoc/withDialog';
import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { RichTextEditorContent } from '../../form/fields/RichTextEditor';

import { EpiCaseTypeInfoValues } from './EpiCaseTypeInfoValues';
import { EpiCaseTypeInfoTrees } from './EpiCaseTypeInfoTrees';
import { EpiCaseTypeInfoRegions } from './EpiCaseTypeInfoRegions';
import { EpiCaseTypeInfoData } from './EpiCaseTypeInfoData';
import { EpiCaseTypeInfoAccessRights } from './EpiCaseTypeInfoAccessRights';

export type EpiCaseTypeInfoDialogContentProps = Pick<WithDialogRenderProps, 'onTitleChange' | 'onPermalinkChange'>;

export const EpiCaseTypeInfoDialogContent = ({ onTitleChange, onPermalinkChange }: EpiCaseTypeInfoDialogContentProps) => {
  const [t] = useTranslation();
  const theme = useTheme();
  const diseasesMapQuery = useDiseasesMapQuery();
  const etiologicalAgentsMapQuery = useEtiologicalAgentsMapQuery();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const dataCollectionsQuery = useDataCollectionsQuery();
  const loadables = useArray([dataCollectionsMapQuery, dataCollectionsQuery, diseasesMapQuery, etiologicalAgentsMapQuery]);

  const epiStore = useContext(EpiStoreContext);
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);

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
      onPermalinkChange(EpiCaseTypeUtil.createCaseTypeLink(completeCaseType, true));
    }
  }, [completeCaseType.name, completeCaseType.id, onPermalinkChange, completeCaseType]);

  const caseTypeAbacContextValue = useMemo<EpiCaseTypeAbacContextValue>(() => {
    return {
      userDataCollections: dataCollectionsQuery.data,
      userDataCollectionsMap: dataCollectionsMapQuery.map,
      caseTypeAccessAbacDict: completeCaseType.case_type_access_abacs,
    };
  }, [completeCaseType.case_type_access_abacs, dataCollectionsMapQuery.map, dataCollectionsQuery.data]);

  return (
    <ResponseHandler
      shouldHideActionButtons
      loadables={loadables}
    >
      <EpiCaseTypeAbacContextProvider caseTypeAbac={caseTypeAbacContextValue}>
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
            <RichTextEditorContent source={completeCaseType?.description || t`No description available`} />
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
      </EpiCaseTypeAbacContextProvider>
    </ResponseHandler>
  );
};
