/**
 * Datatype representing one translation with a list of paths that have that translation
 */
export class DuplicateTranslationResult {
    public translation = '';
    public occurences = 0;
    public paths: string[] = [];

    constructor(translation: string, paths: string[]) {
        if (translation && paths.length > 1) {
            this.translation = translation;
            this.paths = paths;
            this.occurences = paths.length;
        }
    }
}
