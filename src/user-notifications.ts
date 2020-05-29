import { window } from 'vscode';
import { Configuration } from './configuration-settings';

export class Notification {
    public static async showWarningNoTranslationFile() {
        window.showWarningMessage(
            'There is no translation file *.json configured for this extension.\n' +
                'To use it, please navigate to your translation file and set it via the context menu\n' +
                " or by calling 'lingua:selectLocaleFile'"
        );
    }

    public static async showWarningNestedKeyStyle() {
        if (!Configuration.warnAboutTranslationKeyStyles()) {
            return;
        }

        const actionDontNotifyAgain = 'Do not notify me again';

        await window
            .showWarningMessage(
                'It appears your are using "flat" and "nested" translation keys at the same time.\n' +
                    'At the moment Lingua only supports either "flat" or "nested" translations keys.\n' +
                    'Please chose the key style of your choice in the settings.',
                actionDontNotifyAgain
            )
            .then(async (action) => {
                if (action === actionDontNotifyAgain) {
                    await Configuration.setWarnAboutTranslationKeyStyles(false);
                }
            });
    }

    public static async showWarningFlatKeyStyle() {
        if (!Configuration.warnAboutTranslationKeyStyles()) {
            return;
        }

        const actionChangeKey = 'Change Key Style';
        const actionDontNotifyAgain = 'Do not notify me again';

        await window
            .showWarningMessage(
                'It appears you are using a "flat" translation key style.\n' +
                    'We suggest you activate the "flat" translation key style option in the settings\n' +
                    'to be able to use all Lingua commands',
                actionChangeKey,
                actionDontNotifyAgain
            )
            .then(async (action) => {
                if (action === actionChangeKey) {
                    await Configuration.setUseFlatTranslationKey(true);
                    Notification.showSettingKeyStyleChanged();
                } else if (action === actionDontNotifyAgain) {
                    await Configuration.setWarnAboutTranslationKeyStyles(false);
                }
            });
    }

    public static async showLinguaSettingCreated() {
        window.showInformationMessage('Created/Updated the .lingua settings file in your workspace directory');
    }

    public static async showSettingKeyStyleChanged() {
        const flatKey = Configuration.useFlatTranslationKeys();
        window.showInformationMessage(`${flatKey ? 'Enabled' : 'Disabled'} Settings 'use flat translation keys'`);
    }
}
