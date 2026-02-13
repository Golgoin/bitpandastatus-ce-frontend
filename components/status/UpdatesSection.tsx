'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faChevronUp, faInfo } from '@fortawesome/free-solid-svg-icons';
import type { UpdateLogWithPin } from '../../lib/contracts';
import { renderStatusLines } from './StatusRenderer';

interface UpdatesSectionProps {
  updates: UpdateLogWithPin[];
  expandedUpdates: Set<number>;
  visibleUpdatesCount: number;
  onToggleUpdate: (index: number) => void;
  onLoadAll: () => void;
  renderDescriptionLine: (line: string) => React.ReactNode;
}

export default function UpdatesSection({
  updates,
  expandedUpdates,
  visibleUpdatesCount,
  onToggleUpdate,
  onLoadAll,
  renderDescriptionLine,
}: UpdatesSectionProps) {
  if (updates.length === 0) return null;

  return (
    <section aria-label="Recent status updates" className="group bg-neutrals-card_fill_primary/30 border border-roadmap-border border-l-4 border-l-roadmap-ongoing hover:border-l-roadmap-ongoing-hover rounded-lg overflow-hidden">
      <details open className="group">
        <summary className="flex items-center p-3 cursor-pointer list-none hover:bg-neutrals-card_fill_secondary transition-colors select-none">
          <span className="text-xs font-bold items-center text-center justify-center mr-1">
            <FontAwesomeIcon icon={faBolt} className="text-roadmap-ongoing-hover" />
          </span>
          <div className="flex items-center gap-2 grow">
            <span className="text-sm sm:text-base text-white font-bold">Asset and Component Updates</span>
          </div>
          <span className="text-platinum-gray text-sm group-open:rotate-180 transition-transform"><FontAwesomeIcon icon={faChevronUp} /></span>
        </summary>

        <div className="overflow-x-auto max-h-80 border-t border-roadmap-border">
          <table className="w-full text-left text-sm text-platinum-gray" aria-label="Asset and component status updates">
            <thead className="text-xs text-platinum-gray border-b border-roadmap-border sticky top-0 bg-neutrals-card_fill_primary z-10">
              <tr>
                <th className="p-1 pl-2">Asset/Component</th>
                <th className="p-1">New Status</th>
                <th className="p-1 text-right">Changed at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-roadmap-border">
              {updates.slice(0, visibleUpdatesCount).map((update, index) => {
                const hasDescription = Boolean(update.description && update.description.trim() !== '');

                return (
                  <React.Fragment key={index}>
                    <tr
                      className={`hover:bg-neutrals-card_fill_secondary/50 transition-colors ${hasDescription ? 'cursor-pointer' : ''}`}
                      onClick={() => hasDescription && onToggleUpdate(index)}
                    >
                      <td className="px-0.5 pl-2 py-1 font-medium text-xs sm:text-sm text-white">
                        {update.isPinned && <span className="mr-1" aria-label="Pinned update">📌</span>}
                        {update.component_name}
                        {hasDescription && (
                          <span className="ml-1 text-platinum-gray group-hover:text-grass-stain-green" title="Show description">
                            <FontAwesomeIcon icon={faInfo} />
                          </span>
                        )}
                      </td>
                      <td className="px-0.5 py-1 text-nowrap">
                        <span className="rounded text-xs sm:text-sm">{renderStatusLines(update.new_status)}</span>
                      </td>
                      <td className="px-0.5 py-1 text-xs sm:text-sm text-right text-nowrap tabular-nums">
                        {new Date(update.changed_at).toLocaleDateString()} - {new Date(update.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>

                    {hasDescription && expandedUpdates.has(index) && (
                      <tr className="bg-neutrals-card_fill_secondary/30">
                        <td colSpan={3} className="px-3 py-1 text-xs sm:text-sm text-platinum-gray text-left">
                          {(update.description || '').split(/<BR>/i).map((line, lineIndex) => (
                            <React.Fragment key={lineIndex}>
                              {lineIndex > 0 && <br />}
                              {renderDescriptionLine(line)}
                            </React.Fragment>
                          ))}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {updates.length > visibleUpdatesCount && (
            <div className="p-1 border-t border-roadmap-border text-center">
              <button
                onClick={onLoadAll}
                className="text-sm text-grass-stain-green hover:text-roadmap-upcoming-hover transition-colors cursor-pointer"
              >
                Load all ({updates.length - visibleUpdatesCount} more)
              </button>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}
