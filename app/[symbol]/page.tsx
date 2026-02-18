import { notFound, redirect } from 'next/navigation';
import { getAssetData } from '../../lib/api';
import type { SearchParamsRecord } from '../../lib/contracts';

export const dynamic = 'force-dynamic';

interface SymbolAliasPageProps {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

const getSearchParamString = (value: string | string[] | undefined) => (
  Array.isArray(value) ? value[0] ?? '' : value ?? ''
);

const isValidSymbol = (symbol: string) => /^[a-z0-9]{2,15}$/i.test(symbol);

export default async function SymbolAliasPage(props: SymbolAliasPageProps) {
  const [{ symbol }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const normalizedSymbol = (symbol || '').trim().toLowerCase();

  if (!isValidSymbol(normalizedSymbol)) {
    notFound();
  }

  const data = await getAssetData();

  // Avoid false 404s when upstream APIs are temporarily unavailable.
  if (data?.settings?.length) {
    const symbolExists = data.settings.some(
      asset => asset.symbol.trim().toLowerCase() === normalizedSymbol
    );

    if (!symbolExists) {
      notFound();
    }
  }

  const nextParams = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (key === 'details') return;

    const normalizedValue = getSearchParamString(value).trim();
    if (!normalizedValue) return;

    nextParams.set(key, normalizedValue);
  });

  nextParams.set('details', normalizedSymbol);

  const nextQuery = nextParams.toString();
  redirect(nextQuery ? `/?${nextQuery}` : '/');
}
