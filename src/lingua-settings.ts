import { Uri } from 'vscode';

export class LinguaSettings {
    /**
     * Defaults for when there is no settings file yet
     */
    public static Default: LinguaSettings = {
        analysisFiles: ['ts', 'html'],
        translationFiles: [],
        defaultLang: 'de',
        showPotentialTranslationIdentifieres: true,
    };

    /**
     * List if file type endings that are scanned for translation statistics
     */
    public analysisFiles: string[] = [];

    /**
     * key-value pair of languages associated with their corresponding json file
     */
    public translationFiles: { lang: string; uri: Uri }[] = [];

    /**
     * The current default language
     */
    public defaultLang: string = '';

    /**
     * If true the decorator will underline potential translation identifiers
     * that have no translation yet
     */
    public showPotentialTranslationIdentifieres: boolean = false;
}
