'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import type { AssetSetting } from '../../lib/api';
import type { GroupedAssets } from '../../features/status/hooks/useStatusData';
import { formatStakingInterest, STATUS_SYMBOLS } from './StatusRenderer';

interface AssetGroupsSectionProps {
  groupedAssets: GroupedAssets;
  debouncedSearch: string;
  expandedGroupAssets: Set<string>;
  onExpandGroup: (groupKey: string) => void;
  onAssetClick: (asset: AssetSetting) => void;
}

export default function AssetGroupsSection({
  groupedAssets,
  debouncedSearch,
  expandedGroupAssets,
  onExpandGroup,
  onAssetClick,
}: AssetGroupsSectionProps) {
  return (
    <section aria-label="Asset categories" className="space-y-2">
      {groupedAssets.length === 0 ? (
        <div className="text-center text-platinum-gray py-8">No matching assets found</div>
      ) : (
        groupedAssets.map(([groupKey, group]) => {
          const isCryptoGroup = group.typeName === 'Crypto' && group.groupName === 'Coin/Token';
          const shouldAutoExpand = debouncedSearch.length >= 3 && group.assets.length <= 10;
          const showAllAssets = expandedGroupAssets.has(groupKey);
          const visibleAssets = showAllAssets ? group.assets : group.assets.slice(0, 200);
          const hasMoreAssets = group.assets.length > 200 && !showAllAssets;

          return (
            <details key={groupKey} open={shouldAutoExpand} className="group bg-neutrals-card_fill_primary/30 border border-roadmap-border border-l-4 border-l-roadmap-done hover:border-l-roadmap-done-hover rounded-lg overflow-hidden">
              <summary className="flex items-center p-3 cursor-pointer list-none hover:bg-neutrals-card_fill_secondary transition-colors select-none">
                <span className="text-xs w-11 font-bold items-center text-center justify-center px-2 py-1 rounded mr-3 bg-deep-evergreen text-grass-stain-green">
                  {group.assets.length}
                </span>
                <div className="text-sm sm:text-base flex items-center gap-2 grow">
                  <span className="text-white font-bold">{group.typeName}</span>
                  <span className="text-platinum-gray">-</span>
                  <span className="text-platinum-gray">{group.groupName}</span>
                </div>
                <span className="text-platinum-gray text-sm group-open:rotate-180 transition-transform"><FontAwesomeIcon icon={faChevronUp} /></span>
              </summary>

              <div className="overflow-x-auto max-h-80 border-t border-roadmap-border bg-neutrals-card_fill_primary/10" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}>
                <table className="w-full text-left text-sm text-platinum-gray" aria-label={`${group.typeName} ${group.groupName} status`}>
                  <thead className="text-xs text-platinum-gray border-b border-roadmap-border sticky top-0 bg-neutrals-card_fill_primary z-10">
                    <tr>
                      <th className="p-0.5 pl-2">Name</th>
                      <th className="p-0.5">Symbol</th>
                      <th className="p-0.5 text-center">Buy</th>
                      <th className="p-0.5 text-center">Sell</th>
                      {isCryptoGroup && (
                        <>
                          <th className="p-0.5 text-center" title="Withdraw Active"><FontAwesomeIcon icon={faArrowUp} /></th>
                          <th className="p-0.5 text-center" title="Deposit Active"><FontAwesomeIcon icon={faArrowDown} /></th>
                          <th className="p-0.5 text-center">Limit</th>
                          <th className="p-0.5 text-center">Fusion</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-roadmap-border/50">
                    {visibleAssets.map(asset => {
                      const stakingInterestLabel = formatStakingInterest(asset.stakeable);

                      return (
                        <tr
                          key={asset.pid}
                          tabIndex={0}
                          onClick={() => onAssetClick(asset)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onAssetClick(asset);
                            }
                          }}
                          className={`cursor-pointer hover:bg-neutrals-card_fill_secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grass-stain-green ${asset.maintenance ? 'bg-orange-900/10' : ''}`}
                        >
                          <td className="px-1 pl-2 py-1 wrap-anywhere font-medium text-xs sm:text-sm text-white">
                            {asset.name}
                            {asset.margin > 0 && <span className="ml-2 text-orange-400 text-xs font-bold">x{asset.margin}</span>}
                            {stakingInterestLabel && <span className="ml-2 text-sky-300 text-xs font-semibold tabular-nums">{stakingInterestLabel}</span>}
                            {asset.maintenance && <span className="ml-2" title="Maintenance">🚧</span>}
                            {asset.isNew && <span className="ml-2 text-xs bg-blue-600 text-white px-1 rounded">NEW</span>}
                          </td>
                          <td className="px-1 py-1 font-mono text-xs sm:text-sm">{asset.symbol}</td>
                          <td className="px-1 py-1 text-xs sm:text-sm text-center">{STATUS_SYMBOLS[String(asset.buy_active)]}</td>
                          <td className="px-1 py-1 text-xs sm:text-sm text-center">{STATUS_SYMBOLS[String(asset.sell_active)]}</td>
                          {isCryptoGroup && (
                            <>
                              <td className="px-1 py-1 text-xs sm:text-sm text-center">{STATUS_SYMBOLS[String(asset.withdraw_active)]}</td>
                              <td className="px-1 py-1 text-xs sm:text-sm text-center">{STATUS_SYMBOLS[String(asset.deposit_active)]}</td>
                              <td className="px-1 py-1 text-xs sm:text-sm text-center">{STATUS_SYMBOLS[String(asset.limit_order)]}</td>
                              <td className="px-1 py-1 text-xs sm:text-sm text-center">{STATUS_SYMBOLS[String(asset.fusion)]}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {hasMoreAssets && (
                  <div className="p-3 border-t border-roadmap-border text-center">
                    <button
                      onClick={() => onExpandGroup(groupKey)}
                      className="text-sm text-grass-stain-green hover:text-roadmap-upcoming-hover transition-colors cursor-pointer"
                    >
                      Load all ({group.assets.length - 200} more)
                    </button>
                  </div>
                )}
              </div>
            </details>
          );
        })
      )}
    </section>
  );
}
