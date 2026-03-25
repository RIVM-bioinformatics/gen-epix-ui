import {
  Box,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { TreeConfiguration } from '../../../models/epi';

export type EpiTreeDescriptionProps = {
  readonly treeConfiguration: TreeConfiguration;
};

export const EpiTreeDescription = ({
  treeConfiguration,
}: EpiTreeDescriptionProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
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
      <Box marginY={1}>
        <strong style={{ fontSize: '1rem' }}>
          {t`Genetic distance protocol`}
        </strong>
        <dl>
          <dt>
            {t`Name`}
          </dt>
          <dd>
            {treeConfiguration.geneticDistanceProtocol.name}
          </dd>
          <dt>
            {t`Description`}
          </dt>
          <dd>
            {treeConfiguration.geneticDistanceProtocol.description}
          </dd>
        </dl>
      </Box>
      <Box marginY={1}>
        <strong style={{ fontSize: '1rem' }}>
          {t`Tree algorithm`}
        </strong>
        <dl>
          <dt>
            {t`Name`}
          </dt>
          <dd>
            {treeConfiguration.treeAlgorithm.name}
          </dd>
          <dt>
            {t`Description`}
          </dt>
          <dd>
            {treeConfiguration.treeAlgorithm.description}
          </dd>
        </dl>
      </Box>

    </Box>
  );
};
