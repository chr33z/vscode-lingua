import { TranslationSet } from '../translation-set';
import { workspace, Uri } from 'vscode';

export class DuplicateLeavesResult {
    public pathLeaf = '';
    public translations: { path: string; translation: string }[] = [];

    constructor(translations: { path: string; translation: string }[]) {
        if (translations && translations.length > 1) {
            this.translations = translations;
            try {
                const path = translations[0].path;
                const pathSegments = path.split('.');
                this.pathLeaf = pathSegments[pathSegments.length - 1];
            } catch (e) {}
        }
    }
}

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

export class TranslationDuplicates {
    public static async findDuplicatePathLeaves(translationSet: TranslationSet): Promise<DuplicateLeavesResult[]> {
        console.log('\n[Lingua] Analysing translation duplicates...');
        console.log('[Lingua] Looking for duplicate translation identifiers...');
        console.log('---------------------');

        if (!translationSet) {
            console.log(`[Lingua] Translation set is invalid...\n`);
            return Promise.reject();
        }

        const duplicateDict: { [leaf: string]: { path: string; translation: string }[] } = {};
        translationSet.keys.forEach((path) => {
            const leaf = this.getLastPathSegment(path);
            if (!(leaf in duplicateDict)) {
                duplicateDict[leaf] = [];
            }
            duplicateDict[leaf].push({ path: path, translation: translationSet.getTranslation(path) || '' });
        });

        const duplicateLeavesResult: DuplicateLeavesResult[] = [];
        Object.keys(duplicateDict).forEach((key) => {
            if (duplicateDict[key].length > 1) {
                duplicateLeavesResult.push(new DuplicateLeavesResult(duplicateDict[key]));
            }
        });

        return Promise.resolve(duplicateLeavesResult);
    }

    /**
     * Find duplicate translations paths that have the same translation
     * @param translationSet the translation set to analyse
     */
    public static async findDuplicateTranslations(
        translationSet: TranslationSet
    ): Promise<DuplicateTranslationResult[]> {
        console.log('\n[Lingua] Analysing translation duplicates...');
        console.log('[Lingua] Looking for duplicate translations...');
        console.log('---------------------');

        if (!translationSet) {
            console.log(`[Lingua] Translation set is invalid...\n`);
            return Promise.reject();
        }

        const translationDict: { [translation: string]: string[] } = {};
        translationSet.keys.forEach((path) => {
            const translation = translationSet.getTranslation(path) || '';
            if (!(translation in translationDict)) {
                translationDict[translation] = [];
            }
            translationDict[translation].push(path);
        });

        const duplicateTranslationsResult: DuplicateTranslationResult[] = [];
        Object.keys(translationDict).forEach((key) => {
            if (translationDict[key].length > 1) {
                duplicateTranslationsResult.push(new DuplicateTranslationResult(key, translationDict[key]));
            }
        });

        duplicateTranslationsResult.sort((a, b) => {
            if (a.occurences === b.occurences) {
                return 0;
            } else {
                return a.occurences < b.occurences ? -1 : 1;
            }
        });

        return Promise.resolve(duplicateTranslationsResult);
    }

    private static getLastPathSegment(path: string): string {
        const pathSegments = path.split('.');
        if (pathSegments && pathSegments.length > 0) {
            return pathSegments[pathSegments.length - 1];
        } else {
            return '';
        }
    }
}
