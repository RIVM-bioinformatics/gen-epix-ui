import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
} from '@mui/material';
import { useStore } from 'zustand';

import { EpiCaseTypeUtil } from '../../../utils/EpiCaseTypeUtil';
import { RouterManager } from '../../../classes/managers/RouterManager';
import { EPI_UPLOAD_ACTION } from '../../../models/epiUpload';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import type {
  CaseSeq,
  CaseReadSet,
  Seq,
  ReadSet,
} from '../../../api';
import { CaseApi } from '../../../api';
import { GenericErrorMessage } from '../../ui/GenericErrorMessage';
import { LinearProgressWithLabel } from '../../ui/LinearProgressWithLabel';

import { EpiUploadNavigation } from './EpiUploadNavigation';


export const EpiUploadCreateCases = () => {
  const [t] = useTranslation();

  const store = useContext(EpiUploadStoreContext);
  const reset = useStore(store, (state) => state.reset);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const sequenceMapping = useStore(store, (state) => state.sequenceMapping);
  const sequenceFilesDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const validatedCases = useStore(store, (state) => state.validatedCases);
  const validatedCasesWithGeneratedId = useStore(store, (state) => state.validatedCasesWithGeneratedId);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const libraryPrepProtocolId = useStore(store, (state) => state.libraryPrepProtocolId);
  const rawData = useStore(store, (state) => state.rawData);
  const [progress, setProgress] = useState(0);

  const [isUploadStarted, setIsUploadStarted] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const sequenceFileStats = useMemo(() => {
    return EpiUploadUtil.getSequenceMappingStats(sequenceMapping, sequenceFilesDataTransfer);
  }, [sequenceFilesDataTransfer, sequenceMapping]);

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const abort = () => {
      abortController.abort();
    };

    if (!isUploadStarted) {
      return abort;
    }

    const uploadCases = async () => {
      try {
        setProgress(0);
        const createCasesResponse = await CaseApi.instance.createCases({
          case_type_id: store.getState().caseTypeId,
          created_in_data_collection_id: store.getState().createdInDataCollectionId,
          data_collection_ids: store.getState().shareInDataCollectionIds,
          is_update: store.getState().importAction === EPI_UPLOAD_ACTION.UPDATE,
          cases: validatedCases.map(c => c.case),
        }, { signal });
        setProgress(5);

        const caseIdMapping: { [generatedCaseId: string]: string } = {};
        for (let i = 0; i < validatedCasesWithGeneratedId.length; i++) {
          const validatedCase = validatedCasesWithGeneratedId[i];
          const createdCase = createCasesResponse.data[i];
          caseIdMapping[validatedCase.generated_id] = createdCase.id;
        }

        const seqForCases: Array<{ caseSeq: CaseSeq; file: File }> = [];
        const readSetsForCases: Array<{ caseReadSet: CaseReadSet; fwdFile: File; revFile: File }> = [];

        for (const [generatedCaseId, mapping] of Object.entries(sequenceMapping)) {
          for (const [columnId, fileName] of Object.entries(mapping.sequenceFileNames)) {
            const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileName);
            if (file) {
              seqForCases.push({
                caseSeq: {
                  case_id: caseIdMapping[generatedCaseId],
                  case_type_col_id: columnId,
                },
                file,
              });
            }
          }
          for (const [columnId, fileNames] of Object.entries(mapping.readsFileNames)) {
            let fwdFile: File | undefined;
            let revFile: File | undefined;
            if (fileNames.fwd) {
              fwdFile = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileNames.fwd);
            }
            if (fileNames.rev) {
              revFile = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileNames.rev);
            }

            if (fwdFile) {
              readSetsForCases.push({
                caseReadSet: {
                  case_id: caseIdMapping[generatedCaseId],
                  case_type_col_id: columnId,
                  library_prep_protocol_id: libraryPrepProtocolId,
                },
                fwdFile,
                revFile,
              });
            }
          }
        }
        let seqs: Seq[] = [];
        let readSets: ReadSet[] = [];
        if (seqForCases.length > 0) {
          seqs = (await CaseApi.instance.createSeqsForCases(seqForCases.map(r => r.caseSeq), { signal })).data;
          console.log('seqForCasesResponse', seqs);
        }
        if (readSetsForCases.length > 0) {
          readSets = (await CaseApi.instance.createReadSetsForCases(readSetsForCases.map(r => r.caseReadSet), { signal })).data;
          console.log('readSetsForCasesResponse', readSets);
        }
        setProgress(10);

        for (let i = 0; i < seqForCases.length; i++) {
          const { caseSeq, file } = seqForCases[i];
          const seq = seqs[i];
          if (seq) {
            await CaseApi.instance.createFileForSeq(caseSeq.case_id, caseSeq.case_type_col_id, {
              file_content: await EpiUploadUtil.readFileAsBase64(file),
            }, { signal });
          }
        }

        for (let i = 0; i < readSetsForCases.length; i++) {
          const { caseReadSet, fwdFile, revFile } = readSetsForCases[i];
          const readSet = readSets[i];
          if (readSet) {
            await CaseApi.instance.createFileForReadSet(caseReadSet.case_id, caseReadSet.case_type_col_id, {
              file_content: await EpiUploadUtil.readFileAsBase64(fwdFile),
              is_fwd: true,
            }, { signal });
            await CaseApi.instance.createFileForReadSet(caseReadSet.case_id, caseReadSet.case_type_col_id, {
              file_content: await EpiUploadUtil.readFileAsBase64(revFile),
              is_fwd: false,
            }, { signal });
          }
        }
        setProgress(100);
      } catch (e) {
        setError(e);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    uploadCases();

    return abort;
  }, [isUploadStarted, libraryPrepProtocolId, sequenceFileStats, sequenceFilesDataTransfer.files, sequenceMapping, store, validatedCases, validatedCasesWithGeneratedId]);


  const onStartOverButtonClick = useCallback(async () => {
    await reset();
  }, [reset]);

  const onStartUploadButtonClick = useCallback(() => {
    setIsUploadStarted(true);
  }, []);

  const onGotoCasesButtonClick = useCallback(async () => {
    const link = EpiCaseTypeUtil.createCaseTypeLink(completeCaseType);
    await RouterManager.instance.router.navigate(link);
  }, [completeCaseType]);

  if (isUploadStarted && !error) {
    return (
      <Box>
        <LinearProgressWithLabel value={progress} />
      </Box>
    );
  }
  if (error) {
    return (
      <Box>
        <GenericErrorMessage error={error} />
      </Box>
    );
  }
  return (
    <Container
      maxWidth={'xl'}
      sx={{
        height: '100%',
      }}
    >
      {!isUploadStarted && (
        <Box>
          <Box marginY={2}>
            <Alert severity={'info'}>
              <AlertTitle>
                {t('{{numCases}} cases are ready to be uploaded.', { numCases: validatedCases.length })}
              </AlertTitle>
            </Alert>
          </Box>
          {sequenceFileStats.mappedSequenceFiles.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'info'}>
                <AlertTitle>
                  {t('{{numSequenceFiles}} sequence files are ready to be uploaded.', { numSequenceFiles: sequenceFileStats.mappedSequenceFiles.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          {sequenceFileStats.mappedReadsFiles.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'info'}>
                <AlertTitle>
                  {t('{{numReadsFiles}} reads files are ready to be uploaded.', { numReadsFiles: sequenceFileStats.mappedReadsFiles.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          {(rawData.length - 1) - validatedCases.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'warning'}>
                <AlertTitle>
                  {t('{{numCases}} cases were not selected and will not be uploaded.', { numCases: (rawData.length - 1) - validatedCases.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          {sequenceFileStats.unmappedSequenceFiles.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'warning'}>
                <AlertTitle>
                  {t('{{unmappedSequenceFiles}} unmapped sequence files will not be uploaded.', { unmappedSequenceFiles: sequenceFileStats.unmappedSequenceFiles.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          {sequenceFileStats.unmappedReadsFiles.length > 0 && (
            <Box marginY={2}>
              <Alert severity={'warning'}>
                <AlertTitle>
                  {t('{{unmappedReadsFiles}} unmapped reads files will not be uploaded.', { unmappedReadsFiles: sequenceFileStats.unmappedReadsFiles.length })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
        </Box>
      )}
      {isUploadStarted && (
        <Alert severity={'success'}>
          <AlertTitle>
            {t('Successfully uploaded cases.')}
          </AlertTitle>
        </Alert>
      )}
      {!isUploadStarted && (
        <EpiUploadNavigation
          proceedLabel={'Start upload'}
          onGoBackButtonClick={goToPreviousStep}
          onProceedButtonClick={onStartUploadButtonClick}
        />
      )}
      {isUploadStarted && (
        <Box
          marginTop={2}
          marginBottom={1}
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant={'outlined'}
            onClick={onStartOverButtonClick}
          >
            {t('Upload more cases')}
          </Button>
          <Button
            variant={'contained'}
            onClick={onGotoCasesButtonClick}
          >
            {t('View uploaded cases')}
          </Button>
        </Box>
      )}
    </Container>
  );
};
