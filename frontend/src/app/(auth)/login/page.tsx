import { headers } from 'next/headers';
import { isCraftMode } from '@/config/app-mode';
import { LoginClient } from './LoginClient';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const headerStore = await headers();
  const host =
    headerStore.get('x-vibeforce-host') ||
    headerStore.get('x-forwarded-host') ||
    headerStore.get('host');
  const appModeHeader = headerStore.get('x-vibeforce-app-mode');
  const craftMode = appModeHeader === 'craft' || isCraftMode(host);

  return <LoginClient initialCraftMode={craftMode} />;
}

