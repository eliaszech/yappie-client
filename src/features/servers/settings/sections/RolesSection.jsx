import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSpinner, faTrash, faGripDotsVertical } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { fetchRoles, createRole, updateRole, deleteRole, updateRolePositions } from "../../../../services/api.js";
import ErrorMessage from "../../../components/static/ErrorMessage.jsx";

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
            { bit: PERMISSIONS.MANAGE_MESSAGES, label: 'Nachrichten verwalten', desc: 'Nachrichten anderer Nutzer löschen und anpinnen.' },
        ],
    },
    {
        label: 'Mitgliederverwaltung',
        items: [
            { bit: PERMISSIONS.CREATE_INVITES, label: 'Einladungen erstellen', desc: 'Einladungslinks für den Server erstellen.' },
            { bit: PERMISSIONS.KICK_MEMBERS,   label: 'Mitglieder rauswerfen', desc: 'Mitglieder aus dem Server entfernen.' },
            { bit: PERMISSIONS.BAN_MEMBERS,    label: 'Mitglieder bannen',     desc: 'Mitglieder dauerhaft vom Server ausschließen.' },
        ],
    },
    {
        label: 'Serververwaltung',
        items: [
            { bit: PERMISSIONS.MANAGE_CHANNELS, label: 'Kanäle verwalten', desc: 'Kanäle erstellen, bearbeiten und löschen.' },
            { bit: PERMISSIONS.MANAGE_SERVER,   label: 'Server verwalten', desc: 'Servereinstellungen wie Name und Icon ändern.' },
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

function RoleEditor({ server, role, onDelete }) {
    const [name, setName] = useState(role.name);
    const [color, setColor] = useState(role.color || '#99aab5');
    const [permissions, setPermissions] = useState(role.permissions ?? 0);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    const hasChanges = name.trim() !== role.name || color !== (role.color || '#99aab5') ||
        permissions !== (role.permissions ?? 0);

    function togglePermission(bit) {
        setPermissions(prev => (prev & bit) !== 0 ? prev & ~bit : prev | bit);
    }

    function handleReset() {
        setName(role.name);
        setColor(role.color || '#99aab5');
        setPermissions(role.permissions ?? 0);
        setError('');
    }

    async function handleSave() {
        const trimmed = name.trim();
        if (!trimmed) return;
        setSaving(true);
        setError('');
        const res = await updateRole(server.id, role.id, { name: trimmed, color, permissions });
        if (!res.error) {
            queryClient.setQueryData(['roles', server.id], (old) =>
                old ? old.map(r => r.id === role.id ? { ...r, name: trimmed, color, permissions } : r) : old
            );
        } else {
            setError(res.error);
        }
        setSaving(false);
    }

    async function handleDelete() {
        await deleteRole(server.id, role.id);
        queryClient.setQueryData(['roles', server.id], (old) =>
            old ? old.filter(r => r.id !== role.id) : old
        );
        onDelete();
    }

    return (
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
            {/* Name + color */}
            <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
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
                            className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                    </div>
                </div>

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
            </div>

            {/* Permissions */}
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
                                        onChange={() => togglePermission(perm.bit)}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {error && <p className="text-sm text-dnd">{error}</p>}

            {/* Save / Delete row */}
            <div className="flex items-center justify-between pb-4">
                {confirmDelete ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Wirklich löschen?</span>
                        <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground cursor-pointer transition-colors">
                            Abbrechen
                        </button>
                        <button onClick={handleDelete} className="text-xs px-3 py-1.5 rounded-md bg-dnd text-white hover:bg-dnd/80 cursor-pointer transition-colors">
                            Löschen
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-1.5 text-sm text-dnd hover:bg-dnd/10 px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                    >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        Rolle löschen
                    </button>
                )}

                {hasChanges && (
                    <div className="flex items-center gap-2">
                        <button onClick={handleReset} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer px-3 py-1.5">
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
                )}
            </div>
        </div>
    );
}

function RolesSection({ server }) {
    const [selectedId, setSelectedId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    const [dropIndex, setDropIndex] = useState(null);
    const previousRolesRef = useRef(null);
    const queryClient = useQueryClient();

    const { data: roles = [],  isLoading } = useQuery({
        queryKey: ['roles', server.id],
        queryFn: () => fetchRoles(server.id),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const selectedRole = roles.find(r => r.id === selectedId) ?? null;

    async function handleCreate() {
        setCreating(true);
        const res = await createRole(server.id, { name: 'Neue Rolle', color: '#99aab5', permissions: 0 });
        if (!res.error) {
            queryClient.setQueryData(['roles', server.id], (old) => [...(old || []), res]);
            setSelectedId(res.id);
        }
        setCreating(false);
    }

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

    return (
        <div className="flex flex-col w-full h-full">
            <div className="px-4 py-2 shrink-0">
                <h1 className="text-lg font-bold text-foreground">Rollen</h1>
            </div>

            <div className="flex flex-1 overflow-hidden px-4 pb-4 gap-4 min-h-0">
                {/* Role list */}
                <div className="w-52 flex-shrink-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-border shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {isLoading ? '…' : `Rollen — ${roles.length}`}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {roles.map((role, index) => {
                            const showDropIndicator = dropIndex === index && dragIndex !== null && dragIndex !== index;
                            const isDragging = dragIndex === index;
                            return (
                                <div
                                    key={role.id}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    className={`relative ${showDropIndicator ? (dragIndex > index ? 'border-t-2' : 'border-b-2') + ' border-primary' : ''}`}
                                >
                                    <button
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => setSelectedId(role.id)}
                                        className={`group w-full flex items-center gap-2 px-2 py-2 text-sm transition-colors text-left cursor-pointer ${
                                            isDragging ? 'opacity-50' : ''
                                        } ${
                                            selectedId === role.id
                                                ? 'bg-muted text-foreground'
                                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                        }`}
                                    >
                                        <FontAwesomeIcon
                                            icon={faGripDotsVertical}
                                            className="text-[10px] shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing"
                                        />
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{ background: role.color || '#99aab5' }}
                                        />
                                        <span className="truncate">{role.name}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-2 border-t border-border shrink-0">
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                        >
                            {creating
                                ? <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                                : <FontAwesomeIcon icon={faPlus} className="text-xs" />
                            }
                            Neue Rolle
                        </button>
                    </div>
                </div>

                {/* Editor */}
                {selectedRole ? (
                    <RoleEditor
                        key={selectedRole.id}
                        server={server}
                        role={selectedRole}
                        onDelete={() => setSelectedId(null)}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-muted-foreground text-sm">Wähle eine Rolle aus</p>
                            <p className="text-muted-foreground/60 text-xs mt-1">oder erstelle eine neue Rolle</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RolesSection;
