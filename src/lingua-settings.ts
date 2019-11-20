import { Uri, workspace, window } from 'vscode';
import { assign } from 'lodash';

var textEncoding = require('text-encoding');
var TextEncoder = textEncoding.TextEncoder;

export class LinguaSettings {
    /**
     * Defaults for when there is no settings file yet
     */
    public static Default: LinguaSettings = {
        analysisFiles: ['ts', 'html'],
        translationFiles: [],
        defaultLang: '',
        showPotentialIdentifieres: false,
    };

    /**
     * List if file type endings that are scanned for translation statistics
     */
    public analysisFiles: string[] = [];

    /**
     * key-value pair of languages associated with their corresponding json file
     */
    public translationFiles: { lang: string; uri: Uri }[] = [];

    /**
     * The current default language
     */
    public defaultLang: string = '';

    /**
     * If true the decorator will underline potential translation identifiers
     * that have no translation yet
     */
    public showPotentialIdentifieres: boolean = false;
}

export async function readSettings(): Promise<LinguaSettings> {
    if (workspace.workspaceFolders) {
        const linguaSettingsUrl = Uri.file(`${workspace.rootPath}/.lingua`);

        try {
            const doc = await workspace.openTextDocument(linguaSettingsUrl);
            const settings = assign(LinguaSettings.Default, JSON.parse(doc.getText()));
            return Promise.resolve(settings);
        } catch (e) {
            console.warn(e);
        }
    }

    console.log('[Lingua] [Settings] Loading default settings...');
    return Promise.resolve(LinguaSettings.Default);
}

export async function writeSettings(settings: LinguaSettings, key: string, value: any) {
    if (key in settings) {
        (settings as any)[key] = value;
    }

    if (workspace.workspaceFolders) {
        try {
            const uri = Uri.file(`${workspace.rootPath}/.lingua`);
            workspace.fs.writeFile(uri, new TextEncoder('utf-8').encode(JSON.stringify(settings, null, 2)));
            window.showInformationMessage(
                'Lingua: Created/Updated the .lingua settings file in your workspace directory'
            );
        } catch (e) {
            window.showErrorMessage(e);
        }
    }
}
