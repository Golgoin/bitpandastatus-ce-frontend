'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo, faShareNodes, faTimes } from '@fortawesome/free-solid-svg-icons';
import type { AssetNetwork, AssetSetting } from '../../lib/api';
import type { UpdateLogWithPin } from '../../lib/contracts';
import { renderStatusLines, STATUS_SYMBOLS, formatStakingInterest } from './StatusRenderer';

interface AssetDetailsModalProps {
  asset: AssetSetting;
  updates: UpdateLogWithPin[];
  onClose: () => void;
  renderDescriptionLine: (line: string) => React.ReactNode;
}

const ASSET_SETTING_ROWS: Array<Array<{ key: keyof AssetSetting; label: string }>> = [
  [
    { key: 'buy_active', label: 'Buy' },
    { key: 'sell_active', label: 'Sell' },
    { key: 'limit_order', label: 'Limit Order' },
    { key: 'stakeable', label: 'Stakeable' },
  ],
  [
    { key: 'deposit_active', label: 'Deposit' },
    { key: 'withdraw_active', label: 'Withdraw' },
    { key: 'fusion', label: 'Fusion' },
    { key: 'margin', label: 'Margin' },
  ],
];

const BOOLEAN_SETTING_KEYS: Array<keyof AssetSetting> = [
  'buy_active',
  'sell_active',
  'withdraw_active',
  'deposit_active',
  'limit_order',
  'fusion',
];

const formatAssetSettingValue = (key: keyof AssetSetting, value: AssetSetting[keyof AssetSetting]) => {
  if (key === 'stakeable' && typeof value === 'number') {
    const formatted = formatStakingInterest(value);
    return formatted ?? STATUS_SYMBOLS.false;
  }

  if (key === 'margin' && typeof value === 'number') {
    return value > 0 ? `x${value}` : STATUS_SYMBOLS.false;
  }

  if (BOOLEAN_SETTING_KEYS.includes(key)) {
    if (value === null) return STATUS_SYMBOLS.null;
    if (typeof value === 'boolean') return STATUS_SYMBOLS[String(value)];
    return '-';
  }

  if (value === undefined || value === '') return '-';

  return String(value);
};

