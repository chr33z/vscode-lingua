import { isArray } from 'util';

export class TranslationSet {
    private _translationSet: { [path: string]: string } = {};

    public contains(path: string): string | null {
        const value = this._translationSet[path];
        if (this._translationSet[path]) {
            return this._translationSet[path];
        } else {
            return null;
        }
    }

    public get keys(): string[] {
        return Object.keys(this._translationSet);
    }

    public async build(languageDefinition: object) {
        console.log(`\nScanning for translation entries...`);
        console.log('---------------------');

        let translationEntries = 0;

        Object.entries(languageDefinition).forEach(entries => {
            const paths = this.buildObjectTree(entries);

            paths.forEach(item => {
                this._translationSet[item.path] = item.translation;
                translationEntries++;
            });
        });

        console.log(`Found ${translationEntries} translation entries...\n`);
    }

    private buildObjectTree(
        node: object
    ): { path: string; translation: string }[] {
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
}
