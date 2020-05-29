import { TranslationSets } from '../translation-sets';
import { TranslationSet } from '../translation-set';
import { window, workspace, WorkspaceEdit, Range, Uri } from 'vscode';
import { truncateText } from '../translation-utils';
import { Configuration } from '../../configuration-settings';

export async function promtTranslationSet(translationSets: TranslationSets): Promise<TranslationSet> {
    let translationSet = translationSets.default;
    if (Object.keys(translationSets.get).length > 1) {
        const language = await window.showQuickPick(Object.keys(translationSets.get));
        if (language) {
            translationSet = translationSets.get[language];
        }
    }
    return Promise.resolve(translationSet);
}

export async function updateTranslationFile(uri: Uri, identifier: string, translation: string, overwrite: boolean) {
    const doc = await workspace.openTextDocument(uri);
    const json = JSON.parse(doc.getText());

    if (addTranslation(json, identifier, translation, overwrite)) {
        const edit = new WorkspaceEdit();
        edit.replace(uri, new Range(0, 0, Number.MAX_VALUE, 0), JSON.stringify(json, null, 2));
        await workspace.applyEdit(edit);

        window.showInformationMessage(`Lingua: Added translation for ${truncateText(translation, 20)}`);
        return Promise.resolve();
    } else {
        return Promise.reject();
    }
}

function addTranslation(json: any, path: string, translation: string, overwrite: boolean = false): boolean {
    const segments = Configuration.useFlatTranslationKeys() ? [path] : path.split('.');

    // check if there is a node with the current segment
    let index = 0;
    let segment = segments[index];
    let node = json;

    while (segment) {
        if (!(segment in node)) {
            node[segment] = {};
        }

        if (index < segments.length - 1) {
            node = node[segment];
            segment = segments[++index];
        } else {
            break;
        }
    }

    if (node[segment] && Object.keys(node[segment]).length > 0 && !overwrite) {
        return false;
    } else {
        node[segment] = translation;
        return true;
    }
}
