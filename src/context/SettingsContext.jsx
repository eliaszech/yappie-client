import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [open, setOpen] = useState(false);
    const [section, setSection] = useState('profile');

    function openSettings(section = 'profile') {
        setSection(section);
        setOpen(true);
    }

    return (
        <SettingsContext.Provider value={{ open, openSettings, closeSettings: () => setOpen(false), section, setSection }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
