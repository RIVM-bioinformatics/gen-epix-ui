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
  const shouldRestoreSearchButtonFocusRef = useRef(false);
  const arrowUpButtonRef = useRef<HTMLButtonElement>(null);
  const arrowDownButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dashboardStore = use(DashboardStoreContext);
  const sortedData = useStore(dashboardStore, (state) => state.sortedData);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);
  const theme = useTheme();
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [fuse, setFuse] = useState<Fuse<FuseData> | null>(null);
  const [fuseResults, setFuseResults] = useState<FuseResult<FuseData>[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dashboardContext = use(DashboardContext);
  let searchResultStatusText: null | string = null;
  if (searchText) {
    if (!fuseResults.length) {
      searchResultStatusText = t`No results`;
    } else if (highlightedIndex < 0) {
      searchResultStatusText = t('{{numResults}} results', { numResults: fuseResults.length });
    } else {
      searchResultStatusText = t('{{current}}/{{numResults}} results', { current: highlightedIndex + 1, numResults: fuseResults.length });
    }
  }

  const createFuse = useCallback(() => {
    const fuseData: FuseData[] = [];
    sortedData.forEach((caseCbCase) => {
      const fuseDataItem: FuseData = {
        id: caseCbCase.id,
      };
      Object.entries(caseCbCase.content).forEach(([key, value]) => {
        const col = completeCaseType.cols[key];
        if (!col) {
          return;
        }
        const refCol = completeCaseType.ref_cols[col.ref_col_id];
        if (!refCol) {
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

    return new Fuse(fuseData, {
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
    });
  }, [completeCaseType, sortedData]);

  const getFuse = useCallback(() => {
    if (fuse) {
      return fuse;
    }
    const nextFuse = createFuse();
    setFuse(nextFuse);
    return nextFuse;
  }, [createFuse, fuse]);

  const onTextInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextSearchText = event.target.value;
    setSearchText(nextSearchText);
    if (nextSearchText) {
      getFuse();
    }
  }, [getFuse]);

  useEffect(() => {
    setSearchText('');
    setIsActive(false);
    setFuse(null);
    setFuseResults([]);
    setHighlightedIndex(-1);
  }, [completeCaseType, sortedData]);

  useEffect(() => {
    if (!searchText) {
      setFuseResults([]);
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
  }, []);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    } else if (shouldRestoreSearchButtonFocusRef.current) {
      shouldRestoreSearchButtonFocusRef.current = false;
      searchButtonRef.current?.focus();
    }
  }, [isActive]);

  const handleClose = useCallback(() => {
    shouldRestoreSearchButtonFocusRef.current = true;
    setIsActive(false);
    setSearchText('');
    setFuseResults([]);
    setHighlightedIndex(-1);
    dashboardContext.highlight({
      caseIds: [],
      origin: DASHBOARD_COMPONENT_NAME.SEARCH_BOX,
    });
  }, [dashboardContext]);

  const onCloseButtonClick = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const onTextInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
    }
    // on enter press, highlight the first result and focus the down arrow button
    if (event.key === 'Enter') {
      if (!fuseResults?.length) {
        return;
      }
      event.preventDefault();
      setHighlightedIndex(0);
      arrowDownButtonRef.current?.focus();
    }
  }, [handleClose, fuseResults]);

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

  const onGenericKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    // arrow right, focus the next focusable element
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextFocusableElement = event.currentTarget.nextElementSibling as HTMLElement;
      if (nextFocusableElement) {
        nextFocusableElement.focus();
      }
    }
    // arrow left, focus the previous focusable element
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (event.target === arrowUpButtonRef.current) {
        inputRef.current?.focus();
        return;
      }
      const previousFocusableElement = event.currentTarget.previousElementSibling as HTMLElement;
      if (previousFocusableElement) {
        previousFocusableElement.focus();
      }
    }
  }, []);

  return (
    <Box
      sx={{
        height: theme.spacing(4),
        maxWidth: theme.spacing(50),
        overflow: 'hidden',
        width: 'calc(100% / 2)',
      }}
    >
      {isActive ? (
        <Box>
          <OutlinedInput
            endAdornment={(
              <InputAdornment position={'end'}>
                {searchResultStatusText && (
                  <Box
                    aria-atomic={'true'}
                    aria-live={'polite'}
                    role={'status'}
                  >
                    {searchResultStatusText}
                  </Box>
                )}
                <IconButton
                  aria-label={t`Goto previous search result`}
                  disabled={!fuseResults?.length}
                  edge={'end'}
                  onClick={onUpArrowButtonClick}
                  onKeyDown={onGenericKeyDown}
                  ref={arrowUpButtonRef}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <KeyboardArrowUpIcon />
                </IconButton>
                <IconButton
                  aria-label={t`Goto next search result`}
                  disabled={!fuseResults?.length}
                  edge={'end'}
                  onClick={onDownArrowButtonClick}
                  onKeyDown={onGenericKeyDown}
                  ref={arrowDownButtonRef}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <KeyboardArrowDownIcon />
                </IconButton>
                <IconButton
                  aria-label={t`Close search`}
                  edge={'end'}
                  onClick={onCloseButtonClick}
                  onKeyDown={onGenericKeyDown}
                  ref={closeButtonRef}
                >
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            )}
            fullWidth
            inputRef={inputRef}
            name={t`Search listed cases`}
            onChange={onTextInputChange}
            onKeyDown={onTextInputKeyDown}
            placeholder={t`Search listed cases`}
            size={'small'}
            slotProps={{
              input: {
                'aria-label': t`Search listed cases`,
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
            type={'search'}
            value={searchText}
          />
        </Box>
      ) : (
        <Box
          sx={{
            justifySelf: 'flex-end',
            marginRight: theme.spacing(0.6),
            marginTop: theme.spacing(0.5),
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
      )}
    </Box>
  );
};
