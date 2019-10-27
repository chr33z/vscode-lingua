import { isArray } from 'util';

export class TranslationSet {
    private _mainTranslationSet: { [path: string]: string } = {};
    private _secondaryTranslationSet: Set<string> = new Set();

    public hasTranslation(path: string): string | null {
        if (this._mainTranslationSet[path]) {
            return this._mainTranslationSet[path];
        } else {
            return null;
        }
    }

    public isPartialMatch(path: string): boolean {
        return this._secondaryTranslationSet.has(path);
    }

    public get keys(): string[] {
        return Object.keys(this._mainTranslationSet);
    }

    public async build(languageDefinition: object) {
        console.log(`\nScanning for translation entries...`);
        console.log('---------------------');

        console.log('Building main translation set...');
        let translationEntries = 0;

        Object.entries(languageDefinition).forEach(entries => {
            const paths = this.buildObjectTree(entries);

            paths.forEach(item => {
                this._mainTranslationSet[item.path] = item.translation;
                translationEntries++;
            });
        });
        console.log('Building main translation set... done');

        console.log('Building secondary translation set...');
        this.buildSecondaryTranslationSet();
        console.log('Building secondary translation set... done');

        console.log('---------------------');
        console.log(`Found ${translationEntries} translation entries...`);
        console.log(`Found ${this._secondaryTranslationSet.size} partial translation paths...\n`);
    }

    private buildObjectTree(node: object): { path: string; translation: string }[] {
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
                    entries.forEach(entry => {
                        const result = this.buildObjectTree(entry);
                        result.forEach(item => {
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
                    return paths.map(p => {
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

    private buildSecondaryTranslationSet() {
        const mainPaths = Object.keys(this._mainTranslationSet);

        /*
            Iterate all paths and - if longer than one segment - reduce them
            up until one segment is left. Every reduced path can be itself a 
            partial path that is used for translation.
        */
        mainPaths.forEach(path => {
            let partialPath = path;
            let pathLength = partialPath.split('.').length;

            while (pathLength > 1) {
                partialPath = partialPath
                    .split('.')
                    .splice(0, pathLength - 1)
                    .reduce((i, j) => i + '.' + j);

                pathLength = partialPath.split('.').length;

                this._secondaryTranslationSet.add(partialPath);
            }
        });
    }
}
