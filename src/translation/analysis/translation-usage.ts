import { Uri, workspace } from 'vscode';
import { TranslationEntry } from '../translation-entry';
import { TextDecoder } from 'util';
import { TranslationMatch } from '../translation-match';
import { TranslationSets } from '../translation-sets';
import { findFilesWithExtension as findProjectFiles } from '../../utils';

export class TranslationUsage {
    // private regex = new RegExp(/\'[a-zA-Z\.\_\-]+\'/g);
    private regex = new RegExp(/['|"|`]([a-zA-Z0-9\.\_\-]+)(\.\$.*)*['|"|`]/g);

    public found: { [path: string]: TranslationEntry } = {};
    public missing: string[] = [];
    public totalFiles: Number = 0;
    public totalTranslations: { [locale: string]: Number } = {};

    public async analyse(fileTypes: string[], translationSets: TranslationSets) {
        console.log('\nAnalysing translation usage...');
        console.log('---------------------');

        if (!translationSets.default) {
            return Promise.reject();
        }

        const uris = await findProjectFiles(fileTypes);

        console.log(`Found ${uris.length} files to scan for translations...\n`);

        this.totalFiles = uris.length;

        Object.keys(translationSets.get).forEach((locale) => {
            this.totalTranslations[locale] = translationSets.get[locale].keys.length;
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

        console.log(`\nFOUND: ${foundKeys.length} translations`);
        foundKeys.forEach((key) => {
            console.log(`FOUND: ${key}`);
        });

        console.log(`\nMISSING: ${this.missing.length} translations`);
        this.missing.forEach((identifier) => {
            console.log(`MISSING: ${identifier}`);
        });

        return Promise.resolve(this);
    }

    public anaylseDocumentUsage(uri: Uri, text: string, translationSets: TranslationSets) {
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
            console.log(match);
            const path = this.preparePath(match);

            Object.keys(translationSets.get).forEach((locale) => {
                let translation: string | null = translationSets.get[locale].getTranslation(path);
                let isPartialMatch = translationSets.get[locale].isPartialMatch(path);

                // Constructor is a keyword, that cannot be used as a key in dictionaries
                // https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
                if (path === 'constructor') {
                    translation = null;
                }

                if (translation || isPartialMatch) {
                    // check if path was already found in another file
                    if (this.found[path]) {
                        // Only update found locations
                        this.found[path].locations.push({
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
                        this.found[path] = newEntry;
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
                if (this.found[identifier]) {
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
