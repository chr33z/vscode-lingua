import { Usage } from './usage';
import { Uri } from 'vscode';
import { TranslationMatch } from './translation-match';

/**
 * Item that represents the usage of one particular translation
 * in a [locale].json translation
 */
export class TranslationEntry {
    /** Locale in which this translation occurs */
    public locale: string = '';

    /** Path of the translation in the [locale].json */
    public translationPath: string = '';

    /** The translation */
    public translation: string = '';

    /** The files in which this translation occurs */
    public locations: {
        uri: Uri;
        line: Number;
        match: TranslationMatch;
    }[] = [];
}
