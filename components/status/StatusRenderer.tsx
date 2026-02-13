'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faCircle,
  faRoadBarrier,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import type { UpdateStatus, UpdateStatusValue } from '../../lib/api';
import { formatStatusText } from '../../lib/status';

export const STATUS_SYMBOLS: Record<string, React.ReactNode> = {
  true: (
    <span title="True" aria-label="True" role="img">
      <FontAwesomeIcon icon={faCheck} className="text-grass-stain-green" aria-hidden="true" />
    </span>
  ),
  false: (
    <span title="False" aria-label="False" role="img">
      <FontAwesomeIcon icon={faTimes} className="text-red-500" aria-hidden="true" />
    </span>
  ),
  null: (
    <span title="False" aria-label="False" role="img">
      <FontAwesomeIcon icon={faTimes} className="text-red-500" aria-hidden="true" />
    </span>
  ),
};

const MAINTENANCE_SYMBOLS: Record<'true' | 'false', React.ReactNode> = {
  true: (
    <span title="Maintenance" aria-label="Maintenance" role="img">
      <FontAwesomeIcon icon={faRoadBarrier} className="text-orange-400" aria-hidden="true" />
    </span>
  ),
  false: (
    <span title="Maintenance complete" aria-label="Maintenance complete" role="img">
      <FontAwesomeIcon icon={faCircle} className="text-grass-stain-green" aria-hidden="true" />
    </span>
  ),
};

const stakingInterestFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const formatStakingInterest = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return null;
  return `${stakingInterestFormatter.format(value)}%`;
};

const renderStatusValue = (value: UpdateStatusValue, isMaintenanceLine: boolean, capitalizeText = false) => {
  if (typeof value === 'boolean') {
    return isMaintenanceLine ? MAINTENANCE_SYMBOLS[String(value) as 'true' | 'false'] : STATUS_SYMBOLS[String(value)];
  }
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return formatStatusText(value, capitalizeText);
  return String(value);
};

const renderStatusStringLine = (line: string, index: number) => {
  const isMaintenanceLine = line.toLowerCase().includes('maintenance');
  const text = formatStatusText(line, true);
  const parts = text.split(/(✅|❌)/);

  return (
    <React.Fragment key={index}>
      {index > 0 && <br />}
      {parts.map((part, partIndex) => {
        if (part === '✅') {
          return (
            <React.Fragment key={partIndex}>
              {isMaintenanceLine ? MAINTENANCE_SYMBOLS.true : STATUS_SYMBOLS.true}
            </React.Fragment>
          );
        }
        if (part === '❌') {
          return (
            <React.Fragment key={partIndex}>
              {isMaintenanceLine ? MAINTENANCE_SYMBOLS.false : STATUS_SYMBOLS.false}
            </React.Fragment>
          );
        }
        return <React.Fragment key={partIndex}>{part.replace(/_/g, ' ')}</React.Fragment>;
      })}
    </React.Fragment>
  );
};

export const renderStatusLines = (status: UpdateStatus) => {
  if (typeof status === 'string') {
    return status.split(/<BR>/i).map((line, index) => renderStatusStringLine(line, index));
  }
  if (!Array.isArray(status) || status.length === 0) return null;

  return status.map((line, index) => {
    const isMaintenanceLine = line.key.toLowerCase().includes('maintenance');
    const valueNode = renderStatusValue(line.value, isMaintenanceLine, line.omitKey && typeof line.value === 'string');
    if (valueNode === null) return null;
    const label = line.omitKey ? '' : `${formatStatusText(line.key, true)}: `;

    return (
      <React.Fragment key={`${line.key}-${index}`}>
        {index > 0 && <br />}
        {label}
        {valueNode}
      </React.Fragment>
    );
  });
};
