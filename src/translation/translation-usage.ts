import { Uri, workspace } from 'vscode';
import { TranslationEntry } from './translation-entry';
import { posix } from 'path';
import { TextDecoder } from 'util';
import { TranslationMatch } from './translation-match';
import { TranslationSets } from './translation-sets';

export class TranslationUsage {
    private regex = new RegExp(/\'[a-zA-Z\.]+\'/g);

    public found: { [path: string]: TranslationEntry } = {};
    public missing: { [path: string]: TranslationEntry } = {};
    public totalFiles: Number = 0;
    public totalTranslations: { [locale: string]: Number } = {};

    public async analyse(fileTypes: string[], translationSets: TranslationSets) {
        console.log('\nAnalysing translation usage...');
        console.log('---------------------');

        const uris = await this.findFiles(fileTypes);

        console.log(`Found ${uris.length} files to scan for translations...\n`);

        this.totalFiles = uris.length;

        Object.keys(translationSets.get).forEach(locale => {
            this.totalTranslations[locale] = translationSets.get[locale].keys.length;
        });

        /*
            Iterate over files and try to regex all candidates. Then match each
            candiate with all translationSets (dictionaries so quite a fast lookup )

            But: does only find complete strings and not partial ones
        */
        let index = 1;
        for (const uri of uris) {
            console.log(`Analysing file (${index}/${uris.length}): ${posix.basename(uri.path)}`);

            const fileContent = await workspace.fs.readFile(uri);
            var text = new TextDecoder('utf-8').decode(fileContent);

            this.anaylseDocumentUsage(uri, text, translationSets);
            index++;
        }

        let translationKeys = translationSets.get['de'].keys;
        let entryKeys = Object.keys(this.found);

        translationKeys = translationKeys.filter(function(el) {
            return entryKeys.indexOf(el) < 0;
        });

        console.log(`\nFOUND: ${entryKeys.length} translations`);
        entryKeys.forEach(key => {
            console.log(`FOUND: ${key}`);
        });

        console.log(`\nMISSING: ${translationKeys.length} translations`);
        translationKeys.forEach(key => {
            console.log(`MISSING: ${key}`);
        });

        return Promise.resolve(this);
    }

    public anaylseDocumentUsage(uri: Uri, text: string, translationSets: TranslationSets) {
        const lines = text.split('\n');

        let lineNumber = 1;
        for (const line of lines) {
            const matches = this.regex.exec(line);

            if (matches) {
                this.processSearchResults(matches, uri, lineNumber, translationSets);
            }
            lineNumber++;
        }
    }

    private processSearchResults(matches: RegExpMatchArray, uri: Uri, line: Number, translationSets: TranslationSets) {
        matches.forEach(match => {
            const path = this.preparePath(match);

            Object.keys(translationSets.get).forEach(locale => {
                let translation: string | null = translationSets.get[locale].hasTranslation(path);
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
        path = path.replace(/'/g, '');
        if (path.endsWith('.')) {
            path = path.slice(0, path.length - 1);
        }
        return path;
    }

    private findFiles(includeExt: string[]) {
        const searchPattern = `**/src/**/*.{${includeExt.reduce((i, j) => i + ',' + j)}}`;
        const excludePattern = `**/node_modules/**`;
        return workspace.findFiles(searchPattern, excludePattern);
    }
}
