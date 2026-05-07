import {
  type ReactElement,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { useStore } from 'zustand';
import { produce } from 'immer';
import type { CaseDbCompleteCaseType } from '@gen-epix/api-casedb';
import type {
  DialogAction,
  Step,
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import {
  Stepper,
  STEPPER_DIRECTION,
  TestIdUtil,
  withDialog,
} from '@gen-epix/ui';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';


export interface EpiRemoveFindSimilarCasesResultDialogOpenProps {
  completeCaseType: CaseDbCompleteCaseType;
}

export interface EpiRemoveFindSimilarCasesResultDialogProps extends WithDialogRenderProps<EpiRemoveFindSimilarCasesResultDialogOpenProps> {
  //
}

export type EpiRemoveFindSimilarCasesResultDialogRefMethods = WithDialogRefMethods<EpiRemoveFindSimilarCasesResultDialogProps, EpiRemoveFindSimilarCasesResultDialogOpenProps>;

export const EpiRemoveFindSimilarCasesResultDialog = withDialog<EpiRemoveFindSimilarCasesResultDialogProps, EpiRemoveFindSimilarCasesResultDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: EpiRemoveFindSimilarCasesResultDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const formId = useId();
  const epiDashboardStore = use(EpiDashboardStoreContext);
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
      label: t`Close`,
      onClick: onClose,
      variant: 'outlined',
    });
    if (findSimilarCasesResults.length !== intermediateFindSimilarCasesResults.length) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiRemoveFindSimilarCasesResultDialog-undoButton'),
        color: 'secondary',
        label: t`Undo`,
        onClick: onUndoButtonClick,
        variant: 'outlined',
      });
    }
    if (findSimilarCasesResults.length !== intermediateFindSimilarCasesResults.length) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiRemoveFindSimilarCasesResultDialog-applyButton'),
        color: 'secondary',
        label: t`Apply and close`,
        onClick: onApplyIntermediateResultsButtonClick,
        variant: 'contained',
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
        content: (
          <Box
            sx={{
              marginBottom: 2,
              marginTop: 1,
            }}
          >
            <Button
              color={'primary'}
              onClick={onRemoveAllAndCloseButtonClick}
              variant={'outlined'}
            >
              {t('Remove all similar cases from result')}
            </Button>
          </Box>
        ),
        index: '',
        key: 'start',
        label: t('Result without similar cases ({{numberOfCases}} cases)', {
          numberOfCases: findSimilarCasesResults?.[0]?.originalCaseIds.length || 0,
        }),
      },
      ...intermediateFindSimilarCasesResults.map((item, index) => ({
        content: (
          <Box>
            <Box component={'ul'}>
              <Box component={'li'}>
                {t('Tree: {{treeLabel}}', {
                  treeLabel: treeConfigurations.find((config) => config.col.id === item.colId)?.col?.label || item.colId,
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
              sx={{
                marginBottom: 2,
                marginTop: 1,
              }}
            >
              <Button
                color={'primary'}
                disabled={index !== intermediateFindSimilarCasesResults.length - 1}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onClick={() => onRemoveCasesButtonClick(index)}
                variant={'outlined'}
              >
                {t('Remove')}
              </Button>
            </Box>
          </Box>
        ),
        index: (index + 1).toString(),
        key: item.key,
        label: t('Searched {{numberOfInputCases}} cases for similar cases.', {
          numberOfInputCases: item.originalCaseIds.length,
        }),
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
          activeStep={steps[steps.length - 1].key}
          direction={STEPPER_DIRECTION.VERTICAL}
          hideCompletedIndicator
          steps={steps}
        />
      )}
    </Box>
  );

}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'EpiRemoveFindSimilarCasesResultDialog',
});
