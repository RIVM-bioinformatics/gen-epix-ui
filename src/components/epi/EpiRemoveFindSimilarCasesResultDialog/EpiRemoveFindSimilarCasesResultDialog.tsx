import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { useStore } from 'zustand';
import { produce } from 'immer';

import {
  type WithDialogRenderProps,
  type WithDialogRefMethods,
  withDialog,
} from '../../../hoc/withDialog';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { DialogAction } from '../../ui/Dialog';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import type { CompleteCaseType } from '../../../api';
import type { Step } from '../../ui/Stepper';
import {
  Stepper,
  STEPPER_DIRECTION,
} from '../../ui/Stepper';

export interface EpiRemoveFindSimilarCasesResultDialogOpenProps {
  completeCaseType: CompleteCaseType;
}

export interface EpiRemoveFindSimilarCasesResultDialogProps extends WithDialogRenderProps<EpiRemoveFindSimilarCasesResultDialogOpenProps> {
  //
}

export type EpiRemoveFindSimilarCasesResultDialogRefMethods = WithDialogRefMethods<EpiRemoveFindSimilarCasesResultDialogProps, EpiRemoveFindSimilarCasesResultDialogOpenProps>;

export const EpiRemoveFindSimilarCasesResultDialog = withDialog<EpiRemoveFindSimilarCasesResultDialogProps, EpiRemoveFindSimilarCasesResultDialogOpenProps>((
  {
    openProps,
    onActionsChange,
    onTitleChange,
    onClose,
  }: EpiRemoveFindSimilarCasesResultDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const formId = useId();
  const epiDashboardStore = useContext(EpiDashboardStoreContext);
  const setFindSimilarCasesResults = useStore(epiDashboardStore, (state) => state.setFindSimilarCasesResults);
  const treeConfigurations = useMemo(() => EpiTreeUtil.getTreeConfigurations(openProps.completeCaseType), [openProps.completeCaseType]);
  const findSimilarCasesResults = useStore(epiDashboardStore, (state) => state.findSimilarCasesResults);
  const [intermediateFindSimilarCasesResults, setIntermediateFindSimilarCasesResults] = useState(findSimilarCasesResults);

  useEffect(() => {
    onTitleChange(t`Remove similar cases from results`);
  }, [t, onTitleChange]);

  const onApplyIntermediateResultsButtonClick = useCallback(() => {
    void setFindSimilarCasesResults(intermediateFindSimilarCasesResults);
    onClose();

  }, [setFindSimilarCasesResults, intermediateFindSimilarCasesResults, onClose]);

  const onUndoButtonClick = useCallback(() => {
    setIntermediateFindSimilarCasesResults(findSimilarCasesResults);
  }, [findSimilarCasesResults]);

  const onRemoveAllAndCloseButtonClick = useCallback(() => {
    void setFindSimilarCasesResults([]);
    onClose();
  }, [setFindSimilarCasesResults, onClose]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push({
      ...TestIdUtil.createAttributes('EpiRemoveFindSimilarCasesResultDialog-closeButton'),
      color: 'primary',
      variant: 'outlined',
      label: t`Close`,
      onClick: onClose,
    });
    if (findSimilarCasesResults.length !== intermediateFindSimilarCasesResults.length) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiRemoveFindSimilarCasesResultDialog-undoButton'),
        color: 'secondary',
        variant: 'outlined',
        label: t`Undo`,
        onClick: onUndoButtonClick,
      });
    }
    if (findSimilarCasesResults.length !== intermediateFindSimilarCasesResults.length) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiRemoveFindSimilarCasesResultDialog-applyButton'),
        color: 'secondary',
        variant: 'contained',
        label: t`Apply and close`,
        onClick: onApplyIntermediateResultsButtonClick,
      });
    }
    onActionsChange(actions);
  }, [formId, onActionsChange, onClose, t, findSimilarCasesResults, intermediateFindSimilarCasesResults, onApplyIntermediateResultsButtonClick, onUndoButtonClick]);

  const onRemoveCasesButtonClick = useCallback((index: number) => {
    setIntermediateFindSimilarCasesResults(produce(intermediateFindSimilarCasesResults, draft => {
      draft.splice(index, 1);
      return draft;
    }));
  }, [intermediateFindSimilarCasesResults]);

  const steps = useMemo((): Step[] => {
    return [
      {
        key: 'start',
        label: t('Result without similar cases ({{numberOfCases}} cases)', {
          numberOfCases: findSimilarCasesResults?.[0]?.originalCaseIds.length || 0,
        }),
        index: '',
        content: (
          <Box
            marginTop={1}
            marginBottom={2}
          >
            <Button
              variant={'outlined'}
              color={'primary'}
              onClick={onRemoveAllAndCloseButtonClick}
            >
              {t('Remove all similar cases from result')}
            </Button>
          </Box>
        ),
      },
      ...intermediateFindSimilarCasesResults.map((item, index) => ({
        key: item.key,
        label: t('Searched {{numberOfInputCases}} cases for similar cases.', {
          numberOfInputCases: item.originalCaseIds.length,
        }),
        index: (index + 1).toString(),
        content: (
          <Box>
            <Box component={'ul'}>
              <Box component={'li'}>
                {t('Tree: {{treeLabel}}', {
                  treeLabel: treeConfigurations.find((config) => config.caseTypeCol.id === item.caseTypeColId)?.caseTypeCol?.label || item.caseTypeColId,
                })}
              </Box>
              <Box component={'li'}>
                {t('Distance: {{distance}}', {
                  distance: item.distance,
                })}
              </Box>
              <Box component={'li'}>
                {t('Found similar cases: {{foundCases}}', {
                  foundCases: item.similarCaseIds.length,
                })}
              </Box>
              <Box component={'li'}>
                {t('New number of cases: {{numberOfCases}}', {
                  numberOfCases: item.similarCaseIds.length + item.originalCaseIds.length,
                })}
              </Box>
            </Box>
            <Box
              marginTop={1}
              marginBottom={2}
            >
              <Button
                disabled={index !== intermediateFindSimilarCasesResults.length - 1}
                variant={'outlined'}
                color={'primary'}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onRemoveCasesButtonClick(index)}
              >
                {t('Remove')}
              </Button>
            </Box>
          </Box>
        ),
      }))];
  }, [findSimilarCasesResults, intermediateFindSimilarCasesResults, onRemoveAllAndCloseButtonClick, onRemoveCasesButtonClick, t, treeConfigurations]);

  return (
    <Box
      sx={{
        position: 'relative',
      }}
    >
      {steps.length === 0 && (
        <Typography>
          {t('No similar cases results to remove.')}
        </Typography>
      )}
      {steps.length > 0 && (
        <Stepper
          hideCompletedIndicator
          steps={steps}
          activeStep={steps[steps.length - 1].key}
          direction={STEPPER_DIRECTION.VERTICAL}
        />
      )}
    </Box>
  );

}, {
  testId: 'EpiRemoveFindSimilarCasesResultDialog',
  maxWidth: 'lg',
  fullWidth: true,
  defaultTitle: '',
});
