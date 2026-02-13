'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSearch, faShareNodes, faXmark } from '@fortawesome/free-solid-svg-icons';
import Card from '../Card';
import { FILTER_OPTIONS, type Filters } from '../../features/status/types';

interface SearchAndFiltersProps {
  search: string;
  filters: Filters;
  onSearchChange: (value: string) => void;
  onSearchCommit: (value: string) => void;
  onClearSearch: () => void;
  onShareSearch: () => void;
  onToggleFilter: (key: keyof Filters) => void;
}

export default function SearchAndFilters({
  search,
  filters,
  onSearchChange,
  onSearchCommit,
  onClearSearch,
  onShareSearch,
  onToggleFilter,
}: SearchAndFiltersProps) {
  return (
    <Card className="border-l-4 border-l-roadmap-upcoming hover:border-l-roadmap-upcoming-hover">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative grow">
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              onBlur={() => onSearchCommit(search)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onSearchCommit(search);
                  (event.target as HTMLInputElement).blur();
                }
              }}
              className="text-sm sm:text-base w-full bg-obsidian-forest border border-roadmap-border rounded-lg p-2 pl-10 pr-10 text-white focus:outline-none focus:border-roadmap-upcoming-hover hover:border-roadmap-upcoming-hover transition-colors"
              placeholder="Search by asset name or symbol..."
              aria-label="Search assets by name or symbol"
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-platinum-gray" />
            {search && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-3 text-platinum-gray hover:text-white transition-colors"
                title="Clear search"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          <button
            onClick={onShareSearch}
            className="text-sm sm:text-base group cursor-pointer bg-neutrals-card_fill_secondary hover:bg-neutrals-card_fill_tertiary text-white p-2 rounded-lg border border-roadmap-border hover:border-roadmap-upcoming-hover transition-colors"
            title="Share Search"
          >
            <FontAwesomeIcon icon={faShareNodes} className="group-hover:text-roadmap-upcoming-hover" />
          </button>
        </div>

        <div className="grid grid-cols-3 xs:grid-cols-4 sm:flex sm:flex-wrap gap-2">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none group">
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters[key]
                  ? 'bg-roadmap-upcoming-hover border-roadmap-upcoming-hover'
                  : 'bg-obsidian-forest border-roadmap-border group-hover:border-roadmap-upcoming-hover'}`}
                onClick={() => onToggleFilter(key)}
              >
                {filters[key] && <FontAwesomeIcon icon={faCheck} className="text-black text-xs" />}
              </div>
              <span
                className="text-xs sm:text-sm text-platinum-gray group-hover:text-white transition-colors"
                onClick={() => onToggleFilter(key)}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
}
