import {
  container as rootContainer,
  singleton,
} from 'tsyringe';

@singleton()
export class NavigationHistoryService {
  public readonly navigationHistory: string[] = [];

  public static getInstance(): NavigationHistoryService {
    return rootContainer.resolve(NavigationHistoryService);
  }
}
