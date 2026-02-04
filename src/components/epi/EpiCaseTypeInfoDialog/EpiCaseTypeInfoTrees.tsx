import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { EpiTreeDescription } from '../EpiTreeDescription';
import type { CompleteCaseType } from '../../../api';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';

import { EpiCaseTypeInfoCaseTypeColumnAccessRights } from './EpiCaseTypeInfoCaseTypeColumnAccessRights';


export type EpiCaseTypeInfoTreesProps = {
  readonly completeCaseType: CompleteCaseType;
};
export const EpiCaseTypeInfoTrees = ({ completeCaseType }: EpiCaseTypeInfoTreesProps) => {
  const treeConfigurations = useMemo(() => EpiTreeUtil.getTreeConfigurations(completeCaseType), [completeCaseType]);
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
      {treeConfigurations.map(treeConfiguration => (
        <Accordion
          key={treeConfiguration.computedId}
          slotProps={{ transition: { unmountOnExit: true } }}
        >
          <AccordionSummary
            aria-controls={`panel-${treeConfiguration.computedId}-content`}
            expandIcon={<ExpandMoreIcon />}
            id={`panel-${treeConfiguration.computedId}-header`}
            sx={{
              fontWeight: 'bold',
            }}
          >
            {`${treeConfiguration.geneticDistanceProtocol.name} - ${treeConfiguration.treeAlgorithm.name}`}
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{
                '& dl': {
                  margin: 0,
                },
                '& dd': {
                  marginLeft: theme.spacing(2),
                },
              }}
            >
              <EpiTreeDescription
                treeConfiguration={treeConfiguration}
              />
              <Box marginY={1}>
                <strong style={{ fontSize: '1rem' }}>
                  {t`Access rights`}
                </strong>
                <EpiCaseTypeInfoCaseTypeColumnAccessRights
                  caseTypeColumnId={treeConfiguration.caseTypeCol.id}
                />
              </Box>

            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
};
