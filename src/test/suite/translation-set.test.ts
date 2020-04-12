import { expect } from 'chai';
import * as vscode from 'vscode';
import { LinguaSettings } from '../../lingua-settings';
import { TranslationSets } from '../../translation/translation-sets';

suite('Translation Set', () => {
    const addTranslationSets = async function (): Promise<TranslationSets> {
        const excludePattern = '**/node_modules/**';
        const enFile = (await vscode.workspace.findFiles('**/src/assets/i18n/en.json', excludePattern, 1))[0];
        const deFile = (await vscode.workspace.findFiles('**/src/assets/i18n/de.json', excludePattern, 1))[0];

        const settings: LinguaSettings = new LinguaSettings();
        settings.translationFiles.push({ lang: 'en', uri: vscode.workspace.asRelativePath(enFile) });
        settings.translationFiles.push({ lang: 'de', uri: vscode.workspace.asRelativePath(deFile) });

        const translationSets = new TranslationSets();
        await translationSets.build(settings);
        return translationSets;
    };

    test('add translationsets', async () => {
        const translationSets = await addTranslationSets();
        expect(Object.keys(translationSets.get).length).to.eq(2);
    });

    test('translation set contains translations', async () => {
        const translationSets = await addTranslationSets();
        const translationSet = translationSets.default;

        expect(translationSet.keys.length).to.eq(6);
        expect(translationSet.getTranslation('welcome')).to.eq('Welcome to ');
        expect(translationSet.getTranslation('tour.start')).to.eq('Here are some links to help you start:');
        expect(translationSet.getTranslation('some missing translation')).to.be.null;
    });

    test('translation set contains partial translation paths', async () => {
        const translationSets = await addTranslationSets();
        const translationSet = translationSets.default;

        expect(translationSet.isPartialMatch('tour')).to.be.true;
    });
});
