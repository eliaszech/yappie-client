import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDisplay } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { faXmark } from '@awesome.me/kit-95376d5d61/icons/classic/light';
import Spinner from './static/Spinner.jsx';

function ScreenPickerModal() {
    const [visible, setVisible] = useState(false);
    const [sources, setSources] = useState(null); // null = loading

    useEffect(() => {
        if (!window.electronAPI?.isElectron) return;

        window.electronAPI.onShowSourcePicker(() => {
            setSources(null);   // reset to loading state for each new request
            setVisible(true);
        });

        window.electronAPI.onSourcePickerSources(incoming => {
            setSources(incoming);
        });
    }, []);

    useEffect(() => {
        if (!visible) return;
        function onKey(e) {
            if (e.key === 'Escape') cancel();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [visible]);

    function pick(id) {
        window.electronAPI.pickSource(id);
        setVisible(false);
        setSources(null);
    }

    function cancel() {
        window.electronAPI.cancelSourcePicker();
        setVisible(false);
        setSources(null);
    }

    if (!visible) return null;

    const screens = sources?.filter(s => s.id.startsWith('screen:')) ?? [];
    const windows = sources?.filter(s => s.id.startsWith('window:')) ?? [];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-[680px] max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                        <FontAwesomeIcon icon={faDisplay} className="text-primary" />
                        Bildschirm teilen
                    </div>
                    <button
                        onClick={cancel}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                {!sources ? (
                    <div className="flex items-center justify-center py-16">
                        <Spinner size="w-8 h-8" />
                    </div>
                ) : (
                    <div className="overflow-y-auto p-5 flex flex-col gap-5">
                        {screens.length > 0 && (
                            <Section title="Bildschirme" sources={screens} onPick={pick} />
                        )}
                        {windows.length > 0 && (
                            <Section title="Fenster" sources={windows} onPick={pick} />
                        )}
                    </div>
                )}

                <div className="px-5 py-3 border-t border-border shrink-0 flex justify-end">
                    <button
                        onClick={cancel}
                        className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                        Abbrechen
                    </button>
                </div>
            </div>
        </div>
    );
}

function Section({ title, sources, onPick }) {
    return (
        <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</p>
            <div className="grid grid-cols-3 gap-3">
                {sources.map(s => (
                    <button
                        key={s.id}
                        onClick={() => onPick(s.id)}
                        className="group flex flex-col rounded-lg border border-border overflow-hidden hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer text-left"
                    >
                        <div className="w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                            {s.thumbnail ? (
                                <img src={s.thumbnail} alt={s.name} className="w-full h-full object-cover" />
                            ) : s.icon ? (
                                <img src={s.icon} alt={s.name} className="w-12 h-12 object-contain" />
                            ) : (
                                <FontAwesomeIcon icon={faDisplay} className="text-2xl text-muted-foreground" />
                            )}
                        </div>
                        <div className="px-2 py-1.5 text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {s.name}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default ScreenPickerModal;
