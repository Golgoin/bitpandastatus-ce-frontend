import type { AssetSetting } from './api';
import type { UpdateLogWithPin } from './contracts';

export const normalizeText = (value: string) => (
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
);

export const matchesAssetUpdate = (asset: AssetSetting, update: UpdateLogWithPin) => {
  const symbol = (asset.symbol || '').trim();
  const name = (asset.name || '').trim();
  if (!symbol && !name) return false;

  const symbolLower = symbol.toLowerCase();
  const nameLower = normalizeText(name);
  const fullLabelLower = normalizeText(`${name} (${symbol})`);

  const componentName = normalizeText(update.component_name || '');
  if (componentName === fullLabelLower || (nameLower && componentName === nameLower)) {
    return true;
  }

  const rawComponentName = (update.component_name || '').trim();
  const componentSymbolMatch = rawComponentName.match(/\(([^()]+)\)\s*$/);
  if (componentSymbolMatch?.[1]?.trim().toLowerCase() === symbolLower) {
    const componentNameWithoutSymbol = normalizeText(rawComponentName.replace(/\(([^()]+)\)\s*$/, ''));
    if (!nameLower || componentNameWithoutSymbol === nameLower) {
      return true;
    }
  }

  const description = normalizeText(update.description || '');
  if (!description) return false;

  return description.includes(fullLabelLower);
};
