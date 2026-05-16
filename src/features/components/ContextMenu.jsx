import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function ContextMenu({ x, y, items, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        function onMouseDown(e) {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        }
        function onKeyDown(e) {
            if (e.key === 'Escape') onClose();
        }
        function onContextMenu(e) {
            e.preventDefault();
            onClose();
        }
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('contextmenu', onContextMenu);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('contextmenu', onContextMenu);
        };
    }, [onClose]);

    // Estimate menu dimensions for viewport clamping
    const itemCount = items.filter(i => !i.separator).length;
    const sepCount = items.filter(i => i.separator).length;
    const estimatedHeight = itemCount * 34 + sepCount * 9 + 8;
    const estimatedWidth = 216;

    const left = x + estimatedWidth > window.innerWidth ? x - estimatedWidth : x;
    const top = y + estimatedHeight > window.innerHeight ? y - estimatedHeight : y;

    return (
        <div
            ref={ref}
            className="fixed z-[200] w-54 bg-card border border-border rounded-lg shadow-2xl py-1 select-none"
            style={{ top, left }}
            onContextMenu={e => e.preventDefault()}
        >
            {items.map((item, i) => {
                if (item.separator) {
                    return <div key={i} className="border-t border-border my-1" />;
                }

                if (item.header) {
                    return (
                        <div key={i} className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {item.label}
                        </div>
                    );
                }

                if (item.render) {
                    return (
                        <div key={i} className="px-3 py-1.5">
                            {item.render(onClose)}
                        </div>
                    );
                }

                return (
                    <button
                        key={i}
                        disabled={item.disabled}
                        onClick={() => {
                            if (!item.disabled) {
                                item.onClick();
                                onClose();
                            }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors rounded-sm mx-0.5 max-w-[calc(100%-4px)] ${
                            item.disabled
                                ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                                : item.danger
                                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer'
                                    : 'text-foreground hover:bg-muted/60 cursor-pointer'
                        }`}
                    >
                        {item.icon && (
                            <FontAwesomeIcon icon={item.icon} className="w-3.5 shrink-0 text-center" />
                        )}
                        <span className="truncate">{item.label}</span>
                        {item.disabled && item.disabledLabel && (
                            <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{item.disabledLabel}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export default ContextMenu;
