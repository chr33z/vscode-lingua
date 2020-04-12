import { expect } from 'chai';
import { updateTranslationFile } from '../../translation/translation-commands';
import * as vscode from 'vscode';
import { TranslationSets } from '../../translation/translation-sets';
import { LinguaSettings } from '../../lingua-settings';
import { Selection, Position, Range } from 'vscode';
import { selectTranslationPath, isTranslationIdentifier } from '../../translation/translation-utils';
// tslint:disable: no-unused-expression

suite('Translation Commands', () => {
    let copyOfTranslationFile: vscode.Uri;

    const copyTranslationFile = async function () {
        const translationFile = (
            await vscode.workspace.findFiles('**/src/assets/i18n/en.json', '**/node_modules/**', 1)
        )[0];
        const copy = vscode.Uri.file(translationFile.path.replace('en.json', 'copy.json'));
        await vscode.workspace.fs.copy(translationFile, copy, { overwrite: true });
        return copy;
    };

    const deleteTranslationFile = async function (uri: vscode.Uri) {
        await vscode.workspace.fs.delete(uri);
    };

    const buildTranslationSets = async function (uri: vscode.Uri): Promise<TranslationSets> {
        const settings: LinguaSettings = new LinguaSettings();
        settings.translationFiles.push({ lang: 'copy', uri: vscode.workspace.asRelativePath(uri) });

        const translationSets = new TranslationSets();
        await translationSets.build(settings);
        return translationSets;
    };

    setup(async () => {
        copyOfTranslationFile = await copyTranslationFile();
    });

    teardown(async () => {
        await deleteTranslationFile(copyOfTranslationFile);
    });

    test('create translation', async () => {});

    test('update translation file', async () => {
        try {
            await updateTranslationFile(copyOfTranslationFile, 'welcome', 'Text'); // should not replace
        } catch (e) {}
        try {
            await updateTranslationFile(copyOfTranslationFile, 'tour.title', 'Text', false).catch(); // should not replace
        } catch (e) {}

        await updateTranslationFile(copyOfTranslationFile, 'hello', 'Text', true); // should replace
        await updateTranslationFile(copyOfTranslationFile, 'some.new.identifier', 'Text'); // should add
        await updateTranslationFile(copyOfTranslationFile, 'tour.appended', 'Text'); // should append
        await updateTranslationFile(copyOfTranslationFile, 'tour.start', 'Text', true); // should replace
        vscode.workspace.saveAll();

        const translationSets = await buildTranslationSets(copyOfTranslationFile);
        const translationSet = translationSets.default;

        expect(translationSet.getTranslation('welcome')).to.not.eq('Text');
        expect(translationSet.getTranslation('hello')).to.eq('Text');
        expect(translationSet.getTranslation('some.new.identifier')).to.eq('Text');
        expect(translationSet.getTranslation('tour.appended')).to.eq('Text');
        expect(translationSet.getTranslation('tour.start')).to.eq('Text');
        expect(translationSet.getTranslation('tour.title')).to.not.eq('Text');
    });

    test('create translation', () => {});
});
