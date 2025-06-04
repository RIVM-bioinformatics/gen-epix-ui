/* eslint-disable @typescript-eslint/naming-convention */
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

export const setupI18next = () => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  i18next
    .use(initReactI18next)
    .init({
      // the translations
      // (tip move them in a JSON file and import them,
      // or even better, manage them via a UI: https://react.i18next.com/guides/multiple-translation-files#manage-your-translations-with-a-management-gui)
      resources: {
        en: {
          translation: {
          },
        },
        nl: {
          translation: {
            'Are you sure you want to logout?': 'Weet je zeker dat je wilt uitloggen?',
            'Click the logout button to logout': 'Klik op de uitloggen knop om uit te loggen',
            Admin: 'Beheer',
            Cancel: 'Annuleren',
            OK: 'OK',
            Events: 'Gebeurtenissen',
            Cases: 'Gevallen',
            Logout: 'Uitloggen',
            Statistics: 'Statistieken',
            Upload: 'Uploaden',
            Languages: 'Talen',
            English: 'Engels',
            Dutch: 'Nederlands',
            'Foo category': 'Foo categorie',
            'Bar category': 'Bar categorie',
            'Foo status': 'Foo status',
            'Bar status': 'Bar status',
            Show: 'Bekijken',
            'Selected node': 'Geselecteerde node',
          },
        },
      },
      lng: 'en', // if you're using a language detector, do not define the lng option
      fallbackLng: 'en',

      interpolation: {
        escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
      },
    });
};
