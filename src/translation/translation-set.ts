import { isArray } from 'util';
import { Uri } from 'vscode';
import { TranslationKeyStyle } from './translation-key-style';

export class TranslationSet {
    // A dictionary with a translation path as the key and the translation as its value
    private _mainTranslationSet: { [path: string]: string } = {};

    // A set with partial translations paths to check against
    private _partialTranslationPaths: Set<string> = new Set();

    public uri: Uri = Uri.file('');

    public identifier: string = '';

    public getTranslation(path: string): string | null {
        return this._mainTranslationSet[path] || null;
    }

    public isPartialMatch(path: string): boolean {
        return this._partialTranslationPaths.has(path);
    }

    public translationKeyStyle: TranslationKeyStyle = TranslationKeyStyle.Undefined;

    public get isEmpty(): boolean {
        return this.keys.length < 1;
    }

    public get keys(): string[] {
        return Object.keys(this._mainTranslationSet);
    }

    public async build(identifier: string, uri: Uri, translationJson: object) {
        this.identifier = identifier;
        this.uri = uri;

        let translationEntries = 0;

        Object.entries(translationJson).forEach((entries) => {
            this.determineTranslationKeyStyle(entries);

            const paths = this.buildMainTranslationSet(entries);
            paths.forEach((item) => {
                this._mainTranslationSet[item.path] = item.translation;
                translationEntries++;
            });
        });
        this.buildpartialTranslationSet();
    }

    private buildMainTranslationSet(node: object): { path: string; translation: string }[] {
        if (isArray(node)) {
            const name = node[0];

            if (typeof node[1] === 'string') {
                // leaf case
                return [{ path: name, translation: node[1] }];
            } else {
                // branch case
                const paths: { path: string; translation: string }[] = [];
                const entries = Object.entries(node[1]);

                // branch object has entries
                if (entries.length > 0) {
                    entries.forEach((entry) => {
                        const result = this.buildMainTranslationSet(entry);
                        result.forEach((item) => {
                            if (item) {
                                paths.push(item);
                            }
                        });
                    });
                }
                // branch object is empty
                else {
                    return [{ path: `${name}`, translation: '' }];
                }

                if (paths.length > 0) {
                    return paths.map((p) => {
                        return {
                            path: `${name}.${p.path}`,
                            translation: p.translation,
                        };
                    });
                } else {
                    throw new Error('Should really not occure...');
                }
            }
        } else {
            return [];
        }
    }

    private buildpartialTranslationSet() {
        const mainPaths = Object.keys(this._mainTranslationSet);

        /*
            Iterate all paths and - if longer than one segment - reduce them
            up until one segment is left. Every reduced path can be itself a 
            partial path that is used for translation.
        */
        mainPaths.forEach((path) => {
            let partialPath = path;
            let pathLength = partialPath.split('.').length;

            while (pathLength > 1) {
                partialPath = partialPath
                    .split('.')
                    .splice(0, pathLength - 1)
                    .reduce((i, j) => i + '.' + j);

                pathLength = partialPath.split('.').length;

                this._partialTranslationPaths.add(partialPath);
            }
        });
    }

    private determineTranslationKeyStyle(node: object): void {
        let detectedKeyStyle = this.translationKeyStyle;

        if (isArray(node)) {
            const key = node[0] as string;

            if (typeof node[1] === 'string') {
                if (key.includes('.')) {
                    // leaf case with dotted notation -> flt style
                    detectedKeyStyle = TranslationKeyStyle.Flat;
                }
            } else {
                // branch case and previously a flat style detected -> mixed style
                detectedKeyStyle = TranslationKeyStyle.Nested;
            }
        }

        const isKeyStyleUndefined = this.translationKeyStyle === TranslationKeyStyle.Undefined;
        if (isKeyStyleUndefined) {
            this.translationKeyStyle = detectedKeyStyle;
        } else if (this.translationKeyStyle !== detectedKeyStyle) {
            this.translationKeyStyle = TranslationKeyStyle.Mixed;
        }
    }
}
