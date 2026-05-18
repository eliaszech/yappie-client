import { useState, useCallback, useEffect } from 'react';

// All themes target WCAG AA contrast: body text >=7:1 against background,
// secondary text >=4.5:1. Each theme defines the full var set so switching
// never leaves stale values bleeding through from a previous theme.

const DARK_BASE = {
    '--background':            '220 14% 13%',
    '--foreground':            '210 14% 90%',
    '--card':                  '220 16% 10%',
    '--card-foreground':       '210 14% 90%',
    '--popover':               '220 16% 10%',
    '--popover-foreground':    '210 14% 90%',
    '--secondary':             '220 12% 22%',
    '--secondary-foreground':  '210 14% 78%',
    '--muted':                 '220 13% 18%',
    '--muted-foreground':      '215 12% 62%',
    '--destructive':           '0 72% 56%',
    '--destructive-foreground':'0 0% 100%',
    '--border':                '220 14% 18%',
    '--input':                 '220 14% 18%',
    '--guild-bar':             '220 18% 7%',
};

const LIGHT_BASE = {
    '--background':            '220 22% 95%',
    '--foreground':            '220 18% 16%',
    '--card':                  '0 0% 100%',
    '--card-foreground':       '220 18% 16%',
    '--popover':               '0 0% 100%',
    '--popover-foreground':    '220 18% 16%',
    '--secondary':             '220 16% 88%',
    '--secondary-foreground':  '220 14% 28%',
    '--muted':                 '220 18% 90%',
    '--muted-foreground':      '220 8% 42%',
    '--destructive':           '0 70% 48%',
    '--destructive-foreground':'0 0% 100%',
    '--border':                '220 14% 82%',
    '--input':                 '220 14% 82%',
    '--guild-bar':             '220 18% 87%',
};

function tinted(base, hue, overrides = {}) {
    const out = { ...base };
    for (const [key, value] of Object.entries(base)) {
        const m = value.match(/^(\d+) (\d+)% (\d+)%$/);
        if (m) {
            out[key] = `${hue} ${m[2]}% ${m[3]}%`;
        }
    }
    return { ...out, ...overrides };
}

function darkGradient(hue = 220) {
    // Subtle diagonal gradient: same hue, two slightly different L/S values.
    // Stays close to --background so cards still pop.
    return `linear-gradient(135deg, hsl(${hue} 18% 10%) 0%, hsl(${hue} 14% 13%) 50%, hsl(${hue} 16% 9%) 100%)`;
}

function lightGradient(hue = 220) {
    return `linear-gradient(135deg, hsl(${hue} 24% 96%) 0%, hsl(${hue} 22% 93%) 50%, hsl(${hue} 26% 91%) 100%)`;
}

function darkTheme({ name, group = 'dark', hue, primary, primaryFg = '0 0% 8%', accent, accentFg, gradient }) {
    const base = hue != null ? tinted(DARK_BASE, hue) : DARK_BASE;
    return {
        name,
        group,
        vars: {
            ...base,
            '--primary': primary,
            '--primary-foreground': primaryFg,
            '--accent': accent ?? primary,
            '--accent-foreground': accentFg ?? primaryFg,
            '--ring': primary,
            '--gradient-app': gradient ?? darkGradient(hue ?? 220),
        },
    };
}

function lightTheme({ name, group = 'light', hue, primary, primaryFg = '0 0% 100%', accent, accentFg, gradient }) {
    const base = hue != null ? tinted(LIGHT_BASE, hue) : LIGHT_BASE;
    return {
        name,
        group,
        vars: {
            ...base,
            '--primary': primary,
            '--primary-foreground': primaryFg,
            '--accent': accent ?? primary,
            '--accent-foreground': accentFg ?? primaryFg,
            '--ring': primary,
            '--gradient-app': gradient ?? lightGradient(hue ?? 220),
        },
    };
}

