import type { SettingItem } from './types';

export const getSettingSummary = (settings: SettingItem[]) => {
  return `${settings.length} parametros configurados`;
};
