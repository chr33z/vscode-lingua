import { Uri, workspace, window } from 'vscode';
import { assign } from 'lodash';

var textEncoding = require('text-encoding');
var TextEncoder = textEncoding.TextEncoder;

export class LinguaSettings {
    /** key-value pair of languages associated with their corresponding json file */
    public translationFiles: { lang: string; uri: Uri }[] = [];
}

export async function readSettings(): Promise<LinguaSettings> {
    if (workspace.workspaceFolders) {
        const linguaSettingsUrl = Uri.file(`${workspace.rootPath}/.lingua`);

        try {
            const doc = await workspace.openTextDocument(linguaSettingsUrl);
            const settings = assign(new LinguaSettings(), JSON.parse(doc.getText()));
            return Promise.resolve(settings);
        } catch (e) {
            console.warn('Could not load .lingua settings file in root directory');
        }
    }

    console.debug('[Lingua] [Settings] Loading default settings...');
    return Promise.resolve(new LinguaSettings());
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
