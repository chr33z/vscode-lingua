import { Uri, workspace, window } from 'vscode';
import { assign } from 'lodash';
import { Notification } from './user-notifications';

var textEncoding = require('text-encoding');
var TextEncoder = textEncoding.TextEncoder;

export class LinguaSettings {
    public translationFiles: { lang: string; uri: string }[] = [];

    public async addTranslationSet(language: string, relativePath: string) {
        const entry = this.translationFiles.find((file) => file.lang === language);
        if (entry) {
            entry.uri = relativePath;
        } else {
            this.translationFiles.push({ lang: language, uri: relativePath });
        }
        await writeSettings(this);
    }

    public async removeTranslationSet(language: string) {
        const filteredFiles = this.translationFiles.filter((f) => f.lang !== language);
        this.translationFiles = filteredFiles;
        await writeSettings(this);
    }
}

export async function readSettings(): Promise<LinguaSettings> {
    if (workspace.workspaceFolders) {
        const linguaSettingsUrl = Uri.file(`${workspace.rootPath}/.lingua`);

        try {
            const doc = await workspace.openTextDocument(linguaSettingsUrl);
            const settings = assign(new LinguaSettings(), JSON.parse(doc.getText()));
            return Promise.resolve(settings);
        } catch (e) {
            console.debug('Could not load .lingua settings file in root directory');
        }
    }

    console.debug('[Lingua] [Settings] Loading default settings...');
    return Promise.resolve(new LinguaSettings());
}

async function writeSettings(settings: LinguaSettings) {
    if (workspace.workspaceFolders) {
        try {
            const uri = Uri.file(`${workspace.rootPath}/.lingua`);
            await workspace.fs.writeFile(uri, new TextEncoder('utf-8').encode(JSON.stringify(settings, null, 2)));
            Notification.showLinguaSettingCreated();
        } catch (e) {
            window.showErrorMessage(e);
        }
    }
}
