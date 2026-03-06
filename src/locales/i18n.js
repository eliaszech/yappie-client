import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    de: {
        translation: {
            messages: {
                friends: 'Freunde',
                quests: 'Quests',
                filter: {
                    all: 'Alle',
                    online: 'Online',
                }
            }
        }
    }
}

i18n.use(initReactI18next).init({
    resources,
    lng: 'de',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    }
});

export default i18n;