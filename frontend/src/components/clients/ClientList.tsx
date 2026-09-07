'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, MoreVertical, Pencil, Trash2, Building2, Mail, Phone, MapPin, Euro, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { EditClientDialog } from '@/components/clients/EditClientDialog';
import { toast } from 'sonner';
import type { ClientRecord } from '@/lib/pocketbase-types';
import { revalidateClientsPath, updateClientAction, deleteClientAction } from '@/app/actions/clients';
import { isCraftMode } from '@/config/app-mode';

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function getKundenStatusBadge(status?: string) {
    switch (status) {
        case 'noch_nicht_gestartet':
            return <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">Noch nicht gestartet</Badge>;
        case 'aktiv':
            return <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">Aktiv</Badge>;
        case 'beendet':
            return <Badge variant="outline" className="text-muted-foreground border-border bg-card">Beendet</Badge>;
        default:
            return null;
    }
}

export function ClientList({ refreshTrigger }: { refreshTrigger: number }) {
    const router = useRouter();
    const craft = isCraftMode();
    const [clients, setClients] = useState<ClientRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'craft' | 'business'>(craft ? 'craft' : 'all');
    const [editClient, setEditClient] = useState<ClientRecord | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const result = await pb.collection('clients').getList(1, 50, {
                    sort: '-created',
                });
                setClients(result.items as ClientRecord[]);
            } catch (error) {
                console.error('Failed to fetch clients:', error);
                toast.error('Fehler beim Laden der Kunden. Bitte versuche es erneut.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClients();
    }, [refreshTrigger]);

    const handleEdit = (client: ClientRecord) => {
        setEditClient(client);
        setEditDialogOpen(true);
    };

    const handleDelete = async (client: ClientRecord) => {
        if (!confirm(`Möchtest du "${client.name}" wirklich löschen?`)) return;

        try {
            await deleteClientAction(client.id);
            toast.success(`Kunde "${client.name}" gelöscht!`);
            setClients(prev => prev.filter(c => c.id !== client.id));
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Fehler beim Löschen des Kunden.');
        }
    };

    const filteredClients = clients.filter(client => {
        if (categoryFilter === 'craft') {
            const isCraft = Boolean((client as any).client_type || (client as any).has_48b_certificate || (client as any).vat_id);
            if (!isCraft) return false;
        } else if (categoryFilter === 'business') {
            const isCraft = Boolean((client as any).client_type || (client as any).has_48b_certificate);
            if (isCraft) return false;
        }

        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            client.name.toLowerCase().includes(q) ||
            (client.company || '').toLowerCase().includes(q) ||
            (client.email || '').toLowerCase().includes(q)
        );
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-border bg-card/30">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-4 w-1/3 bg-muted" />
                            <Skeleton className="h-6 w-2/3 bg-muted" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full bg-muted mb-2" />
                            <Skeleton className="h-4 w-3/4 bg-muted" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-card/20 p-12 flex flex-col items-center justify-center text-center">
                <Users size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Keine Kunden gefunden</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-md">
                    Du hast noch keine Kunden angelegt. Klicke oben rechts auf "Neuer Kunde", um deinen ersten Kunden zu erfassen.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Search and Category Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                <div className="flex items-center rounded-full bg-card border border-border px-4 py-2 focus-within:border-amber-500/50 transition-colors w-full sm:max-w-md">
                    <Search size={16} className="text-muted-foreground shrink-0" />
                    <input
                        type="text"
                        placeholder="Kunden oder Bauherren suchen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none w-full ml-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-0"
                    />
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
                    <Button
                        type="button"
                        variant={categoryFilter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setCategoryFilter('all')}
                        className="text-xs h-8 px-3"
                    >
                        Alle Kontakte
                    </Button>
                    <Button
                        type="button"
                        variant={categoryFilter === 'craft' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setCategoryFilter('craft')}
                        className={`text-xs h-8 px-3 ${categoryFilter === 'craft' ? 'border-amber-500/40 text-amber-500 font-semibold' : ''}`}
                    >
                        🔨 Bauherren (Handwerk)
                    </Button>
                    <Button
                        type="button"
                        variant={categoryFilter === 'business' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setCategoryFilter('business')}
                        className="text-xs h-8 px-3"
                    >
                        Unternehmen &amp; Agentur
                    </Button>
                </div>
            </div>

            {/* Client Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => (
                    <Card
                        key={client.id}
                        className="border-border bg-card/40 hover:bg-card/80 hover:border-border transition-all duration-300 relative overflow-hidden group cursor-pointer"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.debug('[ClientList] Navigating to:', `/clients/${client.id}`);
                            router.push(`/clients/${client.id}`);
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>

                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                                    <Building2 size={18} />
                                </div>
                                <div>
                                    <CardTitle className="text-lg text-foreground group-hover:text-indigo-400 transition-colors">
                                        {client.name}
                                    </CardTitle>
                                    {client.company && (
                                        <p className="text-sm text-muted-foreground">{client.company}</p>
                                    )}
                                </div>
                            </div>

                            <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
                                        <MoreVertical size={18} />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-background border-border text-foreground">
                                        <DropdownMenuItem
                                            className="hover:bg-card hover:text-foreground cursor-pointer"
                                            onClick={() => handleEdit(client)}
                                        >
                                            <Pencil size={14} className="mr-2" />
                                            Bearbeiten
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
                                            onClick={() => handleDelete(client)}
                                        >
                                            <Trash2 size={14} className="mr-2" />
                                            Löschen
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                                {getKundenStatusBadge(client.kundenstatus) || (
                                    <Badge
                                        variant="outline"
                                        className={`${client.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-muted text-muted-foreground border-border'
                                            } uppercase tracking-wider text-[10px] font-bold`}
                                    >
                                        {client.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                                    </Badge>
                                )}
                                {(client as any).client_type && (
                                    <Badge
                                        variant="outline"
                                        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold"
                                    >
                                        🔨 {(client as any).client_type === 'privat' ? 'Bauherr' : (client as any).client_type === 'bautraeger' ? 'Bauträger' : (client as any).client_type === 'gu' ? 'GU' : 'Auftraggeber'}
                                    </Badge>
                                )}
                                {(client as any).has_48b_certificate && (
                                    <Badge
                                        variant="outline"
                                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold"
                                    >
                                        § 48b EStG
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                {client.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail size={14} className="shrink-0" />
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone size={14} className="shrink-0" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin size={14} className="shrink-0" />
                                        <span className="truncate">{client.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* B7: New fields display */}
                            {(client.auftragsvolumen != null || client.stundenzahl_gesamt != null) && (
                                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4">
                                    {client.auftragsvolumen != null && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Euro size={12} className="text-emerald-500" />
                                            <span>{formatCurrency(client.auftragsvolumen)}</span>
                                        </div>
                                    )}
                                    {client.stundenzahl_gesamt != null && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock size={12} className="text-indigo-400" />
                                            <span>{client.stundenzahl_gesamt}h</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredClients.length === 0 && searchQuery && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Keine Kunden gefunden für "{searchQuery}"</p>
                </div>
            )}

            <EditClientDialog
                client={editClient}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onClientUpdated={async () => {
                    await revalidateClientsPath();
                }}
            />
        </>
    );
}
