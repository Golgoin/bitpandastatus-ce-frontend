'use server'

export interface AssetNetwork {
  id: string;
  name: string;
  logo_dark: string | null;
  coin_network_id: string | null;
  is_deposit_allowed: boolean;
  is_withdraw_allowed: boolean;
  is_operational: boolean;
  min_deposit_threshold: string | null;
  small_deposit_threshold: string | null;
  small_deposit_fee: string | null;
}

export interface AssetSetting {
  pid: string;
  name: string;
  symbol: string;
  asset_type_name: string;
  asset_group_name: string;
  withdraw_active: boolean | null;
  deposit_active: boolean | null;
  buy_active: boolean | null;
  sell_active: boolean | null;
  limit_order: boolean | null;
  stakeable: number;
  fusion: boolean | null;
  maintenance: boolean | null;
  margin: number;
  networks: AssetNetwork[];
  isNew?: boolean;
}

export type UpdateStatusValue = string | number | boolean | null;

export interface UpdateStatusLine {
  key: string;
  value: UpdateStatusValue;
  omitKey?: boolean;
}

export type UpdateStatus = string | UpdateStatusLine[];

export interface UpdateLog {
  component_name: string;
  changed_at: string;
  new_status: UpdateStatus;
  old_status?: string | null;
  update_id?: number;
  description?: string;
}

interface RawUpdateLog {
  id?: number;
  update_id?: number;
  component_name: string;
  changed_at: string;
  new_status: unknown;
  old_status?: unknown;
  description?: unknown;
}

interface RawSetting {
  pid: string;
  name: string;
  symbol: string;
  asset_type: string;
  asset_group: string;
  withdraw_active?: boolean | null;
  deposit_active?: boolean | null;
  buy_active?: boolean | null;
  sell_active?: boolean | null;
  limit_order_enabled?: boolean | null;
  staking_interest?: number | string | null;
  is_fusion_enabled?: boolean | null;
  is_maintenance?: boolean | null;
  max_leverage?: number | null;
  networks?: RawAssetNetwork[];
}

interface RawNewAsset {
  pid: string;
}

interface RawNewAssetsResponse {
  data?: RawNewAsset[];
}

interface RawAssetNetwork {
  id: string;
  name: string;
  logo_dark?: string | null;
  coin_network_id?: string | null;
  is_deposit_allowed?: boolean | null;
  is_withdraw_allowed?: boolean | null;
  is_operational?: boolean | null;
  min_deposit_threshold?: string | number | null;
  small_deposit_threshold?: string | number | null;
  small_deposit_fee?: string | number | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isRawAssetNetwork = (value: unknown): value is RawAssetNetwork => {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.name === 'string';
};

const normalizeValue = (value: unknown): UpdateStatusValue | null => {
  if (typeof value === 'boolean') return value;

  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number') return value;

  if (Array.isArray(value)) {
    const joined = value.map(item => String(item).trim()).filter(Boolean).join(', ');
    return joined ? joined : null;
  }

  if (isRecord(value)) {
    return JSON.stringify(value);
  }

  return String(value);
};

const formatStatusLine = (key: string, value: unknown, omitKey = false): UpdateStatusLine | null => {
  const normalized = normalizeValue(value);
  if (normalized === null || normalized === '') return null;

  return { key, value: normalized, omitKey };
};

const normalizeNewStatus = (rawStatus: unknown): UpdateStatus => {
  if (typeof rawStatus === 'string') {
    return rawStatus.trim();
  }
  if (!isRecord(rawStatus)) {
    const normalized = normalizeValue(rawStatus);
    if (normalized === null || normalized === '') return '';
    return [{ key: 'status', value: normalized, omitKey: true }];
  }

  const entries = Object.entries(rawStatus);
  if (!entries.length) return '';

  const orderedKeys = [
    'status',
    'buy_active',
    'sell_active',
    'withdraw_active',
    'deposit_active',
    'stakeable',
    'fusion',
    'limit_order',
    'maintenance',
    'margin'
  ];

  const lines: UpdateStatusLine[] = [];
  const used = new Set<string>();

  orderedKeys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(rawStatus, key)) {
      const omitKey = key === 'status';
      const line = formatStatusLine(key, rawStatus[key], omitKey);
      if (line) lines.push(line);
      used.add(key);
    }
  });

  entries
    .filter(([key]) => !used.has(key))
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .forEach(([key, value]) => {
      const line = formatStatusLine(key, value);
      if (line) lines.push(line);
    });

  return lines.length > 0 ? lines : '';
};

