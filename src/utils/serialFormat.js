export const normalizeSerialPrefix = (value, fallback = 'ITEM') => {
  const candidate = String(value ?? '').trim().toUpperCase();
  const cleaned = candidate.replace(/[^A-Z0-9]/g, '');
  return cleaned || fallback;
};

export const buildManualSerialPrefix = (itemCode, serialPrefix) =>
  normalizeSerialPrefix(serialPrefix || itemCode);

export const buildPoSerialPrefix = (itemCode, serialPrefix) =>
  `${buildManualSerialPrefix(itemCode, serialPrefix)}PO`;

export const formatSerialStamp = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}${day}${hours}${minutes}${seconds}`;
};

export const buildSerialPreview = (prefix, runningNumber = 1, date = new Date()) =>
  `${normalizeSerialPrefix(prefix)}-${formatSerialStamp(date)}-${String(runningNumber).padStart(4, '0')}`;
