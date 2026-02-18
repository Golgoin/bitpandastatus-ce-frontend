import { redirect } from 'next/navigation';
import { getAssetData } from '../../lib/api';
import type { SearchParamsRecord } from '../../lib/contracts';

export const dynamic = 'force-dynamic';

const ASSET_NOT_FOUND_FLASH_ROUTE = '/api/flash-asset-not-found';

interface SymbolAliasPageProps {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

const getSearchParamString = (value: string | string[] | undefined) => (
  Array.isArray(value) ? value[0] ?? '' : value ?? ''
);

const isValidSymbol = (symbol: string) => /^[a-z0-9]{2,15}$/i.test(symbol);

const buildFlashRedirectUrl = (symbol: string, returnTo: string) => (
  `${ASSET_NOT_FOUND_FLASH_ROUTE}?symbol=${encodeURIComponent(symbol)}&returnTo=${encodeURIComponent(returnTo)}`
);

export default async function SymbolAliasPage(props: SymbolAliasPageProps) {
  const [{ symbol }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const requestedSymbol = (symbol || '').trim();
  const normalizedSymbol = requestedSymbol.toLowerCase();

  const baseParams = new URLSearchParams();
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (key === 'details') return;

    const normalizedValue = getSearchParamString(value).trim();
    if (!normalizedValue) return;

    baseParams.set(key, normalizedValue);
  });

  const returnTo = baseParams.toString() ? `/?${baseParams.toString()}` : '/';

  if (!isValidSymbol(normalizedSymbol)) {
    redirect(buildFlashRedirectUrl(requestedSymbol || 'unknown', returnTo));
  }

  const data = await getAssetData();

  // Avoid false negatives when upstream APIs are temporarily unavailable.
  if (data?.settings?.length) {
    const symbolExists = data.settings.some(
      asset => asset.symbol.trim().toLowerCase() === normalizedSymbol
    );

    if (!symbolExists) {
      redirect(buildFlashRedirectUrl(normalizedSymbol, returnTo));
    }
  }

  const nextParams = new URLSearchParams(baseParams.toString());
  nextParams.set('details', normalizedSymbol);

  const nextQuery = nextParams.toString();
  redirect(nextQuery ? `/?${nextQuery}` : '/');
}