export const STATIC_THEMES = {
    dark:     darkTheme({
        name: 'Dunkel',
        primary: '175 60% 52%', primaryFg: '180 50% 8%',
        gradient: 'linear-gradient(135deg, hsl(220 18% 10%) 0%, hsl(200 22% 11%) 50%, hsl(175 25% 9%) 100%)',
    }),
    midnight: darkTheme({
        name: 'Mitternacht',
        hue: 230, primary: '232 85% 68%', primaryFg: '0 0% 100%',
        gradient: 'linear-gradient(135deg, hsl(232 30% 8%) 0%, hsl(245 28% 10%) 50%, hsl(260 26% 7%) 100%)',
    }),
    forest: darkTheme({
        name: 'Waldgrün',
        hue: 150, primary: '150 55% 55%', primaryFg: '150 40% 8%',
        gradient: 'linear-gradient(135deg, hsl(150 22% 9%) 0%, hsl(165 18% 11%) 50%, hsl(140 24% 8%) 100%)',
    }),
    sunset: darkTheme({
        name: 'Sonnenuntergang',
        hue: 20, primary: '28 92% 62%', primaryFg: '20 50% 10%',
        gradient: 'linear-gradient(135deg, hsl(20 30% 10%) 0%, hsl(8 26% 12%) 50%, hsl(342 22% 9%) 100%)',
    }),
    rose: darkTheme({
        name: 'Rosenrot',
        hue: 342, primary: '342 80% 65%', primaryFg: '0 0% 100%',
        gradient: 'linear-gradient(135deg, hsl(342 22% 10%) 0%, hsl(320 20% 12%) 50%, hsl(0 22% 9%) 100%)',
    }),
    ozean: darkTheme({
        name: 'Ozean',
        hue: 205, primary: '200 75% 60%', primaryFg: '210 50% 8%',
        gradient: 'linear-gradient(135deg, hsl(205 32% 9%) 0%, hsl(220 26% 11%) 50%, hsl(195 30% 8%) 100%)',
    }),
    sage: darkTheme({
        name: 'Salbei',
        hue: 85, primary: '85 45% 60%', primaryFg: '85 40% 10%',
        gradient: 'linear-gradient(135deg, hsl(85 20% 10%) 0%, hsl(70 18% 11%) 50%, hsl(100 22% 9%) 100%)',
    }),
    lavender: darkTheme({
        name: 'Lavendel',
        hue: 270, primary: '270 70% 70%', primaryFg: '0 0% 100%',
        gradient: 'linear-gradient(135deg, hsl(270 24% 10%) 0%, hsl(285 22% 12%) 50%, hsl(255 26% 9%) 100%)',
    }),
    slate: {
        name: 'Schiefer',
        group: 'dark',
        vars: {
            '--background':            '220 6% 14%',
            '--foreground':            '220 8% 90%',
            '--card':                  '220 8% 11%',
            '--card-foreground':       '220 8% 90%',
            '--popover':               '220 8% 11%',
            '--popover-foreground':    '220 8% 90%',
            '--primary':               '210 30% 72%',
            '--primary-foreground':    '215 40% 12%',
            '--secondary':             '220 6% 22%',
            '--secondary-foreground':  '220 8% 78%',
            '--muted':                 '220 6% 18%',
            '--muted-foreground':      '220 6% 62%',
            '--accent':                '210 30% 72%',
            '--accent-foreground':     '215 40% 12%',
            '--destructive':           '0 72% 56%',
            '--destructive-foreground':'0 0% 100%',
            '--border':                '220 6% 20%',
            '--input':                 '220 6% 20%',
            '--ring':                  '210 30% 72%',
            '--guild-bar':             '220 8% 8%',
            '--gradient-app':          'linear-gradient(135deg, hsl(220 8% 10%) 0%, hsl(215 10% 12%) 50%, hsl(225 6% 9%) 100%)',
        },
    },
    light:  lightTheme({
        name: 'Hell',
        primary: '175 60% 36%',
        gradient: 'linear-gradient(135deg, hsl(220 30% 96%) 0%, hsl(200 26% 94%) 50%, hsl(175 24% 93%) 100%)',
    }),
    sakura: lightTheme({
        name: 'Kirschblüte',
        hue: 342, primary: '342 70% 48%',
        gradient: 'linear-gradient(135deg, hsl(342 35% 96%) 0%, hsl(320 30% 94%) 50%, hsl(0 28% 95%) 100%)',
    }),
};

const CUSTOM_CONFIG_KEY = 'yappie-custom-theme';
const DEFAULT_CUSTOM_CONFIG = { hue: 175, saturation: 60, mode: 'dark' };

function clampHue(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return DEFAULT_CUSTOM_CONFIG.hue;
    return ((n % 360) + 360) % 360;
}

function clampPct(v, min, max, fallback) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

