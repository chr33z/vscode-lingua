import { window, Uri } from 'vscode';
import { Configuration } from './configuration-settings';

export class Notification {

    /**
     * Show an info that there are no translation files configured in this project. If there are potential translation files found in the workspace 
     * the prompt will ask if these files should be configured. Returns true if the user wants this files to be configured automatically.
     * @param translationFileMap 
     * @returns 
     */
    public static async showInfoNoTranslationFile(translationFileMap: Map<string, Uri> | undefined): Promise<boolean> {
        if (translationFileMap && translationFileMap.size > 0) {
            const translationFileIds = Array.from(translationFileMap.keys()).map(item => `"${item}"`).join(', ');
            const message: string = `There are no translation files configured for this project. We found ${translationFileIds} in your i18n folder. Set these files as translation files?`;
            const selection = await window.showInformationMessage(message, "Set a language files");
            return !!selection;
        }
        else {
            window.showInformationMessage(
                'There is no translation file *.json configured for this extension.\n' +
                'To use it, please navigate to your translation file and set it via the context menu\n' +
                " or by calling 'lingua:selectLocaleFile'", "Got it!"
            );
            return false;
        }
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
