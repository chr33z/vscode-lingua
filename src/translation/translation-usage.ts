import { TranslationSet } from './translation-set';
import { Uri, workspace } from 'vscode';
import { TranslationEntry } from './translation-entry';
import { posix } from 'path';
import { TextDecoder } from 'util';
import { Usage } from './usage';
import { TranslationMatch } from './translation-match';

export class TranslationUsage {
    private MAX_PATH_REDUCTION = 2;

    private regex = new RegExp(/\'[a-zA-Z\.]+\'/);

    public found: { [path: string]: TranslationEntry } = {};
    public missing: { [path: string]: TranslationEntry } = {};

    public async analyseUsage(
        uris: Uri[],
        translationSets: { [locale: string]: TranslationSet }
    ) {
        console.log('\nAnalysing translation usage...');
        console.log('---------------------');
        console.log(`Found ${uris.length} files to scan for translations...\n`);

        // uris = uris.splice(0, 60);

        /*
            Iterate over files and try to regex all candidates. Then match each
            candiate with all translationSets (dictionaries so quiet a fast lookup )

            But: does only find complete strings and not partial ones
        */
        let index = 1;
        for (const uri of uris) {
            console.log(
                `Analysing file (${index}/${uris.length}): ${posix.basename(
                    uri.path
                )}`
            );

            const fileContent = await workspace.fs.readFile(uri);
            var text = new TextDecoder('utf-8').decode(fileContent);

            this.anaylseDocumentUsage(uri, text, translationSets);
            index++;
        }

        let translationKeys = translationSets['de'].keys;
        let entryKeys = Object.keys(this.found);

        translationKeys = translationKeys.filter(function(el) {
            return entryKeys.indexOf(el) < 0;
        });

        console.log(`\nFOUND: ${entryKeys.length} translations`);
        entryKeys.forEach(key => {
            console.log(`FOUND: ${key}`);
        });

        // console.log(`\nMISSING: ${translationKeys.length} translations`);
        // translationKeys.forEach(key => {
        //     console.log(`MISSING: ${key}`);
        // });
    }

    public anaylseDocumentUsage(
        uri: Uri,
        text: string,
        translationSets: { [locale: string]: TranslationSet }
    ) {
        // Important: Use non-greedy search!
        // Otherwise regex engine crashes
        // const searchPattern = /'(\w+[k c\.]*?)+?'/;
        const lines = text.split('\n');

        let lineNumber = 1;
        for (const line of lines) {
            const matches = this.regex.exec(line);

            if (matches) {
                this.processSearchResults(
                    matches,
                    uri,
                    lineNumber,
                    translationSets
                );
            }
            lineNumber++;
        }
    }

    private processSearchResults(
        matches: RegExpMatchArray,
        uri: Uri,
        line: Number,
        translationSets: { [locale: string]: TranslationSet }
    ) {
        matches.forEach(match => {
            const path = this.preparePath(match);

            if (path === 'fax.numberedStatus')
                Object.keys(translationSets).forEach(key => {
                    this.matchTranslationPath(
                        path,
                        uri,
                        line,
                        key,
                        translationSets
                    );
                });
        });
    }

    private matchTranslationPath(
        path: string,
        uri: Uri,
        line: Number,
        locale: string,
        translationSets: { [locale: string]: TranslationSet }
    ) {
        /*
            The idea is to match the regexed pathes with the paths from the translationsets.
            To do this we first try to match the whole path, but also want to match parts of it.
            
            Therefore, after each match round, we remove the last part of the path and try to match 
            again. The amount how often we reduce the path is determined by MAX_PATH_REDUCTION.
        */

        let partialPath = path;
        let pathLength = path.split('.').length;
        let isPartialPath = false;

        console.log(partialPath);

        let rounds = this.MAX_PATH_REDUCTION;
        while (pathLength > 1 && rounds > 0) {
            const translation = translationSets[locale].contains(partialPath);

            if (translation) {
                // check if path was already found in another file
                if (this.found[partialPath]) {
                    // Only update found locations
                    this.found[partialPath].locations.push({
                        uri: uri,
                        line: line,
                        match: !isPartialPath
                            ? TranslationMatch.Match
                            : TranslationMatch.PartialMatch,
                    });
                } else {
                    // create new entry
                    const newEntry = Object.assign(new TranslationEntry(), {
                        locale: locale,
                        translationPath: partialPath,
                        translation: translation,
                        usage: Usage.Used,
                        locations: [
                            {
                                uri: uri,
                                line: line,
                                match: !isPartialPath
                                    ? TranslationMatch.Match
                                    : TranslationMatch.PartialMatch,
                            },
                        ],
                    });
                    this.found[partialPath] = newEntry;
                }
            }

            pathLength = partialPath.split('.').length;

            // reduce path by the last segment and try again.
            // Last paths are completed by a variable so the last character
            // is a dot '.'
            if (pathLength > 1 && rounds > 0) {
                partialPath =
                    partialPath
                        .split('.')
                        .splice(0, pathLength - 1)
                        .reduce((i, j) => i + '.' + j) + '.';
                isPartialPath = true;
            } else {
                break;
            }

            rounds--;
        }
    }

    private preparePath(path: string) {
        path = path.trim();
        path = path.replace(/'/g, '');
        if (path.endsWith('.')) {
            path = path.slice(0, path.length - 1);
        }
        return path;
    }
}
