import PocketBase from 'pocketbase';

export const POCKETBASE_URL = 'https://pb-vibeforce.46-225-178-235.sslip.io';

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
        // Load existing session from cookie (set by server-side /api/auth/login)
        instance.authStore.loadFromCookie(document.cookie);

        if (instance.authStore.isValid) {
            document.cookie = instance.authStore.exportToCookie({ httpOnly: false, sameSite: 'Lax', path: '/' });
        }
        instance.authStore.onChange(() => {
            document.cookie = instance.authStore.exportToCookie({ httpOnly: false, sameSite: 'Lax', path: '/' });
        });
    }
    return instance;
}

export const pb = createPocketBase();
