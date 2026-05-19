import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus, faSpinner, faTrash, faGripDotsVertical, faPen,
    faChevronLeft, faCheck,
} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { fetchRoles, createRole, updateRole, deleteRole, updateRolePositions } from "../../../../services/api.js";
import { canActOnRole } from "../../../../services/permissions.js";

const ROLE_COLORS = [
    '#99aab5', '#1abc9c', '#2ecc71', '#3498db', '#9b59b6',
    '#e91e63', '#f1c40f', '#e67e22', '#e74c3c', '#11806a',
    '#1f8b4c', '#206694', '#71368a', '#ad1457', '#c27c0e',
    '#a84300', '#992d22', '#eb459e',
];

const PERMISSIONS = {
    SEND_MESSAGES:   1 << 0,
    MANAGE_MESSAGES: 1 << 1,
    ATTACH_FILES:    1 << 2,
    CREATE_INVITES:  1 << 3,
    KICK_MEMBERS:    1 << 4,
    BAN_MEMBERS:     1 << 5,
    MANAGE_CHANNELS: 1 << 6,
    MANAGE_SERVER:   1 << 7,
    ADMINISTRATOR:   1 << 8,
    PIN_MESSAGES:    1 << 9,
    MANAGE_INVITES:  1 << 10,
    MANAGE_ROLES:    1 << 11,
    MANAGE_EMOJIS:   1 << 12,
};

const PERMISSION_GROUPS = [
    {
        label: 'Allgemein',
        items: [
            { bit: PERMISSIONS.ADMINISTRATOR, label: 'Administrator', desc: 'Gewährt alle Berechtigungen auf dem Server. Vorsicht!' },
        ],
    },
    {
        label: 'Nachrichten',
        items: [
            { bit: PERMISSIONS.SEND_MESSAGES,   label: 'Nachrichten senden',    desc: 'Nachrichten in Textkanälen senden.' },
            { bit: PERMISSIONS.ATTACH_FILES,    label: 'Dateien anhängen',      desc: 'Bilder und Dateien in Nachrichten hochladen.' },
            { bit: PERMISSIONS.PIN_MESSAGES,    label: 'Nachrichten anpinnen',  desc: 'Nachrichten an Kanäle anpinnen und Pins entfernen.' },
            { bit: PERMISSIONS.MANAGE_MESSAGES, label: 'Nachrichten verwalten', desc: 'Nachrichten anderer Nutzer löschen.' },
        ],
    },
    {
        label: 'Mitgliederverwaltung',
        items: [
            { bit: PERMISSIONS.CREATE_INVITES, label: 'Einladungen erstellen', desc: 'Eigene Einladungslinks erstellen und verwalten.' },
            { bit: PERMISSIONS.MANAGE_INVITES, label: 'Einladungen verwalten', desc: 'Alle Einladungen des Servers sehen und löschen.' },
            { bit: PERMISSIONS.KICK_MEMBERS,   label: 'Mitglieder rauswerfen', desc: 'Mitglieder aus dem Server entfernen.' },
            { bit: PERMISSIONS.BAN_MEMBERS,    label: 'Mitglieder bannen',     desc: 'Mitglieder dauerhaft vom Server ausschließen.' },
        ],
    },
    {
        label: 'Serververwaltung',
        items: [
            { bit: PERMISSIONS.MANAGE_CHANNELS, label: 'Kanäle verwalten',          desc: 'Kanäle erstellen, bearbeiten und löschen.' },
            { bit: PERMISSIONS.MANAGE_SERVER,   label: 'Serverdetails bearbeiten',  desc: 'Server-Name, Icon, AFK-Kanal und ähnliche Einstellungen ändern.' },
            { bit: PERMISSIONS.MANAGE_ROLES,    label: 'Rollen verwalten',          desc: 'Rollen erstellen, bearbeiten und zuweisen. Nur Rollen unter der eigenen.' },
            { bit: PERMISSIONS.MANAGE_EMOJIS,   label: 'Emojis verwalten',          desc: 'Eigene Emojis für den Server hinzufügen und entfernen.' },
        ],
    },
];