const normalizeDescription = (description: unknown): string => {
  if (!description) return '';
  if (typeof description === 'string') return description;
  if (!isRecord(description)) return String(description);

  const blocks: string[][] = [];
  const pushBlock = (block: string[]) => {
    if (block.length > 0) {
      blocks.push(block);
    }
  };

  const bodyLines: string[] = [];
  if (typeof description.body === 'string') {
    const trimmed = description.body.trim();
    if (trimmed) bodyLines.push(trimmed);
  }
  pushBlock(bodyLines);

  const scheduleLines: string[] = [];
  if (typeof description.scheduled_for === 'string') {
    const trimmed = description.scheduled_for.trim();
    if (trimmed) scheduleLines.push(`Scheduled for: ${trimmed}`);
  }
  if (typeof description.scheduled_until === 'string') {
    const trimmed = description.scheduled_until.trim();
    if (trimmed) scheduleLines.push(`Scheduled until: ${trimmed}`);
  }
  pushBlock(scheduleLines);

  const affectedComponentsLines: string[] = [];
  if (Array.isArray(description.affected_components) && description.affected_components.length > 0) {
    const components = description.affected_components.map(component => String(component).trim()).filter(Boolean);
    if (components.length > 0) {
      affectedComponentsLines.push('Affected components:');
      components.forEach(component => affectedComponentsLines.push(component));
    }
  }
  pushBlock(affectedComponentsLines);

  const affectedAssetsLines: string[] = [];
  if (Array.isArray(description.affected_assets) && description.affected_assets.length > 0) {
    const assets = description.affected_assets.map(asset => String(asset).trim()).filter(Boolean);
    assets.forEach(asset => affectedAssetsLines.push(asset));
  }
  pushBlock(affectedAssetsLines);

  const linkLines: string[] = [];
  if (typeof description.shortlink === 'string') {
    const link = description.shortlink.trim();
    if (link) linkLines.push(`Link: <a href="${link}">${link}</a>`);
  }
  pushBlock(linkLines);

  const lines: string[] = [];
  blocks.forEach((block, index) => {
    if (index > 0) {
      lines.push('');
    }
    lines.push(...block);
  });

  return lines.join('<BR>');
};

const normalizeUpdates = (rawUpdates: RawUpdateLog[]): UpdateLog[] => (
  rawUpdates.map(update => {
    const updateId = typeof update.id === 'number'
      ? update.id
      : typeof update.update_id === 'number'
        ? update.update_id
        : undefined;

    const oldStatus = typeof update.old_status === 'string'
      ? update.old_status
      : update.old_status == null
        ? null
        : String(update.old_status);

    return {
      update_id: updateId,
      component_name: update.component_name,
      changed_at: update.changed_at,
      new_status: normalizeNewStatus(update.new_status),
      old_status: oldStatus,
      description: normalizeDescription(update.description)
    };
  })
);

const normalizeOptionalString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number') return String(value);
  return null;
};

const normalizeAssetNetworks = (rawNetworks: unknown): AssetNetwork[] => {
  if (!Array.isArray(rawNetworks)) return [];

  return rawNetworks
    .filter(isRawAssetNetwork)
    .map(network => ({
      id: network.id,
      name: network.name,
      logo_dark: normalizeOptionalString(network.logo_dark),
      coin_network_id: normalizeOptionalString(network.coin_network_id),
      // /settings omits false booleans for these network flags.
      is_deposit_allowed: network.is_deposit_allowed ?? false,
      is_withdraw_allowed: network.is_withdraw_allowed ?? false,
      is_operational: network.is_operational ?? false,
      min_deposit_threshold: normalizeOptionalString(network.min_deposit_threshold),
      small_deposit_threshold: normalizeOptionalString(network.small_deposit_threshold),
      small_deposit_fee: normalizeOptionalString(network.small_deposit_fee)
    }));
};

