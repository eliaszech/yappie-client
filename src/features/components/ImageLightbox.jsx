import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faChevronLeft, faChevronRight, faArrowUpRightFromSquare, faDownload } from '@awesome.me/kit-95376d5d61/icons/classic/regular';

function ImageLightbox({ images, initialIndex = 0, onClose }) {
    const [index, setIndex] = useState(initialIndex);
    const hasMany = images.length > 1;
    const current = images[index];

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowRight' && hasMany) setIndex(i => (i + 1) % images.length);
            else if (e.key === 'ArrowLeft' && hasMany) setIndex(i => (i - 1 + images.length) % images.length);
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [hasMany, images.length, onClose]);

    if (!current) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                title="Schließen (Esc)"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/70 hover:bg-card text-foreground flex items-center justify-center cursor-pointer transition-colors text-lg"
            >
                <FontAwesomeIcon icon={faXmark} />
            </button>

            {hasMany && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIndex(i => (i - 1 + images.length) % images.length); }}
                        title="Vorheriges Bild (←)"
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/70 hover:bg-card text-foreground flex items-center justify-center cursor-pointer transition-colors text-xl"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIndex(i => (i + 1) % images.length); }}
                        title="Nächstes Bild (→)"
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/70 hover:bg-card text-foreground flex items-center justify-center cursor-pointer transition-colors text-xl"
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </>
            )}

            <div
                className="relative max-w-[92vw] max-h-[88vh] flex flex-col items-center gap-3"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={current.url}
                    alt={current.filename}
                    className="max-w-[92vw] max-h-[80vh] object-contain rounded-md shadow-2xl"
                />
                <div className="flex items-center gap-3 text-foreground text-sm">
                    <span className="truncate max-w-[60vw]" title={current.filename}>{current.filename}</span>
                    {hasMany && (
                        <span className="text-muted-foreground">{index + 1} / {images.length}</span>
                    )}
                    <a
                        href={current.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="In neuem Tab öffnen"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                    </a>
                    <a
                        href={current.url}
                        download={current.filename}
                        title="Herunterladen"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </a>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ImageLightbox;