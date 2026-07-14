import {
  Box,
  IconButton,
  InputAdornment,
  OutlinedInput,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import { visuallyHidden } from '@mui/utils';
import type {
  ChangeEvent,
  KeyboardEvent,
} from 'react';
import {
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useStore } from 'zustand';
import type { FuseResult } from 'fuse.js';
import Fuse from 'fuse.js';
import { useTranslation } from 'react-i18next';

import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { CaseUtil } from '../../../utils/CaseUtil';
import { DASHBOARD_COMPONENT_NAME } from '../../../data/dashboard';

import { DashboardContext } from './context/DashboardContext';

type FuseData = {
  [key: string]: string;
  id: string;
};

export const DashboardSearch = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const dashboardStore = use(DashboardStoreContext);
  const sortedData = useStore(dashboardStore, (state) => state.sortedData);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);
  const theme = useTheme();
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [fuse, setFuse] = useState<Fuse<FuseData>>(null);
  const [fuseResults, setFuseResults] = useState<FuseResult<FuseData>[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dashboardContext = use(DashboardContext);

  const onTextInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    if (!fuse) {
      const fuseData: FuseData[] = [];
      sortedData.forEach((caseCbCase) => {
        const fuseDataItem: FuseData = {
          id: caseCbCase.id,
        };
        Object.entries(caseCbCase.content).forEach(([key, value]) => {
          const col = completeCaseType.cols[key];
          const refCol = completeCaseType.ref_cols[col.ref_col_id];
          if (!col) {
            return;
          }

          const rowValue = CaseUtil.getRowValue({ [key]: value }, col, completeCaseType);
          if (rowValue.isMissing) {
            return;
          }
          if (!refCol.concept_set_id) {
            fuseDataItem[`${key}-raw`] = rowValue.raw;
          }
          if (rowValue.full !== rowValue.raw) {
            fuseDataItem[`${key}-full`] = rowValue.full;
          }
          if (rowValue.long !== rowValue.raw && rowValue.long !== rowValue.full) {
            fuseDataItem[`${key}-long`] = rowValue.long;
          }
          if (rowValue.short !== rowValue.raw && rowValue.short !== rowValue.full && rowValue.short !== rowValue.long) {
            fuseDataItem[`${key}-short`] = rowValue.short;
          }
        });
        fuseData.push(fuseDataItem);
      });
      setFuse(new Fuse(fuseData, {
        ignoreDiacritics: true,
        ignoreLocation: false,
        includeMatches: true,
        includeScore: true,
        isCaseSensitive: false,
        keys: [
          'id',
          ...Object.keys(completeCaseType.cols).map(x => [`${x}-raw`, `${x}-full`, `${x}-long`, `${x}-short`]).flat(),
        ],
        threshold: 0.5,
        useExtendedSearch: true,
      }));
    }
  }, [fuse, sortedData, completeCaseType]);

  useEffect(() => {
    setFuse(null);
    setFuseResults(null);
    setHighlightedIndex(-1);
  }, [sortedData]);

  useEffect(() => {
    if (!searchText) {
      setFuseResults(null);
      setHighlightedIndex(-1);
      dashboardContext.highlight({
        caseIds: [],
        origin: DASHBOARD_COMPONENT_NAME.SEARCH_BOX,
      });
      return;
    }
    if (!fuse) {
      return;
    }
    const extendedSearchText = `'${searchText}`;
    const results = fuse.search(extendedSearchText).sort((a, b) => a.refIndex - b.refIndex);
    setFuseResults(results);
    setHighlightedIndex(-1);
  }, [dashboardContext, fuse, searchText]);

  const onSearchButtonClick = useCallback(() => {
    setIsActive(true);
    inputRef.current?.focus();
  }, []);

  const handleClose = useCallback(() => {
    inputRef.current.value = '';
    setIsActive(false);
    setSearchText('');
    setFuseResults(null);
    setHighlightedIndex(-1);
    searchButtonRef.current?.focus();
    dashboardContext.highlight({
      caseIds: [],
      origin: DASHBOARD_COMPONENT_NAME.SEARCH_BOX,
    });
  }, [dashboardContext]);

  const onCloseButtonClick = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const onTextInputKeyUp = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  const onUpArrowButtonClick = useCallback(() => {
    // goto previous result
    if (!fuseResults?.length) {
      return;
    }
    setHighlightedIndex((prev) => {
      const newHighlightedIndex = prev <= 0 ? fuseResults.length - 1 : prev - 1;
      return newHighlightedIndex;
    });
  }, [fuseResults]);

  const onDownArrowButtonClick = useCallback(() => {
    // goto next result
    if (!fuseResults?.length) {
      return;
    }
    setHighlightedIndex((prev) => {
      const newHighlightedIndex = prev >= fuseResults.length - 1 ? 0 : prev + 1;
      return newHighlightedIndex;
    });
  }, [fuseResults]);

  useEffect(() => {
    if (!fuseResults?.length || highlightedIndex < 0 || highlightedIndex >= fuseResults.length) {
      dashboardContext.highlight({
        caseIds: [],
        origin: DASHBOARD_COMPONENT_NAME.SEARCH_BOX,
      });
      return;
    }
    dashboardContext.highlight({
      caseIds: [fuseResults[highlightedIndex].item.id],
      origin: DASHBOARD_COMPONENT_NAME.SEARCH_BOX,
      scrollIntoView: true,
    });
  }, [dashboardContext, fuseResults, highlightedIndex]);

  return (
    <Box
      sx={{
        height: theme.spacing(4),
        maxWidth: theme.spacing(50),
        overflow: 'hidden',
        width: 'calc(100% / 2)',
      }}
    >
      <Box
        sx={{
          justifySelf: 'flex-end',
          marginRight: theme.spacing(0.6),
          marginTop: theme.spacing(0.5),
          ...(isActive ? visuallyHidden : {}),
        }}
      >
        <IconButton
          aria-label={t`Search`}
          edge={'end'}
          onClick={onSearchButtonClick}
          ref={searchButtonRef}
          sx={{
            color: theme.palette.primary.main,
            margin: 0,
            padding: 0,
          }}
        >
          <SearchIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          ...(isActive ? {} : visuallyHidden),
        }}
      >
        <OutlinedInput
          endAdornment={(
            <InputAdornment position={'end'}>
              {fuseResults && (
                <Box>
                  {t('{{current}}/{{numResults}} results', { current: fuseResults.length ? highlightedIndex + 1 : 0, numResults: fuseResults.length })}
                </Box>
              )}
              <IconButton
                aria-label={t`Previous result`}
                disabled={!fuseResults?.length}
                edge={'end'}
                onClick={onUpArrowButtonClick}
                sx={{ color: theme.palette.primary.main }}
              >
                <KeyboardArrowUpIcon />
              </IconButton>
              <IconButton
                aria-label={t`Next result`}
                disabled={!fuseResults?.length}
                edge={'end'}
                onClick={onDownArrowButtonClick}
                sx={{ color: theme.palette.primary.main }}
              >
                <KeyboardArrowDownIcon />
              </IconButton>
              <IconButton
                aria-label={t`Close`}
                edge={'end'}
              >
                <CloseIcon
                  onClick={onCloseButtonClick}
                />
              </IconButton>
            </InputAdornment>
          )}
          fullWidth
          inputRef={inputRef}
          onChange={onTextInputChange}
          onKeyUp={onTextInputKeyUp}
          placeholder={t`Search...`}
          size={'small'}
          slotProps={{
            input: {
              sx: {
                height: '32px',
                outline: 'none !important',
                paddingBottom: '0 !important',
                paddingTop: '0 !important',
              },
            },
          }}
          sx={{
            height: '32px',
          }}
        />
      </Box>
    </Box>
  );
};
