import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    de: {
        translation: {
            messages: {
                friends: {
                    title: 'Freunde',
                    filters: {
                        texts: {
                            online: 'Online',
                            all: 'Alle Freunde',
                        },
                        online: 'Online',
                        all: 'Alle',
                    },
                    empty: {
                        online: 'Momentan wurden keine Freunde gefunden die Online sind.',
                        all: 'Es wurden keine Freunde gefunden.',
                    }
                },
                quests: 'Quests',
                addFriend: 'Freund hinzufügen'
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