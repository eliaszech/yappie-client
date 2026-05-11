import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth.js";
import { changePassword } from "../../../services/api.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faSpinner } from "@awesome.me/kit-95376d5d61/icons/classic/solid";

function ReadOnlyField({ label, value }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</label>
            <div className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground select-all">
                {value}
            </div>
        </div>
    );
}

function PasswordSection() {
    const [open, setOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    function reset() {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
    }

    function handleToggle() {
        setOpen(v => !v);
        if (open) reset();
    }

    async function handleSave() {
        setError('');
        if (newPassword !== confirmPassword) {
            setError('Neue Passwörter stimmen nicht überein.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
            return;
        }
        setSaving(true);
        const result = await changePassword({ oldPassword, newPassword });
        if (!result.error) {
            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                reset();
            }, 1500);
        } else {
            setError(result.error);
        }
        setSaving(false);
    }

    return (
        <div className="border border-border rounded-xl overflow-hidden">
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
            >
                <div>
                    <div className="text-sm font-semibold text-foreground text-left">Passwort ändern</div>
                    <div className="text-xs text-muted-foreground text-left mt-0.5">Wähle ein starkes Passwort</div>
                </div>
                <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="text-muted-foreground" />
            </button>

            {open && (
                <div className="bg-card border-t border-border px-5 py-4 flex flex-col gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Aktuelles Passwort</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                            autoComplete="current-password"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Neues Passwort</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Neues Passwort bestätigen</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                    </div>

                    {error && <p className="text-sm text-dnd">{error}</p>}
                    {success && <p className="text-sm text-green-400">Passwort erfolgreich geändert!</p>}

                    <div className="flex gap-3 pt-1">
                        <button onClick={handleToggle} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                            Abbrechen
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !oldPassword || !newPassword || !confirmPassword}
                            className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Passwort ändern'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function AccountSection() {
    const { user } = useAuth();

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Konto</h1>
            </div>

            <div className="max-w-[60%] py-4 px-4 w-full mx-auto flex flex-col gap-6">
                <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
                    <ReadOnlyField label="Benutzername" value={user.username} />
                    {user.email && <ReadOnlyField label="E-Mail-Adresse" value={user.email} />}
                </div>

                <div>
                    <h3 className="text-base font-semibold text-foreground mb-3">Passwort & Sicherheit</h3>
                    <PasswordSection />
                </div>

                <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Konto löschen</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Dein Konto wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                    </p>
                    <button className="text-sm font-medium text-dnd border border-dnd/50 hover:bg-dnd/10 px-4 py-2 rounded-lg transition-colors cursor-pointer">
                        Konto löschen
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AccountSection;
