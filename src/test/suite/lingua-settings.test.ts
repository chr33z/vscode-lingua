import { expect } from 'chai';
import * as vscode from 'vscode';
import { LinguaSettings, readSettings, writeSettings } from '../../lingua-settings';

suite('Lingua Settings', () => {
    const deleteLinguaSettings = async function () {
        const linguaSettingsFile = await vscode.workspace.findFiles('**/**/.lingua', `**/node_modules/**`, 1);
        if (linguaSettingsFile.length > 0) {
            vscode.workspace.fs.delete(linguaSettingsFile[0]);
        }
    };

    test('read settings', async () => {
        deleteLinguaSettings();
        const settings: LinguaSettings = await readSettings();
        expect(settings).to.exist;
    });

    test('write settings', async () => {
        deleteLinguaSettings();
        let settings: LinguaSettings = await readSettings();
        writeSettings(settings, 'translationFiles', [{ lang: 'test', uri: vscode.Uri.file('') }]);
        settings = await readSettings();

        expect(settings.translationFiles.length).to.eq(1);
        expect(settings.translationFiles[0].lang).to.eq('test');
    });
});
