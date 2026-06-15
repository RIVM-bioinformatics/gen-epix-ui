import { createContext } from 'react';

import type { AutocompleteSelectAllContextData } from '../../../../models/form';

export const AutocompleteSelectAllContext = createContext<AutocompleteSelectAllContextData | null>(null);
