export const getSearchParamString = (value: string | string[] | undefined) => (
  Array.isArray(value) ? value[0] ?? '' : value ?? ''
);
