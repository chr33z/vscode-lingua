import { Uri, workspace } from 'vscode';
import { TextDecoder } from 'util';
import { TranslationMatch } from './translation-match';
import { TranslationSets } from '../translation-sets';
import { findFilesWithExtension as findProjectFiles } from '../../extension-utils';
import { TranslationEntry } from './translation-entry';

export class TranslationUsage {
    private regex = new RegExp(/['|"|`]([a-zA-Z0-9\.\_\-]+)(\.\$.*)*['|"|`]/g);

    public found: Map<string, TranslationEntry> = new Map();
    public missing: string[] = [];
    public totalFiles: Number = 0;
    public totalTranslations: Map<string, number> = new Map();

    public async analyse(fileTypes: string[], translationSets: TranslationSets) {
        console.debug('\nAnalysing translation usage...');
        console.debug('---------------------');

        if (!translationSets.default) {
            return Promise.reject();
        }

        const uris = await findProjectFiles(fileTypes);

        console.debug(`Found ${uris.length} files to scan for translations...\n`);

        this.totalFiles = uris.length;

        Object.keys(translationSets.get).forEach((locale) => {
            this.totalTranslations.set(locale, translationSets.get[locale].keys.length);
        });

        /*
            Iterate over files and try to regex all candidates. Then match each
            candiate with all translationSets
        */
        for (const uri of uris) {
            const fileContent = await workspace.fs.readFile(uri);
            var text = new TextDecoder('utf-8').decode(fileContent);

            this.anaylseDocumentUsage(uri, text, translationSets);
        }

        let foundKeys = Object.keys(this.found).sort();
        let allIdentifiers = translationSets.default.keys.sort();

        this.filterMissing(allIdentifiers);

        console.debug(`\nFOUND: ${foundKeys.length} translations`);
        foundKeys.forEach((key) => {
            console.debug(`FOUND: ${key}`);
        });

        console.debug(`\nMISSING: ${this.missing.length} translations`);
        this.missing.forEach((identifier) => {
            console.debug(`MISSING: ${identifier}`);
        });

        return Promise.resolve(this);
    }

    private anaylseDocumentUsage(uri: Uri, text: string, translationSets: TranslationSets) {
        let match;
        while ((match = this.regex.exec(text))) {
            if (match) {
                this.processSearchResults(match, uri, 0, translationSets);
            }
        }
    }

    private processSearchResults(matches: RegExpMatchArray, uri: Uri, line: Number, translationSets: TranslationSets) {
        matches.forEach((match) => {
            if (!match || match.startsWith("'") || match.startsWith('"') || match.startsWith('`')) {
                return;
            }
            const path = this.preparePath(match);

            Object.keys(translationSets.get).forEach((locale) => {
                let translation: string | null = translationSets.get[locale].getTranslation(path);
                let isPartialMatch = translationSets.get[locale].isPartialMatch(path);

                if (translation || isPartialMatch) {
                    // check if path was already found in another file
                    if (this.found.has(path)) {
                        this.found.get(path)?.locations.push({
                            uri: uri,
                            line: line,
                        });
                    } else {
                        // create new entry
                        const newEntry = Object.assign(new TranslationEntry(), {
                            locale: locale,
                            translationPath: path,
                            translation: !isPartialMatch ? translation : 'unknown',
                            match: !isPartialMatch ? TranslationMatch.Match : TranslationMatch.PartialMatch,
                            locations: [
                                {
                                    uri: uri,
                                    line: line,
                                },
                            ],
                        });
                        this.found.set(path, newEntry);
                    }
                }
            });
        });
    }

    private preparePath(path: string) {
        path = path.trim();
        path = path.replace(/['|"|`]/g, '');
        if (path.endsWith('.')) {
            path = path.slice(0, path.length - 1);
        }
        return path;
    }

    /**
     * Create a list of missing translations by filtering the found identifiers
     * with the partial matches
     */
    private filterMissing(keys: string[]) {
        keys.forEach((key) => {
            let identifier = key;

            while (identifier) {
                if (this.found.has(identifier)) {
                    // if the key is found, return
                    return;
                } else {
                    // else reduce the identifier and try again
                    const segments = identifier.split('.');
                    if (segments.length > 1) {
                        identifier = segments.slice(0, segments.length - 1).join('.');
                    } else {
                        // cannot reduce the path anymore, identifier is not found
                        break;
                    }
                }
            }

            this.missing.push(key);
        });
    }
}
