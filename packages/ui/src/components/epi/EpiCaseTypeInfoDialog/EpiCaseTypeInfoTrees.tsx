import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CaseDbCompleteCaseType } from '@gen-epix/api-casedb';

import { EpiTreeDescription } from '../EpiTreeDescription';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';

import { EpiCaseTypeInfoColAccessRights } from './EpiCaseTypeInfoColAccessRights';


export type EpiCaseTypeInfoTreesProps = {
  readonly completeCaseType: CaseDbCompleteCaseType;
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
                '& dd': {
                  marginLeft: theme.spacing(2),
                },
                '& dl': {
                  margin: 0,
                },
              }}
            >
              <EpiTreeDescription
                treeConfiguration={treeConfiguration}
              />
              <Box
                sx={{
                  marginY: 1,
                }}
              >
                <strong style={{ fontSize: '1rem' }}>
                  {t`Access rights`}
                </strong>
                <EpiCaseTypeInfoColAccessRights
                  colId={treeConfiguration.col.id}
                />
              </Box>

            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
};
