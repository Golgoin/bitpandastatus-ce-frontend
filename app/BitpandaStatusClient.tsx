'use client';

import React, { useCallback, useState } from 'react';
import type { SearchParamsRecord, StatusPageData } from '../lib/contracts';
import SearchAndFilters from '../components/status/SearchAndFilters';
import UpdatesSection from '../components/status/UpdatesSection';
import AssetGroupsSection from '../components/status/AssetGroupsSection';
import { useStatusUrlState } from '../features/status/hooks/useStatusUrlState';
import { useStatusData } from '../features/status/hooks/useStatusData';

interface BitpandaStatusClientProps {
  data: StatusPageData | null;
  searchParams: SearchParamsRecord;
}

export default function BitpandaStatusClient({ data, searchParams }: BitpandaStatusClientProps) {
  const [expandedUpdates, setExpandedUpdates] = useState<Set<number>>(new Set());
  const [visibleUpdatesCount, setVisibleUpdatesCount] = useState(200);
  const [expandedGroupAssets, setExpandedGroupAssets] = useState<Set<string>>(new Set());

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

  const shareSearch = useCallback(() => {
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Status Dashboard';
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: siteName,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('URL copied to clipboard!');
    }
  }, []);

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
        <p className="text-sm sm:text-base font-light text-white">
          Your community made alternative for{' '}
          <a
            href="https://status.bitpanda.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-medium"
          >
            status.bitpanda.com
          </a>
        </p>
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
    </main>
  );
}
