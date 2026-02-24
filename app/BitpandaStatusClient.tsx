'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AssetSetting } from '../lib/api';
import type { SearchParamsRecord, StatusPageData, UpdateLogWithPin } from '../lib/contracts';
import { getSearchParamString } from '../lib/url';
import { matchesAssetUpdate } from '../lib/updates';
import SearchAndFilters from '../components/status/SearchAndFilters';
import UpdatesSection from '../components/status/UpdatesSection';
import AssetGroupsSection from '../components/status/AssetGroupsSection';
import AssetDetailsModal from '../components/status/AssetDetailsModal';
import { useStatusUrlState } from '../features/status/hooks/useStatusUrlState';
import { useStatusData } from '../features/status/hooks/useStatusData';

const ASSET_NOT_FOUND_COOKIE = 'bp_asset_not_found';

interface BitpandaStatusClientProps {
  data: StatusPageData | null;
  searchParams: SearchParamsRecord;
  assetNotFoundSymbol?: string | null;
}

export default function BitpandaStatusClient({
  data,
  searchParams,
  assetNotFoundSymbol,
}: BitpandaStatusClientProps) {
  const [expandedUpdates, setExpandedUpdates] = useState<Set<number>>(new Set());
  const [visibleUpdatesCount, setVisibleUpdatesCount] = useState(200);
  const [expandedGroupAssets, setExpandedGroupAssets] = useState<Set<string>>(new Set());
  const [selectedAsset, setSelectedAsset] = useState<AssetSetting | null>(() => {
    const detailsParam = getSearchParamString(searchParams?.details).trim().toLowerCase();
    if (!detailsParam || !data?.settings?.length) return null;
    return data.settings.find(asset => asset.symbol.trim().toLowerCase() === detailsParam) ?? null;
  });
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [assetNotFoundFeedback, setAssetNotFoundFeedback] = useState<string | null>(() => {
    if (!assetNotFoundSymbol) return null;
    return `Asset "${assetNotFoundSymbol.toUpperCase()}" was not found.`;
  });

  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasModalOpenRef = useRef(false);
  const detailsHistoryPushedRef = useRef(false);
  const shareFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assetNotFoundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (!assetNotFoundSymbol) return;

    document.cookie = `${ASSET_NOT_FOUND_COOKIE}=; path=/; max-age=0; samesite=lax`;

    if (assetNotFoundTimeoutRef.current) {
      clearTimeout(assetNotFoundTimeoutRef.current);
    }

    assetNotFoundTimeoutRef.current = setTimeout(() => {
      setAssetNotFoundFeedback(null);
      assetNotFoundTimeoutRef.current = null;
    }, 4000);
  }, [assetNotFoundSymbol]);

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current) {
        clearTimeout(shareFeedbackTimeoutRef.current);
      }

      if (assetNotFoundTimeoutRef.current) {
        clearTimeout(assetNotFoundTimeoutRef.current);
      }
    };
  }, []);

  const resetPagination = useCallback(() => {
    setVisibleUpdatesCount(200);
    setExpandedGroupAssets(new Set());
  }, []);

  const {
    search,
    debouncedSearch,
    filters,
    onSearchChange,
    clearSearch,
    commitSearchToUrl,
    toggleFilter,
  } = useStatusUrlState({ searchParams, onResetPagination: resetPagination });

  const { groupedAssets, importantUpdates } = useStatusData({
    data,
    filters,
    debouncedSearch,
  });

  const updates = data?.updates;
  const settings = data?.settings;

  const findAssetBySymbol = useCallback((symbolParam: string | null) => {
    const normalizedSymbol = (symbolParam || '').trim().toLowerCase();
    if (!normalizedSymbol || !settings?.length) return null;

    return settings.find(asset => asset.symbol.trim().toLowerCase() === normalizedSymbol) ?? null;
  }, [settings]);

  const setDetailsParamInHistory = useCallback((symbolParam: string | null, mode: 'push' | 'replace') => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const normalizedSymbol = (symbolParam || '').trim().toLowerCase();

    if (normalizedSymbol) {
      params.set('details', normalizedSymbol);
    } else {
      params.delete('details');
    }

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;

    if (mode === 'push') {
      window.history.pushState(null, '', nextUrl);
      return;
    }

    window.history.replaceState(null, '', nextUrl);
  }, []);

  const openAssetDetails = useCallback((asset: AssetSetting) => {
    if (typeof window !== 'undefined') {
      const activeElement = document.activeElement;
      lastFocusedElementRef.current = activeElement instanceof HTMLElement ? activeElement : null;

      const params = new URLSearchParams(window.location.search);
      const hasCurrentDetails = Boolean((params.get('details') || '').trim());
      const mode: 'push' | 'replace' = hasCurrentDetails ? 'replace' : 'push';
      detailsHistoryPushedRef.current = mode === 'push';
      setDetailsParamInHistory(asset.symbol, mode);
    }

    setSelectedAsset(asset);
  }, [setDetailsParamInHistory]);

  const closeAssetDetails = useCallback(() => {
    if (typeof window !== 'undefined' && detailsHistoryPushedRef.current) {
      detailsHistoryPushedRef.current = false;
      window.history.back();
      return;
    }

    setSelectedAsset(null);
    setDetailsParamInHistory(null, 'replace');
  }, [setDetailsParamInHistory]);

  const applySelectedAssetFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const detailsParam = params.get('details');

    detailsHistoryPushedRef.current = Boolean((detailsParam || '').trim());

    const assetFromUrl = findAssetBySymbol(detailsParam);
    setSelectedAsset(assetFromUrl);
  }, [findAssetBySymbol]);

  useEffect(() => {
    if (typeof window === 'undefined' || !settings?.length) return;

    const onPopState = () => applySelectedAssetFromUrl();
    window.addEventListener('popstate', onPopState);

    return () => window.removeEventListener('popstate', onPopState);
  }, [settings, applySelectedAssetFromUrl]);

  useEffect(() => {
    if (selectedAsset) {
      wasModalOpenRef.current = true;
      return;
    }

    if (!wasModalOpenRef.current) return;

    wasModalOpenRef.current = false;
    const elementToFocus = lastFocusedElementRef.current;

    if (elementToFocus) {
      requestAnimationFrame(() => elementToFocus.focus());
    }
  }, [selectedAsset]);

  const selectedAssetUpdates = useMemo<UpdateLogWithPin[]>(() => {
    if (!selectedAsset || !updates?.length) return [];

    return updates
      .filter((update) => matchesAssetUpdate(selectedAsset, update))
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }, [selectedAsset, updates]);

  const toggleUpdate = useCallback((idx: number) => {
    setExpandedUpdates(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }, []);

  const shareSearch = useCallback(async () => {
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

  const renderDescriptionLine = useCallback((line: string) => {
    const regex = /<a\s+href=['"]([^'"]+)['"]>(.*?)<\/a>/gi;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      const href = match[1];
      const text = match[2] || href;
      parts.push(
        <a
          key={`${href}-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-grass-stain-green hover:text-roadmap-upcoming-hover underline"
        >
          {text}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return parts.length ? parts : line;
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-2">
      <header className="grid grid-cols-1 text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-sans text-white">Bitpanda Status</h1>
        <h2 className="text-lg sm:text-xl font-medium text-grass-stain-green mb-1">Community Edition</h2>
      </header>

      <SearchAndFilters
        search={search}
        filters={filters}
        onSearchChange={onSearchChange}
        onSearchCommit={commitSearchToUrl}
        onClearSearch={clearSearch}
        onShareSearch={shareSearch}
        onToggleFilter={toggleFilter}
      />

      {assetNotFoundFeedback ? (
        <div className="pointer-events-none fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-md border border-yellow-300/40 bg-black/85 px-3 py-2 shadow-lg backdrop-blur-sm">
          <p role="status" aria-live="polite" className="text-xs text-yellow-200">
            {assetNotFoundFeedback}
          </p>
        </div>
      ) : null}

      {shareFeedback ? (
        <p role="status" aria-live="polite" className="text-center text-xs text-grass-stain-green">
          {shareFeedback}
        </p>
      ) : null}

      <UpdatesSection
        updates={importantUpdates}
        expandedUpdates={expandedUpdates}
        visibleUpdatesCount={visibleUpdatesCount}
        onToggleUpdate={toggleUpdate}
        onLoadAll={() => setVisibleUpdatesCount(importantUpdates.length)}
        renderDescriptionLine={renderDescriptionLine}
      />

      <AssetGroupsSection
        groupedAssets={groupedAssets}
        debouncedSearch={debouncedSearch}
        expandedGroupAssets={expandedGroupAssets}
        onExpandGroup={(groupKey) => setExpandedGroupAssets(prev => new Set([...prev, groupKey]))}
        onAssetClick={openAssetDetails}
      />

      <section className="text-center pt-8 pb-4">
        <p className="text-sm text-platinum-gray">
          Looking for the official Bitpanda status page? Visit{' '}
          <a
            href="https://status.bitpanda.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-grass-stain-green hover:underline font-medium"
          >
            status.bitpanda.com
          </a>
          .
        </p>
      </section>

      {selectedAsset ? (
        <AssetDetailsModal
          asset={selectedAsset}
          updates={selectedAssetUpdates}
          onClose={closeAssetDetails}
          renderDescriptionLine={renderDescriptionLine}
        />
      ) : null}
    </main>
  );
}
