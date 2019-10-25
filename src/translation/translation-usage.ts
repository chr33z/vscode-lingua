import { TranslationSet } from './translation-set';
import { Uri, workspace, TextDocument, window, ProgressLocation } from 'vscode';
import { TranslationEntry } from './translation-entry';
import { posix } from 'path';
import { TextDecoder } from 'util';
import { Usage } from './usage';
import { TranslationMatch } from './translation-match';

export class TranslationUsage {
    private MAX_PATH_REDUCTION = 2;

    public found: { [path: string]: TranslationEntry } = {};
    public missing: { [path: string]: TranslationEntry } = {};

    public async analyseUsage(
        uris: Uri[],
        translationSets: { [locale: string]: TranslationSet }
    ) {
        console.log('\nAnalysing translation usage...');
        console.log('---------------------');
        console.log(`Found ${uris.length} files to scan for translations...\n`);

        /*
            Iterate over files and try to regex all candidates. Then match each
            candiate with all translationSets (dictionaries so quiet a fast lookup )

            But: does only find complete strings and not partial ones
        */
        window.withProgress(
            {
                location: ProgressLocation.Notification,
                title: 'Analysing translation usage...',
                cancellable: true,
            },
            async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log('Canceled translation usage...');
                });

                let processedFiles = 0;
                await Promise.all(
                    uris.map(async uri => {
                        await workspace.fs
                            .readFile(uri)
                            .then(async fileContent => {
                                // console.log(
                                //     `File: ${posix.basename(uri.path)}`
                                // );
                                var text = new TextDecoder('utf-8').decode(
                                    fileContent
                                );
                                this.anaylseDocumentUsage(
                                    uri,
                                    text,
                                    translationSets
                                );
                            });

                        progress.report({
                            increment: uris.length / processedFiles,
                        });
                    })
                );

                let translationKeys = translationSets['de'].keys;
                let entryKeys = Object.keys(this.found);

                translationKeys = translationKeys.filter(function(el) {
                    return entryKeys.indexOf(el) < 0;
                });

                console.log(`\nFOUND: ${entryKeys.length} translations`);
                entryKeys.forEach(key => {
                    console.log(`FOUND: ${key}`);
                });

                console.log(
                    `\nMISSING: ${translationKeys.length} translations`
                );
                translationKeys.forEach(key => {
                    console.log(`MISSING: ${key}`);
                });
            }
        );
    }

    public anaylseDocumentUsage(
        uri: Uri,
        text: string,
        translationSets: { [locale: string]: TranslationSet }
    ) {
        if (uri.path.endsWith('article-detail.page.html')) {
            console.log('WEW');
        }

        // Important: Use non-greedy search!
        // Otherwise regex engine crashes
        const searchPattern = /'(\w+[\.]*)+?'/gm;
        const lines = text.split('\n');

        let lineNumber = 1;
        for (const line of lines) {
            const result = line.match(searchPattern);

            if (result) {
                this.processSearchResults(
                    result,
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
            const path = this.stripPath(match);
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

        let rounds = this.MAX_PATH_REDUCTION;
        while (pathLength > 1 && rounds > 0) {
            console.log(`Checking path: ${partialPath}`);

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
            rounds--;

            // reduce path by the last segment and try again.
            // Last paths are completed by a variable so the last character
            // is a dot '.'
            if (pathLength > 2 && rounds > 0) {
                partialPath =
                    partialPath
                        .split('.')
                        .splice(0, pathLength - 1)
                        .reduce((i, j) => i + '.' + j) + '.';
                isPartialPath = true;
            }
        }
    }

    private stripPath(path: string) {
        path = path.trim();
        path = path.replace(/'/g, '');
        return path;
    }
}
