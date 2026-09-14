'use client';

import PocketBase from 'pocketbase';
import { getAuthCookieName } from '@/config/app-mode';

const cleanUrl = (raw: string | undefined): string =>
  raw ? raw.trim().replace(/[\r\n\t]+/g, '') : '';

const rawClientUrl = cleanUrl(process.env.NEXT_PUBLIC_POCKETBASE_URL);
export const POCKETBASE_URL =
  (!rawClientUrl || rawClientUrl.includes('railway.app'))
    ? 'https://pb-vibeforce.46-225-178-235.sslip.io'
    : rawClientUrl;

function createPocketBase() {
  if (typeof window === 'undefined') {
    // Return a safe mock for server-side rendering to prevent SSR crashes
    return new Proxy({} as PocketBase, {
      get(_, prop) {
        if (prop === 'authStore') {
          return {
            isValid: false,
            record: null,
            token: '',
            model: null,
            clear: () => {},
            loadFromCookie: () => {},
            exportToCookie: () => '',
          };
        }
        // For other props like collection(), return a dummy function/object
        return new Proxy(() => {}, {
          get() {
            return () => Promise.resolve({});
          },
          apply() {
            return Promise.resolve({});
          },
        });
      },
    });
  }
  const instance = new PocketBase(POCKETBASE_URL);
  instance.autoCancellation(false);
  const cookieKey = getAuthCookieName();
  if (typeof document !== 'undefined') {
    // Load existing session from isolated cookie (pb_auth_flow vs pb_auth_craft) with legacy fallback
    instance.authStore.loadFromCookie(document.cookie, cookieKey);
    if (!instance.authStore.isValid) {
      instance.authStore.loadFromCookie(document.cookie, 'pb_auth');
    }

    if (instance.authStore.isValid) {
      document.cookie = instance.authStore.exportToCookie({ httpOnly: false, sameSite: 'Lax', path: '/' }, cookieKey);
    }
    instance.authStore.onChange(() => {
      document.cookie = instance.authStore.exportToCookie({ httpOnly: false, sameSite: 'Lax', path: '/' }, cookieKey);
    });
  }
  return instance;
}

export const pb = createPocketBase();

