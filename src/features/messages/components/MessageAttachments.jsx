import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileLines,
    faFileImage,
    faFilePdf,
    faFileZipper,
    faFileAudio,
    faFileVideo,
    faFileCode,
    faDownload,
} from '@awesome.me/kit-95376d5d61/icons/classic/regular';
import ImageLightbox from '../../components/ImageLightbox.jsx';

function formatBytes(bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function iconFor(mimeType) {
    if (!mimeType) return faFileLines;
    if (mimeType.startsWith('image/')) return faFileImage;
    if (mimeType.startsWith('audio/')) return faFileAudio;
    if (mimeType.startsWith('video/')) return faFileVideo;
    if (mimeType === 'application/pdf') return faFilePdf;
    if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar')) return faFileZipper;
    if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('javascript')) return faFileCode;
    return faFileLines;
}

function isImage(a) { return a.mimeType?.startsWith('image/'); }
function isVideo(a) { return a.mimeType?.startsWith('video/'); }
function isAudio(a) { return a.mimeType?.startsWith('audio/'); }

function ImageGrid({ images, onOpen }) {
    const count = images.length;
    if (count === 1) {
        const img = images[0];
        const aspect = img.width && img.height ? img.width / img.height : 16 / 9;
        const maxW = Math.min(440, img.width || 440);
        return (
            <div
                className="rounded-md overflow-hidden cursor-zoom-in bg-muted/40"
                style={{ width: `${maxW}px`, aspectRatio: aspect }}
                onClick={() => onOpen(0)}
            >
                <img
                    src={img.url}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
        );
    }

    const cols = count === 2 ? 2 : count === 3 ? 3 : 2;
    return (
        <div
            className="grid gap-1 max-w-[440px]"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
            {images.map((img, i) => (
                <div
                    key={img.id ?? i}
                    onClick={() => onOpen(i)}
                    className="relative aspect-square rounded-md overflow-hidden cursor-zoom-in bg-muted/40"
                >
                    <img
                        src={img.url}
                        alt={img.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>
            ))}
        </div>
    );
}

function FileCard({ attachment }) {
    return (
        <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            download={attachment.filename}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-muted/40 border border-border hover:bg-muted/60 transition-colors max-w-[440px]"
        >
            <FontAwesomeIcon icon={iconFor(attachment.mimeType)} className="text-2xl text-muted-foreground shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-foreground truncate" title={attachment.filename}>{attachment.filename}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(attachment.size)}</span>
            </div>
            <FontAwesomeIcon icon={faDownload} className="text-muted-foreground shrink-0" />
        </a>
    );
}

function MessageAttachments({ attachments }) {
    const [lightbox, setLightbox] = useState(null);

    const { images, others } = useMemo(() => {
        const images = [];
        const others = [];
        for (const a of attachments || []) {
            if (isImage(a)) images.push(a);
            else others.push(a);
        }
        return { images, others };
    }, [attachments]);

    if (!attachments || attachments.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 mt-1">
            {images.length > 0 && (
                <ImageGrid images={images} onOpen={(i) => setLightbox(i)} />
            )}
            {others.map(att => {
                if (isVideo(att)) {
                    return (
                        <video
                            key={att.id}
                            src={att.url}
                            controls
                            className="max-w-[440px] max-h-[360px] rounded-md bg-black"
                        />
                    );
                }
                if (isAudio(att)) {
                    return (
                        <audio
                            key={att.id}
                            src={att.url}
                            controls
                            className="max-w-[440px]"
                        />
                    );
                }
                return <FileCard key={att.id} attachment={att} />;
            })}

            {lightbox !== null && (
                <ImageLightbox
                    images={images}
                    initialIndex={lightbox}
                    onClose={() => setLightbox(null)}
                />
            )}
        </div>
    );
}

export default MessageAttachments;