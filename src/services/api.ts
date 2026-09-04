import type { DeviceKey, WeekChargesResponse } from '../types';
import { getWeekId } from '../utils/date';

const LOCAL_STORAGE_KEY_PREFIX = 'vchasno_charges_';
const GAS_URL_KEY = 'vchasno_gas_url';

// Default URL or fallback to empty (user can configure via UI or .env)
export function getGasApiUrl(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(GAS_URL_KEY);
  if (stored) return stored;
  return (import.meta as any).env?.VITE_GAS_API_URL || '';
}

export function setGasApiUrl(url: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GAS_URL_KEY, url.trim());
}

/**
 * Get charges from localStorage cache
 */
export function getLocalCharges(weekId: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + weekId);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

/**
 * Save charges to localStorage cache
 */
export function saveLocalCharges(weekId: string, charges: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + weekId, JSON.stringify(charges));
  } catch (e) {}
}

/**
 * Fetch charges from Google Apps Script Web App
 */
export async function fetchChargesFromGAS(weekId: string = getWeekId()): Promise<Record<string, boolean>> {
  const gasUrl = getGasApiUrl();
  const cached = getLocalCharges(weekId);

  if (!gasUrl) {
    // If no GAS URL configured, return local cache
    return cached;
  }

  try {
    const targetUrl = new URL(gasUrl);
    targetUrl.searchParams.set('action', 'get_charges');
    targetUrl.searchParams.set('week', weekId);

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`GAS HTTP status: ${response.status}`);
      return cached;
    }

    const data: WeekChargesResponse = await response.json();
    if (data && data.ok && data.charges) {
      const parsedCharges: Record<string, boolean> = { ...cached };
      // GAS keys are like "CHG_2026_W36_ITEM_TWS": "true"
      for (const [key, value] of Object.entries(data.charges)) {
        if (value === 'true' || value === true as any) {
          parsedCharges[key] = true;
        } else if (value === 'false' || value === false as any) {
          parsedCharges[key] = false;
        }
      }
      saveLocalCharges(weekId, parsedCharges);
      return parsedCharges;
    }
  } catch (error) {
    console.warn('Failed to fetch charges from Google Apps Script, using local cache:', error);
  }

  return cached;
}

/**
 * Update charge status for a device item in GAS and local storage
 */
export async function toggleChargeGAS(
  weekId: string,
  deviceKey: DeviceKey,
  newStatus: boolean
): Promise<void> {
  const fullKey = `CHG_${weekId}_${deviceKey}`;
  
  // 1. Optimistic update in localStorage
  const current = getLocalCharges(weekId);
  current[fullKey] = newStatus;
  saveLocalCharges(weekId, current);

  // 2. Sync to GAS if URL available
  const gasUrl = getGasApiUrl();
  if (!gasUrl) return;

  try {
    const targetUrl = new URL(gasUrl);
    targetUrl.searchParams.set('action', 'set_charge');
    targetUrl.searchParams.set('week', weekId);
    targetUrl.searchParams.set('item', deviceKey);
    targetUrl.searchParams.set('status', newStatus ? 'true' : 'false');

    // Use mode: 'no-cors' fallback for Google Apps Script redirects
    fetch(targetUrl.toString(), {
      method: 'GET',
      mode: 'no-cors',
    }).catch(err => {
      console.warn('Background sync error to GAS:', err);
    });
  } catch (e) {
    console.warn('Failed to dispatch sync request to GAS:', e);
  }
}

/**
 * Mark all devices for a given list as charged
 */
export async function chargeAllGAS(weekId: string, deviceKeys: DeviceKey[]): Promise<void> {
  // 1. Optimistic local update
  const current = getLocalCharges(weekId);
  for (const key of deviceKeys) {
    current[`CHG_${weekId}_${key}`] = true;
  }
  saveLocalCharges(weekId, current);

  // 2. Sync to GAS
  const gasUrl = getGasApiUrl();
  if (!gasUrl) return;

  try {
    const targetUrl = new URL(gasUrl);
    targetUrl.searchParams.set('action', 'charge_all');
    targetUrl.searchParams.set('week', weekId);
    targetUrl.searchParams.set('items', deviceKeys.join(','));

    fetch(targetUrl.toString(), {
      method: 'GET',
      mode: 'no-cors',
    }).catch(err => {
      console.warn('Background sync charge_all error:', err);
    });
  } catch (e) {}
}
