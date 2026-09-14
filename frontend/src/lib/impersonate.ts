import { pb } from './pocketbase';

export async function impersonateUser(targetUserId: string): Promise<{ token: string; record: any }> {
    const res = await pb.send('/api/custom/impersonate', {
        method: 'POST',
        body: JSON.stringify({ targetUserId }),
    });
    return res;
}
