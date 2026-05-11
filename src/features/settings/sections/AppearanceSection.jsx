import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useTheme, THEMES } from "../../../hooks/useTheme.js";

function ThemePreview({ preview }) {
    const bg = `hsl(${preview.bg})`;
    const card = `hsl(${preview.card})`;
    const primary = `hsl(${preview.primary})`;
    const sidebar = `hsl(${preview.sidebar})`;

    const msgLight = `${primary}55`;
    const msgDark = `${card}`;

    return (
        <div className="w-full rounded-t-lg overflow-hidden" style={{ background: bg, aspectRatio: '4/2.5' }}>
            <div className="flex h-full">
                {/* Sidebar */}
                <div className="flex flex-col gap-1 p-1.5" style={{ width: '28%', background: sidebar }}>
                    {[1, 0.5, 0.7, 0.4].map((o, i) => (
                        <div key={i} className="rounded-sm h-1.5" style={{ background: primary, opacity: o }} />
                    ))}
                </div>
                {/* Chat area */}
                <div className="flex flex-col flex-1 p-1.5 gap-1 justify-end">
                    {/* Messages */}
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: primary }} />
                        <div className="h-1.5 rounded-full" style={{ width: '55%', background: msgLight }} />
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: primary, opacity: 0.4 }} />
                        <div className="h-1.5 rounded-full" style={{ width: '40%', background: msgDark }} />
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: primary }} />
                        <div className="h-1.5 rounded-full" style={{ width: '65%', background: msgLight }} />
                    </div>
                    {/* Input */}
                    <div className="h-3 rounded-md mt-0.5" style={{ background: card }} />
                </div>
            </div>
        </div>
    );
}

function ThemeCard({ id, theme, active, onSelect }) {
    return (
        <button
            onClick={() => onSelect(id)}
            className={`relative flex flex-col rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                active
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border hover:border-muted-foreground/50'
            }`}
        >
            <ThemePreview preview={theme.preview} />
            <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border">
                <span className={`text-sm font-medium ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>
                    {theme.name}
                </span>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    active ? 'bg-primary' : 'border-2 border-border group-hover:border-muted-foreground/50'
                }`}>
                    {active && <FontAwesomeIcon icon={faCheck} className="text-primary-foreground text-[9px]" />}
                </div>
            </div>
        </button>
    );
}

const GROUPS = [
    { id: 'dunkel',  label: 'Dunkle Designs' },
    { id: 'vibrant', label: 'Lebhafte Designs' },
    { id: 'hell',    label: 'Helle Designs' },
];

function AppearanceSection() {
    const { themeId, applyTheme } = useTheme();

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Erscheinungsbild</h1>
            </div>

            <div className="max-w-[70%] py-4 px-4 w-full mx-auto flex flex-col gap-8 overflow-y-auto">
                {GROUPS.map(group => {
                    const themes = Object.entries(THEMES).filter(([, t]) => t.group === group.id);
                    return (
                        <div key={group.id}>
                            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                {group.label}
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {themes.map(([id, theme]) => (
                                    <ThemeCard
                                        key={id}
                                        id={id}
                                        theme={theme}
                                        active={themeId === id}
                                        onSelect={applyTheme}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AppearanceSection;