export function getCustomConfig() {
    try {
        const raw = localStorage.getItem(CUSTOM_CONFIG_KEY);
        if (!raw) return { ...DEFAULT_CUSTOM_CONFIG };
        const parsed = JSON.parse(raw);
        return {
            hue: clampHue(parsed.hue),
            saturation: clampPct(parsed.saturation, 30, 100, 60),
            mode: parsed.mode === 'light' ? 'light' : 'dark',
        };
    } catch {
        return { ...DEFAULT_CUSTOM_CONFIG };
    }
}

export function setCustomConfig(config) {
    const safe = {
        hue: clampHue(config.hue),
        saturation: clampPct(config.saturation, 30, 100, 60),
        mode: config.mode === 'light' ? 'light' : 'dark',
    };
    localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(safe));
    return safe;
}

function buildCustomVars(config) {
    const { hue, saturation, mode } = config;
    if (mode === 'light') {
        return lightTheme({
            name: 'Eigener Stil',
            hue,
            primary: `${hue} ${Math.min(saturation, 70)}% 40%`,
        }).vars;
    }
    return darkTheme({
        name: 'Eigener Stil',
        hue,
        primary: `${hue} ${saturation}% 58%`,
        primaryFg: saturation >= 70 ? `${hue} 40% 8%` : '0 0% 100%',
    }).vars;
}

function systemPrefersDark() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

function resolveVars(id) {
    if (id === 'system') {
        return systemPrefersDark() ? STATIC_THEMES.dark.vars : STATIC_THEMES.light.vars;
    }
    if (id === 'custom') {
        return buildCustomVars(getCustomConfig());
    }
    return (STATIC_THEMES[id] ?? STATIC_THEMES.dark).vars;
}

function applyVars(vars) {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value);
    }
}

function applyThemeById(id) {
    applyVars(resolveVars(id));
}

export function initTheme() {
    const saved = localStorage.getItem('yappie-theme') || 'dark';
    applyThemeById(saved);
    if (saved === 'system') {
        window.matchMedia?.('(prefers-color-scheme: dark)')
            .addEventListener?.('change', () => applyThemeById('system'));
    }
}

// Exposes both static themes and the synthetic "system" / "custom" entries.
export function listThemes() {
    return {
        system: { name: 'Systemdesign', group: 'system' },
        ...STATIC_THEMES,
        custom: { name: 'Eigener Stil', group: 'custom' },
    };
}

// Returns the colors used by the preview card for any theme id, computed
// against the *current* state (so custom + system reflect their live values).
export function getThemePreview(id) {
    const vars = resolveVars(id);
    return {
        bg:        vars['--background'],
        card:      vars['--card'],
        primary:   vars['--primary'],
        sidebar:   vars['--guild-bar'],
        fg:        vars['--foreground'],
        mutedFg:   vars['--muted-foreground'],
        secondary: vars['--secondary'],
        border:    vars['--border'],
        gradient:  vars['--gradient-app'],
    };
}

export function useTheme() {
    const [themeId, setThemeId] = useState(() => localStorage.getItem('yappie-theme') || 'dark');
    const [, forceRerender] = useState(0);

    const applyTheme = useCallback((id) => {
        applyThemeById(id);
        localStorage.setItem('yappie-theme', id);
        setThemeId(id);
    }, []);

    // Live preview without committing — used for hover effect in the selector.
    // Pass `null` to revert to the currently-saved theme.
    const previewTheme = useCallback((id) => {
        if (id == null) {
            const saved = localStorage.getItem('yappie-theme') || 'dark';
            applyThemeById(saved);
        } else {
            applyThemeById(id);
        }
    }, []);

    const updateCustom = useCallback((patch) => {
        const next = setCustomConfig({ ...getCustomConfig(), ...patch });
        if ((localStorage.getItem('yappie-theme') || 'dark') === 'custom') {
            applyThemeById('custom');
        }
        forceRerender(n => n + 1);
        return next;
    }, []);

    useEffect(() => {
        if (themeId !== 'system') return;
        const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
        if (!mq) return;
        const handler = () => {
            applyThemeById('system');
            forceRerender(n => n + 1);
        };
        mq.addEventListener?.('change', handler);
        return () => mq.removeEventListener?.('change', handler);
    }, [themeId]);

    return { themeId, applyTheme, previewTheme, updateCustom, customConfig: getCustomConfig() };
}
