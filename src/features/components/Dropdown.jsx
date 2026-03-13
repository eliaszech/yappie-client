import { useState, useRef, useEffect } from 'react';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function Dropdown({ trigger, items, content, position = 'right', width = 'w-56', offset = "0" }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const positionClasses = {
        right: `left-full ml-4 top-0`,
        rightBottom: `left-full ml-4 bottom-0`,
        left: 'right-full mr-4 top-0',
        bottom: 'top-full mt-4 left-0',
        top: 'bottom-full mb-4 left-0',
        topRight: 'bottom-full mb-4 right-0',
    };

    return (
        <div ref={ref} className="relative">
            <div onClick={() => setOpen(!open)}>
                {trigger}
            </div>
            {open && (
                <div className={`absolute z-50 ${width} bg-card border border-border rounded-lg shadow-xl overflow-hidden ${positionClasses[position]}`}>
                    {items && items.map((item, index) => {
                        if (item.separator) {
                            return <div key={index} className="border-t border-border my-1" />;
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    item.onClick();
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                                    item.danger
                                        ? 'text-red-400 hover:bg-red-500/10'
                                        : 'text-foreground hover:bg-muted/50'
                                }`}
                            >
                                {item.icon && <FontAwesomeIcon icon={item.icon} className="w-4 text-center" />}
                                <div className="flex flex-col">
                                    {item.label}
                                    {item.description && (
                                        <span className="text-xs text-muted-foreground">{item.description}</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}

                    {content}
                </div>
            )}
        </div>
    );
}

export default Dropdown;