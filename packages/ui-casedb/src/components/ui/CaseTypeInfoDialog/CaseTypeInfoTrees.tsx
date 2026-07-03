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

import { TreeDescription } from '../TreeDescription';
import { TreeUtil } from '../../../utils/TreeUtil';

import { CaseTypeInfoColAccessRights } from './CaseTypeInfoColAccessRights';


export type CaseTypeInfoTreesProps = {
  readonly completeCaseType: CaseDbCompleteCaseType;
};
export const CaseTypeInfoTrees = ({ completeCaseType }: CaseTypeInfoTreesProps) => {
  const treeConfigurations = useMemo(() => TreeUtil.getTreeConfigurations(completeCaseType), [completeCaseType]);
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
              <TreeDescription
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
                <CaseTypeInfoColAccessRights
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
