import { useState, useRef } from "react";
import { useAuth } from "../../../hooks/useAuth.js";
import { updateProfile, uploadAvatar, uploadBanner, removeBanner } from "../../../services/api.js";
import UserAvatar from "../../components/UserAvatar.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faSpinner, faTrash } from "@awesome.me/kit-95376d5d61/icons/classic/solid";

const BIO_MAX = 190;

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
    const [bio, setBio] = useState(user.bio ?? '');
    const [saving, setSaving] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [bannerUploading, setBannerUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const hasChanges =
        displayName !== (user.displayName ?? '') ||
        bio !== (user.bio ?? '');

    function handleReset() {
        setDisplayName(user.displayName ?? '');
        setBio(user.bio ?? '');
        setError('');
    }

    async function handleSave() {
        setSaving(true);
        setError('');
        const result = await updateProfile({
            displayName: displayName.trim() || null,
            bio: bio.trim() || null,
        });
        if (!result.error) {
            setUser(prev => ({
                ...prev,
                displayName: displayName.trim() || null,
                bio: bio.trim() || null,
            }));
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

    async function handleBannerChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
            setError('Datei zu groß (max. 8 MB)');
            return;
        }

        setBannerUploading(true);
        const result = await uploadBanner(file);
        if (!result.error) {
            setUser(prev => ({ ...prev, banner: result.banner }));
        } else {
            setError(result.error);
        }
        setBannerUploading(false);
        e.target.value = '';
    }

    async function handleBannerRemove() {
        setBannerUploading(true);
        const result = await removeBanner();
        if (!result.error) {
            setUser(prev => ({ ...prev, banner: null }));
        } else {
            setError(result.error);
        }
        setBannerUploading(false);
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Mein Profil</h1>
            </div>

            <div className="relative max-w-[60%] py-4 px-4 w-full h-full mx-auto flex flex-col">
                {/* Profile preview card */}
                <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
                    {/* Banner with upload overlay */}
                    <div
                        className="relative h-24 group cursor-pointer overflow-hidden"
                        style={user.banner ? undefined : {
                            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
                        }}
                        onClick={() => bannerInputRef.current?.click()}
                    >
                        {user.banner && (
                            <img src={user.banner} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {bannerUploading ? (
                                <FontAwesomeIcon icon={faSpinner} spin className="text-white text-lg" />
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faCamera} className="text-white text-base" />
                                    <span className="text-white text-xs font-semibold uppercase tracking-wider">Banner ändern</span>
                                </>
                            )}
                        </div>
                        {user.banner && !bannerUploading && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleBannerRemove(); }}
                                title="Banner entfernen"
                                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/55 backdrop-blur-md border border-white/15 hover:bg-black/75 cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <FontAwesomeIcon icon={faTrash} className="text-white text-xs" />
                            </button>
                        )}
                    </div>
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
                        {user.bio && (
                            <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Über mich</span>
                                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">{user.bio}</p>
                            </div>
                        )}
                    </div>
                </div>

                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={handleAvatarChange} />
                <input ref={bannerInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={handleBannerChange} />

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

                {/* Bio */}
                <div className="bg-card rounded-xl border border-border p-5 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Über mich
                        </label>
                        <span className={`text-[11px] ${bio.length > BIO_MAX ? 'text-dnd' : 'text-muted-foreground'}`}>
                            {bio.length}/{BIO_MAX}
                        </span>
                    </div>
                    <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value.slice(0, BIO_MAX))}
                        placeholder="Erzähl etwas über dich…"
                        rows={3}
                        className="w-full resize-none bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                        Wird in deinem Profil-Popup angezeigt.
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
