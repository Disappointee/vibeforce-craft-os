import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

function createPocketBase() {
    if (typeof window === 'undefined') {
        // Return a mock/proxy that throws helpful errors on server
        return new Proxy({} as PocketBase, {
            get(_, prop) {
                throw new Error(`PocketBase.${String(prop)} can only be used on the client side`);
            },
        });
    }
    const instance = new PocketBase(POCKETBASE_URL);
    instance.autoCancellation(false);
    return instance;
}

export const pb = createPocketBase();
