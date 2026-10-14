import { createContext } from 'react';

import type { AutocompleteSelectAllContextData } from '../../../models/form.models';

export const AutocompleteSelectAllContext = createContext<AutocompleteSelectAllContextData | null>(null);
