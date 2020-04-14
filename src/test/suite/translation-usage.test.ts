import { expect } from 'chai';
import * as vscode from 'vscode';
import { TranslationSets } from '../../translation/translation-sets';
import { LinguaSettings } from '../../lingua-settings';
import { TranslationUsage } from '../../translation/analysis/translation-usage';
// tslint:disable: no-unused-expression

suite('Translation Usage', () => {
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

    test('translation analysis', async () => {
        const translationSets = await addTranslationSets();
        const analysis = new TranslationUsage();

        await analysis.analyse(['ts', 'html'], translationSets);

        expect(analysis.found.size).to.eq(6);
        expect(analysis.missing.length).to.eq(3);
        expect(analysis.totalFiles).to.eq(13);
        expect(analysis.totalTranslations.get('en')).to.eq(9);
        expect(analysis.totalTranslations.get('de')).to.eq(5);
    });
});
