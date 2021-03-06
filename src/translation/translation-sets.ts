import { workspace, Uri, window } from 'vscode';
import { TranslationSet } from './translation-set';
import { LinguaSettings } from '../lingua-settings';
import { Configuration } from '../configuration-settings';

export class TranslationSets {
    private _translationSets: { [locale: string]: TranslationSet } = {};

    private _settings: LinguaSettings = new LinguaSettings();

    public uris: { [locale: string]: Uri } = {};

    public get count(): number {
        return this._translationSets ? Object.keys(this._translationSets).length : 0;
    }

    /**
     * Getter for all translation sets
     */
    public get get(): { [locale: string]: TranslationSet } {
        return this._translationSets;
    }

    /**
     * Return either the default translation set if defined, otherwise try to return the
     * first one.
     */
    public get default(): TranslationSet {
        if (!this._settings || Object.keys(this._translationSets).length === 0) {
            return new TranslationSet();
        }
        let defaultLanguage = Configuration.defaultLanguage();

        if (!defaultLanguage || !Object.keys(this._translationSets).includes(defaultLanguage)) {
            defaultLanguage = Object.keys(this._translationSets)[0];
        }

        return this._translationSets[defaultLanguage];
    }

    public async build(settings: LinguaSettings) {
        this._settings = settings;

        await Promise.all(
            settings.translationFiles.map(async (localeFile) => {
                try {
                    const absoluteUri = Uri.file(`${workspace.rootPath}/${localeFile.uri}`);
                    await workspace.openTextDocument(absoluteUri).then((document) => {
                        if (document) {
                            const json = document.getText();
                            const translationSet = new TranslationSet();
                            translationSet.build(localeFile.lang, absoluteUri, JSON.parse(json));
                            this._translationSets[localeFile.lang] = translationSet;
                        }
                    });
                } catch (e) {
                    console.error(e);
                }
            })
        );
    }
}
