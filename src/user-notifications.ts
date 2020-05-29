import { window } from 'vscode';
import { Configuration } from './configuration-settings';

export class Notification {
    public static async showWarningNoTranslationFile() {
        window.showWarningMessage(
            'Lingua: There is no translation file *.json configured for this extension.\n' +
                'To use it, please navigate to your translation file and set it via the context menu\n' +
                " or by calling 'lingua:selectLocaleFile'"
        );
    }

    public static async showWarningNestedKeyStyle() {
        window.showWarningMessage(
            'Lingua: It appears your are using "flat" and "nested" translation keys at the same time.\n' +
                'At the moment Lingua only supports either "flat" or "nested" translations keys.\n' +
                'Please chose the key style of your choice in the settings.'
        );
    }

    public static async showWarningFlatKeyStyle() {
        await window
            .showWarningMessage(
                'Lingua: It appears you are using a "flat" translation key style.\n' +
                    'We suggest you activate the "flat" translation key style option in the settings\n' +
                    'to be able to use all Lingua commands',
                'Change Key Style'
            )
            .then(async (action) => {
                if (action) {
                    Notification.showSettingKeyStyleChanged();
                }
            });
    }

    public static async showLinguaSettingCreated() {
        window.showInformationMessage('Lingua: Created/Updated the .lingua settings file in your workspace directory');
    }

    public static async showSettingKeyStyleChanged() {
        const flatKey = Configuration.useFlatTranslationKeys();
        window.showInformationMessage(`${flatKey ? 'Enabled' : 'Disabled'} Settings 'use flat translation keys'`);
    }
}
