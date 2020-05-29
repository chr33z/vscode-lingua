import { expect } from 'chai';
import * as vscode from 'vscode';
import { TranslationSets } from '../../translation/translation-sets';
import { LinguaSettings } from '../../lingua-settings';
import { updateTranslationFile } from '../../translation/commands/translation-command-helper';
import { useFlatTranslationKeys } from '../../configuration-settings';

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

    const setFlatTranslationKey = async function (enabled: boolean) {
        return vscode.workspace.getConfiguration('lingua').update('flatTranslationKeys', enabled);
    };

    test('update translation file with hierchical translation keys', async () => {
        const hierarchicalTranslationFile = await copyTranslationFile('en.json');
        await setFlatTranslationKey(false);

        // should not replace
        try {
            await updateTranslationFile(hierarchicalTranslationFile, 'welcome', 'Text', false);
        } catch (e) {}

        // should not replace
        try {
            await updateTranslationFile(hierarchicalTranslationFile, 'tour.title', 'Text', false).catch();
        } catch (e) {}

        // should replace
        await updateTranslationFile(hierarchicalTranslationFile, 'hello', 'Text', true);

        // should add
        await updateTranslationFile(hierarchicalTranslationFile, 'some.new.identifier', 'Text', false);

        // should append
        await updateTranslationFile(hierarchicalTranslationFile, 'tour.appended', 'Text', false);

        // should replace
        await updateTranslationFile(hierarchicalTranslationFile, 'tour.start', 'Text', true);

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
        await setFlatTranslationKey(true);

        // should not replace
        try {
            await updateTranslationFile(flatTranslationFile, 'welcome', 'Text', false);
        } catch (e) {}

        // should not replace
        try {
            await updateTranslationFile(flatTranslationFile, 'tour.title', 'Text', false).catch();
        } catch (e) {}

        // should replace
        await updateTranslationFile(flatTranslationFile, 'hello', 'Text', true);

        // should add
        await updateTranslationFile(flatTranslationFile, 'some.new.identifier', 'Text', false);

        // should append
        await updateTranslationFile(flatTranslationFile, 'tour.appended', 'Text', false);

        // should replace
        await updateTranslationFile(flatTranslationFile, 'tour.start', 'Text', true);

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
