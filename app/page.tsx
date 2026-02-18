import { Metadata } from "next";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React, { Suspense } from 'react';
import BitpandaStatusClient from './BitpandaStatusClient';
import { getAssetData, type UpdateLog } from '../lib/api';
import type { SearchParamsRecord, UpdateLogWithPin } from '../lib/contracts';
import { getUpdateStatusToken, statusToText } from '../lib/status';
import { getSearchParamString } from '../lib/url';
import Footer from "../components/footer";

export const dynamic = 'force-dynamic';

const ASSET_NOT_FOUND_FLASH_ROUTE = '/api/flash-asset-not-found';
const ASSET_NOT_FOUND_COOKIE = 'bp_asset_not_found';

const buildFlashRedirectUrl = (symbol: string, returnTo: string) => (
  `${ASSET_NOT_FOUND_FLASH_ROUTE}?symbol=${encodeURIComponent(symbol)}&returnTo=${encodeURIComponent(returnTo)}`
);

const applyUpdatePinning = (updates: UpdateLog[]): UpdateLogWithPin[] => {
  if (!updates?.length) return [];

  const getUpdateKey = (update: UpdateLog) => {
    if (typeof update.update_id === 'number') {
      return `id:${update.update_id}`;
    }
    const statusText = statusToText(update.new_status);
    return `fallback:${update.component_name}-${update.changed_at}-${statusText}-${update.old_status ?? ''}`;
  };

  const getMaintenanceGroupKey = (update: UpdateLog) => {
    const description = typeof update.description === 'string' ? update.description : '';
    const match = description.match(/href\s*=\s*['"]([^'"]+)['"]/i);
    if (match?.[1]) {
      return `link:${match[1]}`;
    }
    return `component:${update.component_name}`;
  };

  const extractScheduledTime = (update: UpdateLog) => {
    const descriptionText = typeof update.description === 'string' ? update.description : '';
    const rawText = `${statusToText(update.new_status)} ${descriptionText}`;
    const text = rawText.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ');

    const utcOffsetMatch = text.match(/(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2}):(\d{2})(?::(\d{2}))?\s*UTC([+-]\d{1,2})(?::?(\d{2}))?/i);
    if (utcOffsetMatch) {
      const day = Number(utcOffsetMatch[1]);
      const month = Number(utcOffsetMatch[2]);
      const year = Number(utcOffsetMatch[3]);
      const hour = Number(utcOffsetMatch[4]);
      const minute = Number(utcOffsetMatch[5]);
      const second = Number(utcOffsetMatch[6] ?? 0);
      const offsetStr = utcOffsetMatch[7];
      const offsetSign = offsetStr.startsWith('-') ? -1 : 1;
      const offsetHours = Math.abs(parseInt(offsetStr, 10));
      const offsetMinutes = utcOffsetMatch[8] ? Number(utcOffsetMatch[8]) : 0;
      const totalOffsetMinutes = offsetSign * (offsetHours * 60 + offsetMinutes);
      const utcMillis = Date.UTC(year, month - 1, day, hour, minute, second) - totalOffsetMinutes * 60 * 1000;
      return new Date(utcMillis);
    }

    const patterns = [
      /\b\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/,
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}(?:\s*[AP]M)?(?:\s*[A-Z]{2,5})?\b/i,
      /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\s+\d{1,2}:\d{2}(?:\s*[AP]M)?(?:\s*[A-Z]{2,5})?\b/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const parsed = new Date(match[0]);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    return null;
  };

  const sortedAsc = [...updates].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
  );

  const latestByComponent: Record<string, UpdateLog> = {};
  const latestMaintenanceByKey: Record<string, UpdateLog> = {};
  const maintenanceStatuses = new Set(['scheduled', 'in_progress', 'in progress', 'completed', 'resolved']);

  for (const update of sortedAsc) {
    latestByComponent[update.component_name] = update;

    const status = getUpdateStatusToken(update.new_status);
    const maintenanceKey = getMaintenanceGroupKey(update);
    const hasLinkKey = maintenanceKey.startsWith('link:');
    const isMaintenanceStatus = maintenanceStatuses.has(status);

    if (isMaintenanceStatus || hasLinkKey) {
      latestMaintenanceByKey[maintenanceKey] = update;
    }
  }

  const pinnedUpdates: UpdateLog[] = [];
  const addPinned = (update: UpdateLog) => {
    if (!pinnedUpdates.some(p => getUpdateKey(p) === getUpdateKey(update))) {
      pinnedUpdates.push(update);
    }
  };

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  Object.values(latestMaintenanceByKey).forEach(update => {
    const status = getUpdateStatusToken(update.new_status);

    if (status === 'scheduled') {
      const scheduledTime = extractScheduledTime(update);
      if (scheduledTime && scheduledTime < oneHourAgo) {
        return;
      }
      addPinned(update);
      return;
    }

    if (status === 'in_progress' || status === 'in progress') {
      addPinned(update);
    }
  });

  Object.values(latestByComponent).forEach(update => {
    const status = getUpdateStatusToken(update.new_status);
    if (status === 'investigating' || status === 'monitoring') {
      addPinned(update);
    }
  });

  pinnedUpdates.sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  const pinnedKeys = new Set(pinnedUpdates.map(u => getUpdateKey(u)));
  const otherUpdates = updates.filter(u => !pinnedKeys.has(getUpdateKey(u)));

  return [
    ...pinnedUpdates.map(u => ({ ...u, isPinned: true })),
    ...otherUpdates.map(u => ({ ...u, isPinned: false }))
  ];
};