function Toggle({ enabled, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
                enabled ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
        >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
        </button>
    );
}

function RoleEditor({ server, role, onBack }) {
    const [name, setName] = useState(role.name);
    const [color, setColor] = useState(role.color || '#99aab5');
    const [permissions, setPermissions] = useState(role.permissions ?? 0);
    const [hoist, setHoist] = useState(!!role.hoist);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const isEveryone = !!role.isEveryone;
    const isOwnerRole = !!role.isOwnerRole;
    // @everyone has no name/color of its own; Owner role permissions are fixed.
    const canEditName = !isEveryone;
    const canEditColor = !isEveryone;
    const canEditHoist = !isEveryone;
    const canEditPermissions = !isOwnerRole;
    // Hierarchy: Owner can edit own role; others fall through canActOnRole.
    const readOnly = !canActOnRole(server, role);

    const hasChanges = (canEditName && name.trim() !== role.name) ||
        (canEditColor && color !== (role.color || '#99aab5')) ||
        (canEditHoist && hoist !== !!role.hoist) ||
        (canEditPermissions && permissions !== (role.permissions ?? 0));

    function togglePermission(bit) {
        setPermissions(prev => (prev & bit) !== 0 ? prev & ~bit : prev | bit);
    }

    function handleReset() {
        setName(role.name);
        setColor(role.color || '#99aab5');
        setPermissions(role.permissions ?? 0);
        setHoist(!!role.hoist);
        setError('');
    }

    async function handleSave() {
        const trimmed = name.trim();
        if (canEditName && !trimmed) return;
        setSaving(true);
        setError('');
        const patch = {};
        if (canEditName) patch.name = trimmed;
        if (canEditColor) patch.color = color;
        if (canEditHoist) patch.hoist = hoist;
        if (canEditPermissions) patch.permissions = permissions;
        const res = await updateRole(server.id, role.id, patch);
        if (!res.error) {
            queryClient.setQueryData(['roles', server.id], (old) =>
                old ? old.map(r => r.id === role.id ? { ...r, ...patch } : r) : old
            );
        } else {
            setError(res.error);
        }
        setSaving(false);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: role.color || '#99aab5' }} />
                    <h2 className="text-base font-semibold text-foreground truncate">{role.name}</h2>
                </div>
            </div>

            {/* Name + color */}
            <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
                {isEveryone && (
                    <p className="text-xs text-muted-foreground">
                        Die <span className="text-foreground font-medium">@everyone</span>-Rolle gilt automatisch
                        für alle Mitglieder. Name und Farbe sind fest; nur die Berechtigungen sind editierbar.
                    </p>
                )}
                {readOnly && (
                    <p className="text-xs text-dnd">
                        Diese Rolle steht hierarchisch über deiner — du kannst sie ansehen, aber nicht bearbeiten.
                    </p>
                )}
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Rollenname
                    </label>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shrink-0 border border-border" style={{ background: color }} />
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            maxLength={32}
                            disabled={!canEditName || readOnly}
                            className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {canEditColor && !readOnly && (
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Rollenfarbe
                        </label>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="grid grid-cols-9 gap-1.5">
                                {ROLE_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full cursor-pointer transition-all hover:scale-110 ${
                                            color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''
                                        }`}
                                        style={{ background: c }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                                    title="Benutzerdefinierte Farbe"
                                />
                                <span className="text-xs text-muted-foreground font-mono">{color}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hoist toggle (not for @everyone) */}
            {canEditHoist && (
                <div className="bg-card rounded-xl border border-border p-5 flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">Mitglieder dieser Rolle separat anzeigen</span>
                        <span className="text-xs text-muted-foreground">
                            Wenn aktiv, werden Mitglieder mit dieser Rolle als eigene Gruppe in der Mitgliederliste angezeigt.
                            Andernfalls fallen sie auf die nächste sichtbare Rolle zurück.
                        </span>
                    </div>
                    <Toggle
                        enabled={hoist}
                        onChange={() => !readOnly && setHoist(v => !v)}
                    />
                </div>
            )}

            {/* Permissions */}
            {isOwnerRole ? (
                <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        ★
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">Alle Berechtigungen</span>
                        <span className="text-xs text-muted-foreground">
                            Die Owner-Rolle hat automatisch alle Berechtigungen auf diesem Server und kann nicht eingeschränkt werden.
                        </span>
                    </div>
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Berechtigungen
                        </span>
                    </div>
                    <div className="divide-y divide-border">
                        {PERMISSION_GROUPS.map(group => (
                            <div key={group.label}>
                                <div className="px-5 pt-4 pb-1">
                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {group.label}
                                    </span>
                                </div>
                                {group.items.map(perm => (
                                    <div key={perm.bit} className="flex items-start justify-between px-5 py-3 gap-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium text-foreground">{perm.label}</span>
                                            <span className="text-xs text-muted-foreground">{perm.desc}</span>
                                        </div>
                                        <Toggle
                                            enabled={(permissions & perm.bit) !== 0}
                                            onChange={() => !readOnly && togglePermission(perm.bit)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-dnd">{error}</p>}

            {hasChanges && !readOnly && (
                <div className="sticky bottom-0 left-0 right-0 -mx-1 px-1 pb-4">
                    <div className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-5 py-3 shadow-2xl">
                        <span className="text-sm text-muted-foreground">Du hast nicht gespeicherte Änderungen</span>
                        <div className="flex items-center gap-3">
                            <button onClick={handleReset} className="text-sm text-foreground hover:underline cursor-pointer">
                                Zurücksetzen
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {saving && <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />}
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RoleListRow({ role, index, draggable, onEdit, onDelete, dragIndex, dropIndex, onDragStart, onDragEnd, onDragOver, onDrop, canManage }) {
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);

    const isEveryone = !!role.isEveryone;
    const isOwnerRole = !!role.isOwnerRole;
    const protectedRole = isEveryone || isOwnerRole;
    // Edit-Icon openable for everyone (the editor itself becomes read-only when
    // the role is at/above the caller's rank). Trash + drag require real perm.
    const showEdit = true;
    const showDelete = canManage && !protectedRole;
    const showDropIndicator = dropIndex === index && dragIndex !== null && dragIndex !== index && draggable;
    const isDragging = dragIndex === index;

    async function handleDelete() {
        setBusy(true);
        await onDelete(role);
        // row unmounts on success
    }

    return (
        <div
            onDragOver={(e) => draggable && onDragOver(e, index)}
            onDrop={(e) => draggable && onDrop(e, index)}
            className={`relative ${showDropIndicator ? (dragIndex > index ? 'border-t-2' : 'border-b-2') + ' border-primary' : ''}`}
        >
            <div
                draggable={draggable}
                onDragStart={(e) => draggable && onDragStart(e, index)}
                onDragEnd={onDragEnd}
                className={`group flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors ${isDragging ? 'opacity-50' : ''}`}
            >
                {draggable ? (
                    <FontAwesomeIcon
                        icon={faGripDotsVertical}
                        className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
                    />
                ) : (
                    <span className="w-3 shrink-0" />
                )}
                <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: role.color || '#99aab5' }}
                />
                <span className="flex-1 text-sm text-foreground truncate">{role.name}</span>

                {confirming ? (
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Löschen?</span>
                        <button
                            onClick={() => setConfirming(false)}
                            disabled={busy}
                            className="text-xs px-2 py-1 rounded-md bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                        >
                            Nein
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={busy}
                            className="text-xs px-2 py-1 rounded-md bg-dnd text-white hover:bg-dnd/80 cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                            {busy ? <FontAwesomeIcon icon={faSpinner} spin className="text-[10px]" /> : <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
                            Ja
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {showEdit && (
                            <button
                                onClick={() => onEdit(role.id)}
                                title="Rolle bearbeiten"
                                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faPen} className="text-xs" />
                            </button>
                        )}
                        {showDelete && (
                            <button
                                onClick={() => setConfirming(true)}
                                title="Rolle löschen"
                                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-dnd hover:bg-dnd/10 cursor-pointer"
                            >
                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function RolesList({ server, roles, onEdit, creating, onCreate }) {
    const [dragIndex, setDragIndex] = useState(null);
    const [dropIndex, setDropIndex] = useState(null);
    const previousRolesRef = useRef(null);
    const queryClient = useQueryClient();

    function handleDragStart(e, index) {
        setDragIndex(index);
        previousRolesRef.current = roles;
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e, index) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropIndex(index);
    }

    function handleDragEnd() {
        setDragIndex(null);
        setDropIndex(null);
    }

    async function handleDrop(e, targetIndex) {
        e.preventDefault();
        const sourceIndex = dragIndex;
        setDragIndex(null);
        setDropIndex(null);
        if (sourceIndex === null || sourceIndex === targetIndex) return;

        const next = [...roles];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, moved);

        queryClient.setQueryData(['roles', server.id], next);

        const roleIds = next.map(r => r.id);
        const res = await updateRolePositions(server.id, roleIds);
        if (res?.error) {
            queryClient.setQueryData(['roles', server.id], previousRolesRef.current);
        } else if (Array.isArray(res)) {
            queryClient.setQueryData(['roles', server.id], res);
            queryClient.invalidateQueries({ queryKey: ['members', server.id] });
        }
    }

    async function handleDelete(role) {
        const res = await deleteRole(server.id, role.id);
        if (!res?.error) {
            queryClient.setQueryData(['roles', server.id], (old) =>
                old ? old.filter(r => r.id !== role.id) : old
            );
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h2 className="text-sm font-semibold text-foreground">Rollen — {roles.length}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Mitglieder oben in der Liste haben Vorrang bei der Anzeige-Farbe.
                    </p>
                </div>
                <button
                    onClick={onCreate}
                    disabled={creating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                >
                    {creating
                        ? <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                        : <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    }
                    Neue Rolle
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {roles.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Noch keine Rollen vorhanden.
                    </div>
                ) : roles.map((role, index) => {
                    const manage = canActOnRole(server, role);
                    // Owner role is always pinned to the top — never draggable.
                    return (
                        <RoleListRow
                            key={role.id}
                            role={role}
                            index={index}
                            draggable={!role.isEveryone && !role.isOwnerRole && manage}
                            canManage={manage}
                            onEdit={onEdit}
                            onDelete={handleDelete}
                            dragIndex={dragIndex}
                            dropIndex={dropIndex}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function RolesSection({ server }) {
    const [editingId, setEditingId] = useState(null);
    const [creating, setCreating] = useState(false);
    const queryClient = useQueryClient();

    const { data: roles = [] } = useQuery({
        queryKey: ['roles', server.id],
        queryFn: () => fetchRoles(server.id),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const editingRole = roles.find(r => r.id === editingId) ?? null;

    async function handleCreate() {
        setCreating(true);
        const res = await createRole(server.id, { name: 'Neue Rolle', color: '#99aab5', permissions: 0 });
        if (!res.error) {
            queryClient.setQueryData(['roles', server.id], (old) => [...(old || []), res]);
            setEditingId(res.id);
        }
        setCreating(false);
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="px-4 py-2 shrink-0">
                <h1 className="text-lg font-bold text-foreground">Rollen</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
                <div className="max-w-3xl mx-auto">
                    {editingRole ? (
                        <RoleEditor
                            key={editingRole.id}
                            server={server}
                            role={editingRole}
                            onBack={() => setEditingId(null)}
                        />
                    ) : (
                        <RolesList
                            server={server}
                            roles={roles}
                            onEdit={setEditingId}
                            creating={creating}
                            onCreate={handleCreate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default RolesSection;
