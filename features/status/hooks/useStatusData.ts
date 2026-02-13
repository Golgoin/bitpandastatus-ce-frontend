'use client';

import { useMemo } from 'react';
import type { AssetSetting } from '../../../lib/api';
import type { StatusPageData } from '../../../lib/contracts';
import { getUpdateStatusToken, statusToText } from '../../../lib/status';
import type { Filters } from '../types';

export interface AssetGroup {
  typeName: string;
  groupName: string;
  assets: AssetSetting[];
}

export type GroupedAssets = Array<[string, AssetGroup]>;

interface UseStatusDataParams {
  data: StatusPageData | null;
  filters: Filters;
  debouncedSearch: string;
}

export const useStatusData = ({ data, filters, debouncedSearch }: UseStatusDataParams) => {
  const filteredAssets = useMemo(() => {
    if (!data) return [];

    return data.settings.filter(asset => {
      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase();
        const matchName = asset.name.toLowerCase().includes(term);
        const matchSymbol = asset.symbol.toLowerCase().includes(term);
        if (!matchName && !matchSymbol) return false;
      }

      if (filters.maintenance && !asset.maintenance) return false;
      if (filters.tradeOnly && (asset.withdraw_active || asset.deposit_active)) return false;
      if (filters.fullyIntegrated && !(asset.withdraw_active || asset.deposit_active)) return false;
      if (filters.stakeable && asset.stakeable <= 0) return false;
      if (filters.newAssets && !asset.isNew) return false;
      if (filters.fusion && !asset.fusion) return false;
      if (filters.limitOrder && !asset.limit_order) return false;
      if (filters.margin && (!asset.margin || asset.margin <= 0)) return false;

      return true;
    });
  }, [data, filters, debouncedSearch]);

  const groupedAssets = useMemo<GroupedAssets>(() => {
    const grouped: Record<string, AssetGroup> = {};

    const groupNameMap: Record<string, string> = {
      coin: 'Coin/Token',
      token: 'Coin/Token',
      fiat_earn: 'Cash Plus',
      leveraged_token: 'Leverage',
      security_token: 'Security',
      metal: 'Metal',
      stock: 'Stock',
      etf: 'ETF',
      etc: 'ETC',
      index: 'Index',
    };

    const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

    for (const asset of filteredAssets) {
      let typeName = (asset.asset_type_name || '').toLowerCase();
      if (typeName === 'cryptocoin') {
        typeName = 'Crypto';
      } else {
        typeName = capitalize(typeName);
      }

      const rawGroupName = (asset.asset_group_name || '').toLowerCase();
      let groupName = groupNameMap[rawGroupName];

      if (!groupName) {
        groupName = rawGroupName.split('_').map(word => capitalize(word)).join(' ');
      }

      const groupKey = `${typeName}-${groupName}`;
      if (!grouped[groupKey]) {
        grouped[groupKey] = { typeName, groupName, assets: [] };
      }
      grouped[groupKey].assets.push(asset);
    }

    Object.values(grouped).forEach(group => {
      group.assets.sort((a, b) => a.name.localeCompare(b.name));
    });

    return Object.entries(grouped).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
  }, [filteredAssets]);

  const importantUpdates = useMemo(() => {
    if (!data?.updates) return [];

    const sorted = [...data.updates].sort((a, b) => {
      const aPinned = Boolean(a.isPinned);
      const bPinned = Boolean(b.isPinned);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime();
    });

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const hasActiveFilters = filters.maintenance || filters.tradeOnly || filters.fullyIntegrated
      || filters.stakeable || filters.newAssets || filters.fusion || filters.limitOrder || filters.margin;

    return sorted.filter(update => {
      const isRecent = new Date(update.changed_at) > oneYearAgo;
      const statusToken = getUpdateStatusToken(update.new_status);
      const isActive = ['scheduled', 'in_progress', 'in progress'].includes(statusToken);

      if (!(isRecent || isActive)) return false;

      const statusText = statusToText(update.new_status).toLowerCase();
      const componentName = (update.component_name || '').toLowerCase();
      const description = (update.description || '').toLowerCase();

      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase();
        const matchName = componentName.includes(term);
        const matchStatus = statusText.includes(term);
        const matchDescription = description.includes(term);
        if (!(matchName || matchStatus || matchDescription)) return false;
      }

      if (hasActiveFilters) {
        if (filters.stakeable && !statusText.includes('stakeable') && !statusText.includes('staking')) return false;
        if (filters.fusion && !statusText.includes('fusion')) return false;
        if (filters.newAssets && !statusText.includes('new')) return false;
        if (filters.maintenance && !statusText.includes('maintenance') && !statusText.includes('scheduled') && !statusText.includes('in_progress')) return false;
        if (filters.fullyIntegrated && !statusText.includes('deposit') && !statusText.includes('withdraw')) return false;
        if (filters.limitOrder && !statusText.includes('limit order') && !statusText.includes('limit_order')) return false;
        if (filters.margin && !statusText.includes('margin')) return false;
        if (filters.tradeOnly && !statusText.includes('trade') && !statusText.includes('buy') && !statusText.includes('sell')) return false;
      }

      return true;
    });
  }, [data, debouncedSearch, filters]);

  return {
    groupedAssets,
    importantUpdates,
  };
};
