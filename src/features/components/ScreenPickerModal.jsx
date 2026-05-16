import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDisplay, faGear, faCheck } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { faXmark } from '@awesome.me/kit-95376d5d61/icons/classic/light';
import Spinner from './static/Spinner.jsx';
import { QUALITY_PRESETS, getQualityId, setQualityId } from '../../services/screenShareQuality.js';

function ScreenPickerModal() {
    const [visible, setVisible] = useState(false);
    const [sources, setSources] = useState(null); // null = loading
    const [qualityId, setQualityIdState] = useState(getQualityId);
    const [qualityOpen, setQualityOpen] = useState(false);
    const qualityRef = useRef(null);

    useEffect(() => {
        if (!window.electronAPI?.isElectron) return;

        window.electronAPI.onShowSourcePicker(() => {
            setSources(null);
            setQualityIdState(getQualityId());
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

    useEffect(() => {
        if (!qualityOpen) return;
        function onMousedown(e) {
            if (!qualityRef.current?.contains(e.target)) setQualityOpen(false);
        }
        document.addEventListener('mousedown', onMousedown);
        return () => document.removeEventListener('mousedown', onMousedown);
    }, [qualityOpen]);

    function pick(id) {
        window.electronAPI.pickSource(id);
        setVisible(false);
        setSources(null);
        setQualityOpen(false);
    }

    function cancel() {
        window.electronAPI.cancelSourcePicker();
        setVisible(false);
        setSources(null);
        setQualityOpen(false);
    }

    function pickQuality(id) {
        setQualityId(id);
        setQualityIdState(id);
        setQualityOpen(false);
    }

    if (!visible) return null;

    const screens = sources?.filter(s => s.id.startsWith('screen:')) ?? [];
    const windows = sources?.filter(s => s.id.startsWith('window:')) ?? [];
    const currentQuality = QUALITY_PRESETS.find(q => q.id === qualityId);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-[680px] max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                        <FontAwesomeIcon icon={faDisplay} className="text-primary" />
                        Bildschirm teilen
                    </div>
                    <div className="flex items-center gap-1">
                        <div ref={qualityRef} className="relative">
                            <button
                                onClick={() => setQualityOpen(v => !v)}
                                className="h-7 px-2 flex items-center gap-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer text-xs"
                                title="Stream-Qualität"
                            >
                                <FontAwesomeIcon icon={faGear} />
                                <span>{currentQuality?.label ?? 'Qualität'}</span>
                            </button>
                            {qualityOpen && (
                                <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[200px] z-10">
                                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Stream-Qualität
                                    </p>
                                    {QUALITY_PRESETS.map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => pickQuality(q.id)}
                                            className="w-full px-3 py-2 text-sm text-foreground hover:bg-muted text-left flex items-center justify-between cursor-pointer"
                                        >
                                            <span>{q.label}</span>
                                            {q.id === qualityId && (
                                                <FontAwesomeIcon icon={faCheck} className="text-primary" />
                                            )}
                                        </button>
                                    ))}
                                    <div className="border-t border-border" />
                                    <p className="px-3 py-1.5 text-[10px] text-muted-foreground">
                                        Gilt ab dem nächsten Stream-Start.
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={cancel}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
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