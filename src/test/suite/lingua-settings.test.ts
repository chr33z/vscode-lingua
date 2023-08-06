import { expect } from 'chai';
import * as vscode from 'vscode';
import { LinguaSettings, readSettings } from '../../lingua-settings';

suite('Lingua Settings', () => {
    const deleteLinguaSettings = async function () {
        const linguaSettingsFile = await vscode.workspace.findFiles('**/.lingua', `**/node_modules/**`, 1);
        if (linguaSettingsFile.length > 0) {
            await vscode.workspace.fs.delete(linguaSettingsFile[0]);
        }
    };

    setup(async () => {
        await deleteLinguaSettings();
    });

    teardown(async () => {
        await deleteLinguaSettings();
    });

    test('read settings', async () => {
        await deleteLinguaSettings();

        const settings: LinguaSettings = await readSettings();
        expect(settings).to.exist;
    });

    test('add and remove translation set to settings', async () => {
        await deleteLinguaSettings();

        let settings: LinguaSettings = await readSettings();
        await settings.addTranslationSet('test', vscode.Uri.parse(""));
        settings = await readSettings();

        expect(Object.keys(settings.translationFiles).length).to.eq(1);
        expect(Object.keys(settings.translationFiles)[0]).to.eq('test');

        await settings.removeTranslationSet('test');
        settings = await readSettings();

        expect(Object.keys(settings.translationFiles).length).to.eq(0);
    });
});
