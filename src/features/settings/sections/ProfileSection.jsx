import { useState, useRef } from "react";
import { useAuth } from "../../../hooks/useAuth.js";
import { updateProfile, uploadAvatar } from "../../../services/api.js";
import UserAvatar from "../../components/UserAvatar.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faSpinner } from "@awesome.me/kit-95376d5d61/icons/classic/solid";

function SaveBar({ visible, onReset, onSave, saving }) {
    if (!visible) return null;
    return (
        <div className="absolute left-0 bottom-6 w-full z-10 justify-between flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-3 shadow-2xl">
            <span className="text-sm text-muted-foreground">Du hast nicht gespeicherte Änderungen</span>
            <div className="flex items-center gap-4">
                <button onClick={onReset} className="text-sm text-foreground hover:underline cursor-pointer">Zurücksetzen</button>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                    {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Speichern'}
                </button>
            </div>
        </div>
    );
}

function ProfileSection() {
    const { user, setUser } = useAuth();
    const [displayName, setDisplayName] = useState(user.displayName ?? '');
    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const hasChanges = displayName !== (user.displayName ?? '');

    function handleReset() {
        setDisplayName(user.displayName ?? '');
        setError('');
    }

    async function handleSave() {
        setSaving(true);
        setError('');
        const result = await updateProfile({ displayName: displayName.trim() || null });
        if (!result.error) {
            setUser(prev => ({ ...prev, displayName: displayName.trim() || null }));
        } else {
            setError(result.error);
        }
        setSaving(false);
    }

    async function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
            setError('Datei zu groß (max. 8 MB)');
            return;
        }

        setAvatarUploading(true);
        const result = await uploadAvatar(file);
        if (!result.error) {
            setUser(prev => ({ ...prev, avatar: result.avatar }));
        } else {
            setError(result.error);
        }
        setAvatarUploading(false);
        e.target.value = '';
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Mein Profil</h1>
            </div>

            <div className="relative max-w-[60%] py-4 px-4 w-full h-full mx-auto flex flex-col">
                {/* Profile preview card */}
                <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
                    <div className="h-20 bg-primary" />
                    <div className="px-5 pb-5">
                        <div className="-mt-10 mb-3 flex items-end justify-between">
                            {/* Avatar with upload overlay */}
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="rounded-full border-4 border-card overflow-hidden">
                                    <UserAvatar
                                        size="w-20 h-20 text-3xl"
                                        displayOnline={false}
                                        avatar={user.avatar}
                                        icon={user.username.charAt(0).toUpperCase()}
                                    />
                                </div>
                                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                                    {avatarUploading ? (
                                        <FontAwesomeIcon icon={faSpinner} spin className="text-white text-lg" />
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faCamera} className="text-white text-base" />
                                            <span className="text-white text-[10px] font-semibold leading-none">ÄNDERN</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-xl font-bold text-foreground">{user.displayName ?? user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.username}</div>
                    </div>
                </div>

                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={handleAvatarChange} />

                {/* Display name */}
                <div className="bg-card rounded-xl border border-border p-5 mb-4">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Anzeigename
                    </label>
                    <input
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder={user.username}
                        maxLength={32}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                        Dein Anzeigename überschreibt deinen Benutzernamen im Chat.
                    </p>
                </div>

                {/* Username (read-only) */}
                <div className="bg-card rounded-xl border border-border p-5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Benutzername
                    </label>
                    <div className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground select-all">
                        {user.username}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                        Den Benutzernamen kannst du unter <span className="text-foreground font-medium">Konto</span> ändern.
                    </p>
                </div>

                {error && <p className="text-sm text-dnd mt-3">{error}</p>}

                <SaveBar visible={hasChanges} onReset={handleReset} onSave={handleSave} saving={saving} />
            </div>
        </div>
    );
}

export default ProfileSection;
