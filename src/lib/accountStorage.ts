export const ACCOUNTS_STORAGE_KEY = 'year-impact-accounts';
export const SESSION_STORAGE_KEY = 'year-impact-session-id';

const DATA_PREFIX = 'year-impact-data';

export function getCurrentAccountId() {
  return localStorage.getItem(SESSION_STORAGE_KEY) || 'guest';
}

export function scopedStorageKey(key: string, accountId = getCurrentAccountId()) {
  return `${DATA_PREFIX}-${accountId}-${key}`;
}

export function resetScopedStorage(accountId = getCurrentAccountId()) {
  const prefix = `${DATA_PREFIX}-${accountId}-`;
  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}