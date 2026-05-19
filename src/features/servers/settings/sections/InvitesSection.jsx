import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faTrash, faPlus, faSpinner, faCheck, faLink } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { listServerInvites, createInvite, deleteInvite } from '../../../../services/api.js';
import UserAvatar from '../../../components/UserAvatar.jsx';
import { useAuth } from '../../../../hooks/useAuth.js';
import { hasPermission, PERMISSIONS } from '../../../../services/permissions.js';

const EXPIRY_PRESETS = [
    { label: '30 Min', value: 30 * 60 },
    { label: '1 Std', value: 60 * 60 },
    { label: '6 Std', value: 6 * 60 * 60 },
    { label: '1 Tag', value: 24 * 60 * 60 },
    { label: '7 Tage', value: 7 * 24 * 60 * 60 },
    { label: 'Nie', value: null },
];

const USES_PRESETS = [
    { label: '1', value: 1 },
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '∞', value: null },
];

function formatDateTime(d) {
    if (!d) return null;
    return new Date(d).toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function expiryLabel(invite) {
    if (!invite.expiresAt) return 'Nie';
    const diffMs = new Date(invite.expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Abgelaufen';
    const min = Math.floor(diffMs / 60_000);
    if (min < 60) return `in ${min} Min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `in ${h} Std`;
    const days = Math.floor(h / 24);
    return `in ${days}${days === 1 ? ' Tag' : ' Tagen'}`;
}

function CreateInviteForm({ serverId, onCreated, onCancel }) {
    const [expiresInSec, setExpiresInSec] = useState(24 * 60 * 60);
    const [maxUses, setMaxUses] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit() {
        setBusy(true);
        setError('');
        const res = await createInvite(serverId, {
            expiresInSec: expiresInSec ?? undefined,
            maxUses: maxUses ?? undefined,
        });
        if (res?.error) {
            setError(res.error);
            setBusy(false);
            return;
        }
        onCreated(res);
    }

    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Neue Einladung erstellen</h3>
                <p className="text-xs text-muted-foreground">Konfiguriere Ablauf und maximale Verwendungen.</p>
            </div>

            <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Läuft ab nach
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {EXPIRY_PRESETS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => setExpiresInSec(p.value)}
                            className={`px-3 py-1.5 rounded-md text-xs border cursor-pointer transition-colors ${
                                expiresInSec === p.value
                                    ? 'bg-primary/15 text-primary border-primary/30'
                                    : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Maximale Verwendungen
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {USES_PRESETS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => setMaxUses(p.value)}
                            className={`px-3 py-1.5 rounded-md text-xs border cursor-pointer transition-colors ${
                                maxUses === p.value
                                    ? 'bg-primary/15 text-primary border-primary/30'
                                    : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className="text-sm text-dnd">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
                <button
                    onClick={onCancel}
                    disabled={busy}
                    className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                >
                    Abbrechen
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={busy}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                    {busy && <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />}
                    Erstellen
                </button>
            </div>
        </div>
    );
}

function InviteRow({ invite, onDelete, canDelete }) {
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);
    const link = `yappie.ch/invite/${invite.code}`;

    async function copy() {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* noop */ }
    }

    async function handleDelete() {
        setBusy(true);
        await onDelete(invite.code);
        // parent removes from list; row unmounts
    }

    const exhausted = invite.maxUses != null && invite.uses >= invite.maxUses;
    const expired = invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now();
    const inactive = exhausted || expired;

    return (
        <div className={`flex items-center gap-3 px-4 py-3 ${inactive ? 'opacity-60' : ''}`}>
            <UserAvatar
                size="w-9 h-9 text-sm"
                displayOnline={false}
                icon={invite.creator?.username?.charAt(0).toUpperCase() ?? '?'}
                avatar={invite.creator?.avatar}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">
                        {invite.creator?.displayName ?? invite.creator?.username ?? 'Unbekannt'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{link}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span>
                        <span className="text-foreground font-medium">{invite.uses}</span>
                        {invite.maxUses != null ? ` / ${invite.maxUses}` : ' / ∞'} Verwendungen
                    </span>
                    <span>·</span>
                    <span>Läuft ab: {expiryLabel(invite)}</span>
                    {invite.createdAt && (
                        <>
                            <span>·</span>
                            <span>Erstellt {formatDateTime(invite.createdAt)}</span>
                        </>
                    )}
                </div>
            </div>
            <button
                onClick={copy}
                title="Link kopieren"
                className="px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 cursor-pointer"
            >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={copied ? 'text-green-400' : ''} />
            </button>
            {canDelete && (
                <button
                    onClick={handleDelete}
                    disabled={busy}
                    title="Einladung löschen"
                    className="px-2 py-1.5 rounded-md text-muted-foreground hover:text-dnd hover:bg-dnd/10 cursor-pointer disabled:opacity-50"
                >
                    <FontAwesomeIcon icon={busy ? faSpinner : faTrash} spin={busy} />
                </button>
            )}
        </div>
    );
}

function InvitesSection({ server }) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [creating, setCreating] = useState(false);
    const canManageAll = hasPermission(server, PERMISSIONS.MANAGE_INVITES);
    const canCreate = hasPermission(server, PERMISSIONS.CREATE_INVITES);

    const { data: invites = [], isLoading, isError, error } = useQuery({
        queryKey: ['server-invites', server.id],
        queryFn: () => listServerInvites(server.id),
        staleTime: 30 * 1000,
    });

    function patchInvites(updater) {
        queryClient.setQueryData(['server-invites', server.id], updater);
    }

    function handleCreated(invite) {
        patchInvites(old => Array.isArray(old) ? [invite, ...old] : [invite]);
        setCreating(false);
    }

    async function handleDelete(code) {
        const res = await deleteInvite(code);
        if (!res?.error) {
            patchInvites(old => Array.isArray(old) ? old.filter(i => i.code !== code) : old);
        }
    }

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Einladungen</h1>
            </div>

            <div className="max-w-[80%] py-4 px-4 w-full mx-auto flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Verwalte alle aktiven Einladungen für <span className="text-foreground font-medium">{server.name}</span>.
                    </p>
                    {!creating && (
                        <button
                            onClick={() => setCreating(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 cursor-pointer whitespace-nowrap"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-xs" />
                            Neue Einladung
                        </button>
                    )}
                </div>

                {creating && (
                    <CreateInviteForm
                        serverId={server.id}
                        onCreated={handleCreated}
                        onCancel={() => setCreating(false)}
                    />
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Lädt…
                    </div>
                ) : isError ? (
                    <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-dnd">
                        {error?.message || 'Einladungen konnten nicht geladen werden.'}
                    </div>
                ) : invites.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl px-4 py-10 text-center text-sm text-muted-foreground">
                        <FontAwesomeIcon icon={faLink} className="text-2xl mb-2 opacity-50" />
                        <p>Noch keine Einladungen erstellt.</p>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                        {invites.map(invite => (
                            <InviteRow
                                key={invite.id}
                                invite={invite}
                                onDelete={handleDelete}
                                canDelete={canManageAll || (canCreate && invite.createdBy === user?.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InvitesSection;
