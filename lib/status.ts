import type { UpdateStatus, UpdateStatusLine, UpdateStatusValue } from './api';

export const formatStatusText = (text: string, capitalizeFirst = false) => {
  const replaced = text.replace(/_/g, ' ');
  if (!capitalizeFirst || !replaced) return replaced;
  return replaced.charAt(0).toUpperCase() + replaced.slice(1);
};

export const statusValueToText = (value: UpdateStatusValue) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

export const statusLineToText = (line: UpdateStatusLine) => {
  const valueText = statusValueToText(line.value);
  if (!valueText) return '';
  if (line.omitKey) return valueText;
  return `${line.key}: ${valueText}`;
};

export const statusToText = (status: UpdateStatus) => {
  if (typeof status === 'string') return status;
  if (!Array.isArray(status)) return '';
  return status.map(statusLineToText).filter(Boolean).join('\n');
};

export const getUpdateStatusToken = (status: UpdateStatus) => {
  if (Array.isArray(status)) {
    const statusLine = status.find(line => line.key === 'status') ?? status.find(line => line.omitKey);
    if (statusLine) return statusValueToText(statusLine.value).toLowerCase().trim();
    if (status.length > 0) return statusValueToText(status[0].value).toLowerCase().trim();
    return '';
  }
  const raw = (status || '').toLowerCase();
  const [firstLine = ''] = raw.split(/<br\s*\/?>(?:\s*)/i);
  const trimmed = firstLine.trim();
  if (trimmed.startsWith('status:')) {
    return trimmed.replace('status:', '').trim();
  }
  return trimmed;
};
