import { expect } from 'chai';
import { updateTranslationFile } from '../../translation/translation-commands';
import * as vscode from 'vscode';
import { TranslationSets } from '../../translation/translation-sets';
import { LinguaSettings } from '../../lingua-settings';

suite('Translation Commands', () => {
    const copyTranslationFile = async function (name: string) {
        const translationFile = (
            await vscode.workspace.findFiles('**/src/assets/i18n/' + name, '**/node_modules/**', 1)
        )[0];
        const copy = vscode.Uri.file(translationFile.path.replace(name, 'copy_' + name));
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

    test('update translation file with hierchical translation keys', async () => {
        const hierarchicalTranslationFile = await copyTranslationFile('en.json');
        const flatKeys = false;

        // should not replace
        try {
            await updateTranslationFile(hierarchicalTranslationFile, 'welcome', 'Text', flatKeys, false);
        } catch (e) {}

        // should not replace
        try {
            await updateTranslationFile(hierarchicalTranslationFile, 'tour.title', 'Text', flatKeys, false).catch();
        } catch (e) {}

        // should replace
        await updateTranslationFile(hierarchicalTranslationFile, 'hello', 'Text', flatKeys, true);

        // should add
        await updateTranslationFile(hierarchicalTranslationFile, 'some.new.identifier', 'Text', flatKeys, false);

        // should append
        await updateTranslationFile(hierarchicalTranslationFile, 'tour.appended', 'Text', flatKeys, false);

        // should replace
        await updateTranslationFile(hierarchicalTranslationFile, 'tour.start', 'Text', flatKeys, true);

        vscode.workspace.saveAll();

        const translationSets = await buildTranslationSets(hierarchicalTranslationFile);
        const translationSet = translationSets.default;

        expect(translationSet.getTranslation('welcome')).to.not.eq('Text');
        expect(translationSet.getTranslation('hello')).to.eq('Text');
        expect(translationSet.getTranslation('some.new.identifier')).to.eq('Text');
        expect(translationSet.getTranslation('tour.appended')).to.eq('Text');
        expect(translationSet.getTranslation('tour.start')).to.eq('Text');
        expect(translationSet.getTranslation('tour.title')).to.not.eq('Text');

        try {
            await deleteTranslationFile(hierarchicalTranslationFile);
        } catch (error) {}
    });

    test('update translation file with flat translation keys', async () => {
        const flatTranslationFile = await copyTranslationFile('en_flat.json');
        const flatKeys = true;

        // should not replace
        try {
            await updateTranslationFile(flatTranslationFile, 'welcome', 'Text', flatKeys, false);
        } catch (e) {}

        // should not replace
        try {
            await updateTranslationFile(flatTranslationFile, 'tour.title', 'Text', flatKeys, false).catch();
        } catch (e) {}

        // should replace
        await updateTranslationFile(flatTranslationFile, 'hello', 'Text', flatKeys, true);

        // should add
        await updateTranslationFile(flatTranslationFile, 'some.new.identifier', 'Text', flatKeys, false);

        // should append
        await updateTranslationFile(flatTranslationFile, 'tour.appended', 'Text', flatKeys, false);

        // should replace
        await updateTranslationFile(flatTranslationFile, 'tour.start', 'Text', flatKeys, true);

        vscode.workspace.saveAll();

        const translationSets = await buildTranslationSets(flatTranslationFile);
        const translationSet = translationSets.default;

        expect(translationSet.getTranslation('welcome')).to.not.eq('Text');
        expect(translationSet.getTranslation('hello')).to.eq('Text');
        expect(translationSet.getTranslation('some.new.identifier')).to.eq('Text');
        expect(translationSet.getTranslation('tour.appended')).to.eq('Text');
        expect(translationSet.getTranslation('tour.start')).to.eq('Text');
        expect(translationSet.getTranslation('tour.title')).to.not.eq('Text');

        try {
            await deleteTranslationFile(flatTranslationFile);
        } catch (error) {}
    });
});
