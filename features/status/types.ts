export interface Filters {
  maintenance: boolean;
  tradeOnly: boolean;
  fullyIntegrated: boolean;
  stakeable: boolean;
  newAssets: boolean;
  fusion: boolean;
  limitOrder: boolean;
  margin: boolean;
}

export const INITIAL_FILTERS: Filters = {
  maintenance: false,
  tradeOnly: false,
  fullyIntegrated: false,
  stakeable: false,
  newAssets: false,
  fusion: false,
  limitOrder: false,
  margin: false,
};

export const FILTER_OPTIONS: Array<{ key: keyof Filters; label: string }> = [
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'tradeOnly', label: 'Trade Only' },
  { key: 'fullyIntegrated', label: 'Send/Receive' },
  { key: 'stakeable', label: 'Stakeable' },
  { key: 'newAssets', label: 'New' },
  { key: 'fusion', label: 'Fusion' },
  { key: 'limitOrder', label: 'Limit Order' },
  { key: 'margin', label: 'Margin' },
];
