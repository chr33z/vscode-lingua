import { expect } from 'chai';
import * as vscode from 'vscode';
import { LinguaSettings, readSettings, writeSettings } from '../../lingua-settings';

suite('Lingua Settings', () => {

	test('read settings', async () => {
        const settings: LinguaSettings = await readSettings();
		expect(settings).to.exist;
    });

    test('write settings', async () => {
        let settings: LinguaSettings = await readSettings();
        writeSettings(settings, 'translationFiles', [{ lang:'test', uri: vscode.Uri.file('') }]);
        settings = await readSettings();

		expect(settings.translationFiles.length).to.eq(1);
		expect(settings.translationFiles[0].lang).to.eq('test');
    });
    
});
