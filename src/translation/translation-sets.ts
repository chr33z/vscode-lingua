import { workspace, Uri, window } from 'vscode';
import { TranslationSet } from './translation-set';

export class TranslationSets {
    public translationSets: { [path: string]: TranslationSet } = {};

    public uris: { [locale: string]: Uri } = {};

    public get get(): { [locale: string]: TranslationSet } {
        return this.translationSets;
    }

    async build(localeFiles: { locale: string; uri: Uri }[]) {
        await Promise.all(
            localeFiles.map(async localeFile => {
                try {
                    const absoluteUri = Uri.file(`${workspace.rootPath}/${localeFile.uri}`);
                    await workspace.openTextDocument(absoluteUri).then(document => {
                        if (document) {
                            const json = document.getText();
                            const translationSet = new TranslationSet();
                            translationSet.build(absoluteUri, JSON.parse(json));
                            this.translationSets[localeFile.locale] = translationSet;
                        }
                    });
                } catch (e) {
                    console.error(e);
                }
            })
        );
    }
}