// Simple in-memory cache to support blocking revalidation
const memoryCache = new Map<string, { data: unknown, expiry: number }>();

async function fetchWithCache<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key);

  if (cached && cached.expiry > now) {
    return cached.data as T;
  }

  const data = await fetchFn();
  if (data !== null) {
    memoryCache.set(key, { data, expiry: now + (ttlSeconds * 1000) });
  }
  return data;
}

export async function getAssetData() {
  return fetchWithCache('assetData', 60, async () => {
    // Defaults to the public Bitpanda Status Community API.
    const statusApiBaseUrl = process.env.STATUS_API_BASE_URL ?? 'https://bitpandastatus.info';
    const statusApiSettingsUrl = process.env.STATUS_API_SETTINGS_URL
      ?? `${statusApiBaseUrl}/api/settings`;
    const statusApiUpdatesBaseUrl = process.env.STATUS_API_UPDATES_URL
      ?? `${statusApiBaseUrl}/api/updates`;
    const statusApiUpdatesUrl = statusApiUpdatesBaseUrl.includes('?')
      ? `${statusApiUpdatesBaseUrl}&limit=5000`
      : `${statusApiUpdatesBaseUrl}?limit=5000`;
    const bitpandaNewAssetsUrl = process.env.BITPANDA_NEW_ASSETS_URL
      ?? 'https://api.bitpanda.com/v1/prices/assets/new';

    try {
      const [settingsRes, updatesRes, newAssetsRes] = await Promise.all([
        fetch(statusApiSettingsUrl, { cache: 'no-store' }),
        fetch(statusApiUpdatesUrl, { cache: 'no-store' }),
        fetch(bitpandaNewAssetsUrl, { cache: 'no-store' })
      ]);

      if (!settingsRes.ok || !updatesRes.ok || !newAssetsRes.ok) {
        throw new Error('Failed to fetch asset data from API');
      }

      const rawSettings: RawSetting[] = await settingsRes.json();
      const rawUpdates: RawUpdateLog[] = await updatesRes.json();
      const newAssetsData: RawNewAssetsResponse = await newAssetsRes.json();

      // Map new API fields to frontend interface
      const settings: AssetSetting[] = rawSettings.map((setting: RawSetting) => {
        const stakingInterestRaw = typeof setting.staking_interest === 'number'
          ? setting.staking_interest
          : typeof setting.staking_interest === 'string'
            ? Number(setting.staking_interest)
            : 0;

        const stakingInterest = Number.isFinite(stakingInterestRaw) ? stakingInterestRaw : 0;

        return {
          pid: setting.pid,
          name: setting.name,
          symbol: setting.symbol,
          asset_type_name: setting.asset_type,
          asset_group_name: setting.asset_group,
          withdraw_active: setting.withdraw_active ?? false,
          deposit_active: setting.deposit_active ?? false,
          buy_active: setting.buy_active ?? false,
          sell_active: setting.sell_active ?? false,
          limit_order: setting.limit_order_enabled ?? false,
          stakeable: stakingInterest,
          fusion: setting.is_fusion_enabled ?? false,
          maintenance: setting.is_maintenance ?? false,
          margin: setting.max_leverage ?? 0,
          networks: normalizeAssetNetworks(setting.networks)
        };
      });

      // Process "New" tag logic
      const newPids = new Set((newAssetsData.data || []).map((asset: RawNewAsset) => asset.pid));

      const processedSettings = settings.map(asset => ({
        ...asset,
        isNew: newPids.has(asset.pid)
      }));

      const updates = normalizeUpdates(rawUpdates);

      return { settings: processedSettings, updates };
    } catch (error) {
      console.error("Error fetching asset data:", error);
      return null;
    }
  });
}
