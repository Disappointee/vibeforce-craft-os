import PocketBase from 'pocketbase';

const DEFAULT_PB_URL = 'https://pb-vibeforce.46-225-178-235.sslip.io';
const rawUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL;
const POCKETBASE_URL = (rawUrl && !rawUrl.includes('railway.app') && !rawUrl.includes('127.0.0.1') && !rawUrl.includes('localhost')) ? rawUrl : DEFAULT_PB_URL;

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
                    }
                });
            },
        });
    }
    const instance = new PocketBase(POCKETBASE_URL);
    instance.autoCancellation(false);
    if (typeof document !== 'undefined') {
        if (instance.authStore.isValid) {
            document.cookie = instance.authStore.exportToCookie({ httpOnly: false });
        }
        instance.authStore.onChange(() => {
            document.cookie = instance.authStore.exportToCookie({ httpOnly: false });
        });
    }
    return instance;
}

export const pb = createPocketBase();
