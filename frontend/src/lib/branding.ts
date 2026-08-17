export const BRANDING = {
  name: 'Vibeforce Flow OS',
  nameShort: 'Vibeforce',
  logo: '/icon-vfos.png',
  logoSvg: '/logo-vfos.svg',
  logoAlt: 'Vibeforce Flow OS Logo',
} as const;

export function storageKey(key: string): string {
  return `vibeforce-${key}`;
}