export async function generateMetadata(): Promise<Metadata> {
  const data = await getAssetData();

  const totalAssets = data?.settings?.length ?? 0;
  const maintenanceCount = data?.settings?.filter(a => a.maintenance).length ?? 0;

  // Get recent updates (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentUpdates = data?.updates?.filter(
    u => new Date(u.changed_at) > oneDayAgo
  ).length ?? 0;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://your-site.com";
  const baseTitle = process.env.NEXT_PUBLIC_SITE_NAME ?? "Bitpanda Status - Community Edition";
  const title = maintenanceCount > 0
    ? `${baseTitle}`
    : baseTitle;

  const description = `Your community made place to track the status of all ${totalAssets} assets listed on Bitpanda. ${recentUpdates} updates in the last 24h.`;

  return {
    title,
    description,
    keywords: "status.bitpanda.com, Bitpanda status, Bitpanda down, Bitpanda maintenance, Bitpanda asset status, Bitpanda deposit disabled, Bitpanda wallet status, Bitpanda available assets, Bitpanda updates, Can't send Bitpanda, Bitpanda staking, Bitpanda fusion, Bitpanda limit orders, Bitpanda margin trading, Bitpanda component updates, Bitpanda schedule maintenance",
    openGraph: {
      title,
      description,
      url: baseUrl,
      type: "website",
      siteName: baseTitle,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: baseUrl,
    },
  };
}

export default async function BitpandaStatusPage(props: {
  searchParams: Promise<SearchParamsRecord>
}) {
  const searchParams = await props.searchParams;
  const data = await getAssetData();

  if (data?.settings?.length) {
    const detailsParam = getSearchParamString(searchParams?.details).trim().toLowerCase();

    if (detailsParam) {
      const symbolExists = data.settings.some(
        asset => asset.symbol.trim().toLowerCase() === detailsParam
      );

      if (!symbolExists) {
        const returnParams = new URLSearchParams();

        Object.entries(searchParams ?? {}).forEach(([key, value]) => {
          if (key === 'details') return;

          const normalizedValue = getSearchParamString(value).trim();
          if (!normalizedValue) return;

          returnParams.set(key, normalizedValue);
        });

        const returnTo = returnParams.toString() ? `/?${returnParams.toString()}` : '/';
        redirect(buildFlashRedirectUrl(detailsParam, returnTo));
      }
    }
  }

  const cookieStore = await cookies();
  const assetNotFoundSymbol = cookieStore.get(ASSET_NOT_FOUND_COOKIE)?.value ?? null;

  const transformed = data
    ? {
      ...data,
      updates: applyUpdatePinning(data.updates),
    }
    : null;

  if (!transformed) {
    return <div className="max-w-7xl mx-auto p-4 text-white">Failed to load data</div>;
  }

  // JSON-LD structured data
  const totalAssets = data?.settings?.length ?? 0;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://your-site.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Bitpanda Status - Community Edition";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": `${siteName}`,
            "item": baseUrl
          }
        ]
      },
      {
        "@type": "WebPage",
        "@id": baseUrl,
        "url": baseUrl,
        "name": `${siteName}`,
        "description": `Real-time status monitor for ${totalAssets} Bitpanda assets. Check deposit, withdraw, staking, trading status and more in real-time.`,
        "isPartOf": {
          "@type": "WebSite",
          "name": siteName,
          "url": baseUrl
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="max-w-7xl mx-auto p-4 text-white">Loading...</div>}>
        <BitpandaStatusClient
          data={transformed}
          searchParams={searchParams}
          assetNotFoundSymbol={assetNotFoundSymbol}
        />
        <Footer />
      </Suspense>
    </>
  );
}