const GROUP_NAME_MAP: Record<string, string> = {
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

const formatTypeName = (rawTypeName: string | null | undefined) => {
  const rawType = (rawTypeName || '').trim().toLowerCase();
  if (!rawType) return '-';
  if (rawType === 'cryptocoin') return 'Crypto';
  return capitalize(rawType);
};

const formatGroupName = (rawGroupName: string | null | undefined) => {
  const rawGroup = (rawGroupName || '').trim().toLowerCase();
  if (!rawGroup) return '-';
  return GROUP_NAME_MAP[rawGroup] ?? rawGroup.split('_').map(capitalize).join(' ');
};

const NETWORK_BOOLEAN_SETTING_KEYS: Array<keyof AssetNetwork> = [
  'is_deposit_allowed',
  'is_withdraw_allowed',
];

const formatNetworkSettingValue = (key: keyof AssetNetwork, value: AssetNetwork[keyof AssetNetwork]) => {
  if (NETWORK_BOOLEAN_SETTING_KEYS.includes(key)) {
    if (typeof value === 'boolean') return STATUS_SYMBOLS[String(value)];
    return '-';
  }

  if (value === null || value === undefined || value === '') return '-';

  return String(value);
};

export default function AssetDetailsModal({
  asset,
  updates,
  onClose,
  renderDescriptionLine,
}: AssetDetailsModalProps) {
  const [expandedUpdates, setExpandedUpdates] = useState<Set<number>>(new Set());
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const shareFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showShareFeedback = useCallback((message: string) => {
    setShareFeedback(message);

    if (shareFeedbackTimeoutRef.current) {
      clearTimeout(shareFeedbackTimeoutRef.current);
    }

    shareFeedbackTimeoutRef.current = setTimeout(() => {
      setShareFeedback(null);
      shareFeedbackTimeoutRef.current = null;
    }, 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current) {
        clearTimeout(shareFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const toggleUpdate = useCallback((index: number) => {
    setExpandedUpdates(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const shareDetails = useCallback(async () => {
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Status Dashboard';

    if (navigator.share) {
      try {
        await navigator.share({
          title: siteName,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') {
          console.error(error);
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      showShareFeedback('URL copied to clipboard.');
    } catch (error) {
      console.error(error);
      showShareFeedback('Could not copy URL.');
    }
  }, [showShareFeedback]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;

    const getFocusableElements = () => {
      if (!dialog) return [] as HTMLElement[];

      return Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
    };

    const focusInitialElement = () => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
        return;
      }

      const [firstFocusable] = getFocusableElements();
      if (firstFocusable) {
        firstFocusable.focus();
        return;
      }

      dialog?.focus();
    };

    const frame = requestAnimationFrame(focusInitialElement);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || activeElement === dialog) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const networks = asset.networks ?? [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-details-title"
        tabIndex={-1}
        className="w-[96vw] md:w-[88vw] xl:w-[78vw] max-w-[640px] max-h-[92vh] bg-neutrals-card_fill_primary border border-roadmap-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-start justify-between p-4 border-b border-roadmap-border ${asset.maintenance ? 'bg-orange-900/10' : ''}`}>
          <div>
            <h2 id="asset-details-title" className="text-xl sm:text-2xl font-bold text-white">
              {asset.name} <span className="text-grass-stain-green">({asset.symbol})</span>
              {asset.maintenance ? <span className="ml-2" title="Maintenance">🚧</span> : null}
              {asset.isNew ? <span className="ml-2 text-xs bg-blue-600 text-white px-1 rounded align-middle" title="New asset">NEW</span> : null}
            </h2>
            <p className="text-xs sm:text-sm text-platinum-gray mt-1">
              Type: <span className="text-white">{formatTypeName(asset.asset_type_name)}</span>
              <span className="mx-2 text-roadmap-border">•</span>
              Group: <span className="text-white">{formatGroupName(asset.asset_group_name)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Share asset details"
              title="Share"
              className="text-platinum-gray hover:text-white transition-colors cursor-pointer p-2"
              onClick={shareDetails}
            >
              <FontAwesomeIcon icon={faShareNodes} />
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close asset details"
              className="text-platinum-gray hover:text-white transition-colors cursor-pointer p-2"
              onClick={onClose}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {shareFeedback ? (
          <p role="status" aria-live="polite" className="px-4 pt-2 text-xs text-grass-stain-green">
            {shareFeedback}
          </p>
        ) : null}

        <div className="overflow-y-auto max-h-[calc(92vh-88px)]">
          <section className="bg-neutrals-card_fill_primary/10 border-b border-roadmap-border overflow-hidden">
            {ASSET_SETTING_ROWS.map((rowItems, rowIndex) => (
              <div
                key={`asset-settings-row-${rowIndex}`}
                className={`grid grid-cols-4 ${rowIndex > 0 ? 'border-t border-roadmap-border/60' : ''}`}
              >
                {rowItems.map(({ key, label }, index) => (
                  <div
                    key={String(key)}
                    className={`p-2 text-center ${index < rowItems.length - 1 ? 'border-r border-roadmap-border/60' : ''}`}
                  >
                    <div className="text-[11px] uppercase tracking-wide text-platinum-gray">{label}</div>
                    <div className="text-sm text-white mt-1">{formatAssetSettingValue(key, asset[key])}</div>
                  </div>
                ))}
              </div>
            ))}
          </section>

          {networks.length > 0 ? (
            <section className="bg-neutrals-card_fill_primary/10 border-b border-roadmap-border overflow-hidden">
              <div className="flex items-center px-3 py-2 border-b border-roadmap-border">
                <span className="text-xs w-9 text-center font-bold px-2 py-0.5 rounded mr-3 bg-deep-evergreen text-grass-stain-green">
                  {networks.length}
                </span>
                <span className="text-sm sm:text-base text-white font-bold">Available Networks</span>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-[28vh] bg-neutrals-card_fill_primary/10">
                <table className="w-full text-xs sm:text-sm text-platinum-gray" aria-label="Available asset networks">
                  <thead className="text-xs border-b border-roadmap-border sticky top-0 bg-neutrals-card_fill_primary z-10">
                    <tr>
                      <th className="p-0.5 pl-2 text-left">Network</th>
                      <th className="p-0.5 text-center" title="Deposit allowed" aria-label="Deposit allowed">Dep</th>
                      <th className="p-0.5 text-center" title="Withdraw allowed" aria-label="Withdraw allowed">Wdr</th>
                      <th className="p-0.5 text-right">Min dep.</th>
                      <th className="p-0.5 text-right">Dep fee</th>
                      <th className="p-0.5 text-right">Free dep.</th>
                      <th className="p-0.5 text-right">Min wdr.</th>
                      <th className="p-0.5 pr-2 text-right">Wdr fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-roadmap-border/50">
                    {networks.map((network) => (
                      <tr key={network.id} className="hover:bg-neutrals-card_fill_secondary/30 transition-colors">
                        <td className="px-0.5 pl-2 py-0.5 text-white min-w-[140px]">
                          <div className="flex items-center gap-2">
                            {network.logo_dark ? (
                              <Image
                                src={network.logo_dark}
                                alt=""
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                            ) : null}
                            <span className="truncate">{network.name}</span>
                          </div>
                        </td>
                        <td className="p-0.5 text-center">{formatNetworkSettingValue('is_deposit_allowed', network.is_deposit_allowed)}</td>
                        <td className="p-0.5 text-center">{formatNetworkSettingValue('is_withdraw_allowed', network.is_withdraw_allowed)}</td>
                        <td className="p-0.5 text-right text-white tabular-nums">{formatNetworkSettingValue('minimum_deposit_amount', network.minimum_deposit_amount)}</td>
                        <td className="p-0.5 text-right text-white tabular-nums">{formatNetworkSettingValue('wallet_deposit_fee', network.wallet_deposit_fee)}</td>
                        <td className="p-0.5 text-right text-white tabular-nums">{formatNetworkSettingValue('free_deposit_min_threshold', network.free_deposit_min_threshold)}</td>
                        <td className="p-0.5 text-right text-white tabular-nums">{formatNetworkSettingValue('minimum_withdrawal_amount', network.minimum_withdrawal_amount)}</td>
                        <td className="px-0.5 pr-2 py-0.5 text-right text-white tabular-nums">{formatNetworkSettingValue('wallet_withdrawal_fee', network.wallet_withdrawal_fee)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="bg-neutrals-card_fill_primary/10 border-b border-roadmap-border overflow-hidden">
            <div className="flex items-center px-3 py-2 border-b border-roadmap-border">
              <span className="text-xs w-9 text-center font-bold px-2 py-0.5 rounded mr-3 bg-deep-evergreen text-grass-stain-green">
                {updates.length}
              </span>
              <span className="text-sm sm:text-base text-white font-bold">Associated Updates</span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[24vh] bg-neutrals-card_fill_primary/10">
              {updates.length === 0 ? (
                <div className="text-sm text-platinum-gray py-8 text-center">No updates found for this asset.</div>
              ) : (
                <table className="w-full text-left text-sm text-platinum-gray" aria-label="Associated asset updates">
                  <thead className="text-xs text-platinum-gray border-b border-roadmap-border sticky top-0 bg-neutrals-card_fill_primary z-10">
                    <tr>
                      <th className="p-0.5 pl-2">New Status</th>
                      <th className="p-0.5 pr-2 text-right">Changed at</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-roadmap-border/50">
                    {updates.map((update, index) => {
                      const isMultiAssetsUpdate = /^multiple assets/i.test((update.component_name || '').trim());
                      const hasDescription = !isMultiAssetsUpdate && Boolean(update.description && update.description.trim() !== '');

                      return (
                        <React.Fragment key={`${update.update_id ?? 'update'}-${update.changed_at}-${index}`}>
                          <tr
                            className={`hover:bg-neutrals-card_fill_secondary/50 transition-colors ${hasDescription ? 'cursor-pointer' : ''}`}
                            onClick={() => hasDescription && toggleUpdate(index)}
                          >
                            <td className="px-0.5 pl-2 py-0.5 text-nowrap">
                              <span className="rounded text-xs sm:text-sm">{renderStatusLines(update.new_status)}</span>
                              {hasDescription ? (
                                <span className="ml-1 text-platinum-gray" title="Show description">
                                  <FontAwesomeIcon icon={faInfo} />
                                </span>
                              ) : null}
                            </td>
                            <td className="px-0.5 pr-2 py-0.5 text-xs sm:text-sm text-right text-nowrap tabular-nums">
                              {new Date(update.changed_at).toLocaleDateString()} - {new Date(update.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>

                          {hasDescription && expandedUpdates.has(index) ? (
                            <tr className="bg-neutrals-card_fill_secondary/30">
                              <td colSpan={2} className="p-0.5 text-xs sm:text-sm text-platinum-gray text-left">
                                {(update.description || '').split(/<BR>/i).map((line, lineIndex) => (
                                  <React.Fragment key={lineIndex}>
                                    {lineIndex > 0 && <br />}
                                    {renderDescriptionLine(line)}
                                  </React.Fragment>
                                ))}
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
