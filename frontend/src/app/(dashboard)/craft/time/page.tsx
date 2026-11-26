import { redirect } from 'next/navigation';
import { getUserAuthPB, requireAuth } from '@/lib/pocketbase-server';
import { MonteurTimeClockClient } from './MonteurTimeClockClient';
import type { ProjectRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

export default async function CraftTimePage() {
  await requireAuth();
  const pb = await getUserAuthPB();
  if (!pb) {
    redirect('/login');
  }

  let projects: ProjectRecord[] = [];

  try {
    try {
      const projRes = await pb.collection('projects').getList(1, 100, {
        sort: '-created',
        filter: 'project_type = "craft" || key ~ "BAU" || key ~ "CRAFT"',
        expand: 'client,site_manager',
      });
      projects = JSON.parse(JSON.stringify(projRes.items)) as ProjectRecord[];
    } catch {
      const projRes = await pb.collection('projects').getList(1, 50, {
        sort: '-created',
        expand: 'client',
      });
      projects = (JSON.parse(JSON.stringify(projRes.items)) as ProjectRecord[]).filter(
        (p) => p.project_type === 'craft' || p.key?.includes('BAU') || p.key?.includes('CRAFT')
      );
    }
  } catch (error) {
    console.warn('[CraftTimePage] Failed to fetch projects:', error);
  }

  // Fallback projects if DB returns none
  if (projects.length === 0) {
    projects = [
      {
        id: 'proj_spree',
        collectionId: 'projects',
        collectionName: 'projects',
        key: 'ULB',
        name: 'Quartier Spreeauen · Los 3',
        description: 'Schlüsselfertiger Neubau Mehrfamilienhaus',
        status: 'in_progress',
        geofence_lat: 52.5085,
        geofence_lng: 13.4328,
        geofence_radius: 150,
        site_address: {
          street: 'Köpenicker Chaussee 12',
          zip: '10317',
          city: 'Berlin',
          country: 'Deutschland',
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      } as ProjectRecord,
      {
        id: 'proj_huber',
        collectionId: 'projects',
        collectionName: 'projects',
        key: 'BAU-HUBER',
        name: 'Neubau Villa Huber',
        description: 'Exklusives Einfamilienhaus mit Wärmepumpe und PV-Anlage',
        status: 'in_progress',
        geofence_lat: 48.1372,
        geofence_lng: 11.5761,
        geofence_radius: 120,
        site_address: {
          street: 'Sonnenhang 4',
          zip: '81675',
          city: 'München',
          country: 'Deutschland',
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      } as ProjectRecord,
    ];
  }

  return <MonteurTimeClockClient initialProjects={projects} />;
}
