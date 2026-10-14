import { singleton } from 'tsyringe';

@singleton()
export class NavigationHistoryService {
  public readonly navigationHistory: string[] = [];

}
