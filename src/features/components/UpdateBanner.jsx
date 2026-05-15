import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faXmark, faCircleDown } from '@awesome.me/kit-95376d5d61/icons/classic/solid';

function UpdateBanner() {
    const [state, setState] = useState({ status: 'idle' });
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!window.electronAPI?.isElectron) return;
        window.electronAPI.onUpdateStatus((payload) => {
            setState(payload);
            if (payload.status === 'available' || payload.status === 'downloaded') {
                setDismissed(false);
            }
        });
    }, []);

    if (!window.electronAPI?.isElectron) return null;
    if (dismissed) return null;

    const { status, version, percent } = state;
    if (status !== 'available' && status !== 'downloading' && status !== 'downloaded') return null;

    function install() {
        window.electronAPI.installUpdate();
    }

    return (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[1000] mt-3">
            <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl shadow-lg pl-4 pr-2 py-2 text-sm">
                {status === 'downloaded' ? (
                    <>
                        <FontAwesomeIcon icon={faCircleDown} />
                        <span>
                            Update {version ? `v${version} ` : ''}bereit zur Installation
                        </span>
                        <button
                            onClick={install}
                            className="flex items-center gap-2 bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors rounded-lg px-3 py-1 font-medium cursor-pointer"
                        >
                            <FontAwesomeIcon icon={faArrowsRotate} />
                            Jetzt neu starten
                        </button>
                    </>
                ) : status === 'downloading' ? (
                    <>
                        <FontAwesomeIcon icon={faCircleDown} className="animate-pulse" />
                        <span>
                            Update wird heruntergeladen… {Math.round(percent || 0)}%
                        </span>
                    </>
                ) : (
                    <>
                        <FontAwesomeIcon icon={faCircleDown} />
                        <span>Update {version ? `v${version} ` : ''}verfügbar</span>
                    </>
                )}
                <button
                    onClick={() => setDismissed(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-primary-foreground/15 transition-colors cursor-pointer"
                    aria-label="Schliessen"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            </div>
        </div>
    );
}

export default UpdateBanner;