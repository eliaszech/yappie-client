import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faDisplay, faPalette, faMoon, faSun } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useTheme, listThemes, getThemePreview } from "../../../hooks/useTheme.js";

function ThemePreview({ id }) {
    const p = useMemo(() => getThemePreview(id), [id]);

    const card      = `hsl(${p.card})`;
    const primary   = `hsl(${p.primary})`;
    const sidebar   = `hsl(${p.sidebar})`;
    const fg        = `hsl(${p.fg})`;
    const mutedFg   = `hsl(${p.mutedFg})`;
    const secondary = `hsl(${p.secondary})`;
    const border    = `hsl(${p.border})`;

    return (
        <div className="w-full overflow-hidden" style={{ background: p.gradient || `hsl(${p.bg})`, aspectRatio: '4/2.5' }}>
            <div className="flex h-full">
                {/* Server-Strip */}
                <div className="flex flex-col items-center gap-1 py-1.5" style={{ width: '14%', background: sidebar }}>
                    <div className="w-3.5 h-3.5 rounded-md" style={{ background: primary }} />
                    <div className="w-3.5 h-3.5 rounded-full" style={{ background: card, border: `1px solid ${border}` }} />
                    <div className="w-3.5 h-3.5 rounded-full" style={{ background: card, border: `1px solid ${border}` }} />
                </div>

                {/* Channel-Liste */}
                <div className="flex flex-col gap-0.5 px-1.5 py-1.5" style={{ width: '26%', background: card }}>
                    <div className="h-1 rounded-sm" style={{ background: mutedFg, width: '60%' }} />
                    <div className="h-1.5 rounded-sm mt-0.5" style={{ background: secondary, width: '90%' }} />
                    <div className="h-1.5 rounded-sm" style={{ background: primary, opacity: 0.25, width: '85%' }} />
                    <div className="h-1.5 rounded-sm" style={{ background: secondary, width: '70%' }} />
                </div>

                {/* Chat-Bereich */}
                <div className="flex flex-col flex-1 px-2 py-1.5 gap-1 justify-end">
                    {/* Nachricht 1 (anderer User) */}
                    <div className="flex items-start gap-1">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: primary }} />
                        <div className="flex flex-col gap-0.5 flex-1">
                            <div className="h-1 rounded-sm" style={{ background: fg, width: '40%', opacity: 0.7 }} />
                            <div className="h-1.5 rounded-full" style={{ background: secondary, width: '85%' }} />
                        </div>
                    </div>
                    {/* Nachricht 2 (eigene) */}
                    <div className="flex items-start gap-1">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: primary, opacity: 0.55 }} />
                        <div className="flex flex-col gap-0.5 flex-1">
                            <div className="h-1 rounded-sm" style={{ background: fg, width: '32%', opacity: 0.7 }} />
                            <div className="h-1.5 rounded-full" style={{ background: secondary, width: '65%' }} />
                        </div>
                    </div>
                    {/* Input */}
                    <div className="h-3 rounded-md mt-0.5 flex items-center px-1.5" style={{ background: card, border: `1px solid ${border}` }}>
                        <div className="h-1 rounded-full flex-1" style={{ background: mutedFg, opacity: 0.5 }} />
                        <div className="w-2 h-2 rounded-full ml-1" style={{ background: primary }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ThemeCard({ id, theme, active, onSelect, icon = null }) {
    return (
        <button
            onClick={() => onSelect(id)}
            className={`relative flex flex-col rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                active
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border hover:border-muted-foreground/50'
            }`}
        >
            <ThemePreview id={id} />
            <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border">
                <span className={`text-sm font-medium flex items-center gap-1.5 ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>
                    {icon && <FontAwesomeIcon icon={icon} className="text-xs" />}
                    {theme.name}
                </span>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    active ? 'bg-primary' : 'border-2 border-border group-hover:border-muted-foreground/50'
                }`}>
                    {active && <FontAwesomeIcon icon={faCheck} className="text-primary-foreground text-[9px]" />}
                </div>
            </div>
        </button>
    );
}

const HUE_PRESETS = [
    { hue: 175, name: 'Teal' },
    { hue: 232, name: 'Indigo' },
    { hue: 258, name: 'Lila' },
    { hue: 295, name: 'Magenta' },
    { hue: 342, name: 'Rosenrot' },
    { hue: 12,  name: 'Tomatenrot' },
    { hue: 28,  name: 'Orange' },
    { hue: 48,  name: 'Gelb' },
    { hue: 142, name: 'Smaragd' },
    { hue: 170, name: 'Mint' },
    { hue: 205, name: 'Himmelblau' },
];

function CustomEditor({ config, onChange }) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Eigener Stil
                </span>
                <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                    <button
                        onClick={() => onChange({ mode: 'dark' })}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded cursor-pointer transition-colors ${
                            config.mode === 'dark'
                                ? 'bg-background text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <FontAwesomeIcon icon={faMoon} className="text-[10px]" />
                        Dunkel
                    </button>
                    <button
                        onClick={() => onChange({ mode: 'light' })}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded cursor-pointer transition-colors ${
                            config.mode === 'light'
                                ? 'bg-background text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <FontAwesomeIcon icon={faSun} className="text-[10px]" />
                        Hell
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Farbton</label>
                    <span className="text-xs text-muted-foreground tabular-nums">{Math.round(config.hue)}°</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={config.hue}
                    onChange={e => onChange({ hue: Number(e.target.value) })}
                    className="w-full cursor-pointer h-2 rounded-full appearance-none"
                    style={{
                        background: 'linear-gradient(to right, hsl(0,80%,55%), hsl(60,80%,55%), hsl(120,80%,55%), hsl(180,80%,55%), hsl(240,80%,55%), hsl(300,80%,55%), hsl(360,80%,55%))',
                    }}
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                    {HUE_PRESETS.map(preset => {
                        const active = Math.round(config.hue) === preset.hue;
                        return (
                            <button
                                key={preset.hue}
                                onClick={() => onChange({ hue: preset.hue })}
                                title={preset.name}
                                className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${active ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}`}
                                style={{ background: `hsl(${preset.hue} ${config.mode === 'light' ? 70 : config.saturation}% ${config.mode === 'light' ? 45 : 58}%)` }}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Sättigung</label>
                    <span className="text-xs text-muted-foreground tabular-nums">{Math.round(config.saturation)}%</span>
                </div>
                <input
                    type="range"
                    min={30}
                    max={100}
                    step={1}
                    value={config.saturation}
                    onChange={e => onChange({ saturation: Number(e.target.value) })}
                    className="w-full accent-primary cursor-pointer"
                />
            </div>
        </div>
    );
}

const GROUPS = [
    { id: 'dark',  label: 'Dunkle Designs' },
    { id: 'light', label: 'Helle Designs' },
];

function AppearanceSection() {
    const { themeId, applyTheme, updateCustom, customConfig } = useTheme();
    const themes = listThemes();

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Erscheinungsbild</h1>
            </div>

            <div className="max-w-[70%] py-4 px-4 w-full mx-auto flex flex-col gap-8 overflow-y-auto">
                {/* System */}
                <div>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Automatisch
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        <ThemeCard
                            id="system"
                            theme={themes.system}
                            active={themeId === 'system'}
                            onSelect={applyTheme}
                            icon={faDisplay}
                        />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                        Folgt der Hell/Dunkel-Einstellung deines Systems.
                    </p>
                </div>

                {/* Gruppen */}
                {GROUPS.map(group => {
                    const list = Object.entries(themes).filter(([, t]) => t.group === group.id);
                    if (list.length === 0) return null;
                    return (
                        <div key={group.id}>
                            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                {group.label}
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {list.map(([id, theme]) => (
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

                {/* Custom */}
                <div>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Eigener Stil
                    </h2>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <ThemeCard
                            id="custom"
                            theme={themes.custom}
                            active={themeId === 'custom'}
                            onSelect={applyTheme}
                            icon={faPalette}
                        />
                    </div>
                    <CustomEditor
                        config={customConfig}
                        onChange={updateCustom}
                    />
                </div>
            </div>
        </div>
    );
}

export default AppearanceSection;
