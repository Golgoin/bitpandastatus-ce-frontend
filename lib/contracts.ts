import type { AssetSetting, UpdateLog } from './api';

export type SearchParamsRecord = { [key: string]: string | string[] | undefined };

export type UpdateLogWithPin = UpdateLog & { isPinned?: boolean };

export interface StatusPageData {
  settings: AssetSetting[];
  updates: UpdateLogWithPin[];
}
