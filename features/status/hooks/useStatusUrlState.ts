'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchParamsRecord } from '../../../lib/contracts';
import { INITIAL_FILTERS, type Filters } from '../types';

interface UseStatusUrlStateParams {
  searchParams: SearchParamsRecord;
  onResetPagination: () => void;
}

const getInitialSearch = (searchParams: SearchParamsRecord) => (
  typeof searchParams?.search === 'string' ? searchParams.search : ''
);

const getInitialFilters = (searchParams: SearchParamsRecord): Filters => {
  const parsedFilters = { ...INITIAL_FILTERS };
  (Object.keys(INITIAL_FILTERS) as Array<keyof Filters>).forEach(key => {
    if (searchParams?.[key] === 'true') {
      parsedFilters[key] = true;
    }
  });
  return parsedFilters;
};

export const useStatusUrlState = ({ searchParams, onResetPagination }: UseStatusUrlStateParams) => {
  const initialSearch = getInitialSearch(searchParams);

  const committedSearchRef = useRef<string>(initialSearch);
  const [search, setSearch] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [filters, setFilters] = useState<Filters>(() => getInitialFilters(searchParams));

  const buildUrlParams = useCallback((searchValue: string, activeFilters: Filters, baseParams?: URLSearchParams) => {
    const params = new URLSearchParams(baseParams?.toString() ?? '');

    params.delete('search');
    (Object.keys(INITIAL_FILTERS) as Array<keyof Filters>).forEach(key => {
      params.delete(key);
    });

    if (searchValue) params.set('search', searchValue);
    (Object.keys(activeFilters) as Array<keyof Filters>).forEach(key => {
      if (activeFilters[key]) params.set(key, 'true');
    });

    return params;
  }, []);

  const replaceUrlState = useCallback((searchValue: string, activeFilters: Filters) => {
    if (typeof window === 'undefined') return;
    const currentParams = new URLSearchParams(window.location.search);
    const params = buildUrlParams(searchValue, activeFilters, currentParams);
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [buildUrlParams]);

  const parseLocationSearch = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const parsedSearch = params.get('search') ?? '';
    const parsedFilters = { ...INITIAL_FILTERS };

    (Object.keys(INITIAL_FILTERS) as Array<keyof Filters>).forEach(key => {
      if (params.get(key) === 'true') {
        parsedFilters[key] = true;
      }
    });

    return { parsedSearch, parsedFilters };
  }, []);

  const commitSearchToUrl = useCallback((searchValue: string) => {
    if (searchValue === committedSearchRef.current) return;
    committedSearchRef.current = searchValue;
    replaceUrlState(searchValue, filters);
  }, [filters, replaceUrlState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyParsedState = () => {
      const { parsedSearch, parsedFilters } = parseLocationSearch();

      if (parsedSearch !== committedSearchRef.current) {
        committedSearchRef.current = parsedSearch;
        setSearch(parsedSearch);
        setDebouncedSearch(parsedSearch);
      }

      setFilters(prev => {
        const isSame = (Object.keys(INITIAL_FILTERS) as Array<keyof Filters>).every(
          key => prev[key] === parsedFilters[key]
        );
        return isSame ? prev : parsedFilters;
      });

      onResetPagination();
    };

    applyParsedState();
    const onPopState = () => applyParsedState();
    window.addEventListener('popstate', onPopState);

    return () => window.removeEventListener('popstate', onPopState);
  }, [onResetPagination, parseLocationSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 100);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    replaceUrlState(committedSearchRef.current, filters);
  }, [filters, replaceUrlState]);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    onResetPagination();
  }, [onResetPagination]);

  const clearSearch = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    onResetPagination();
    commitSearchToUrl('');
  }, [commitSearchToUrl, onResetPagination]);

  const toggleFilter = useCallback((key: keyof Filters) => {
    onResetPagination();
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  }, [onResetPagination]);

  return {
    search,
    debouncedSearch,
    filters,
    onSearchChange,
    clearSearch,
    commitSearchToUrl,
    toggleFilter,
  };
};
