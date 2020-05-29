import { window, TextDocument, Selection } from 'vscode';
import { promtTranslationSet, updateTranslationFile } from './translation-command-helper';
import { TranslationSets } from '../translation-sets';
import { getTranslationKeyFromSelection } from '../translation-utils';

export async function createTranslation(
    translationSets: TranslationSets,
    document: TextDocument,
    selection: Selection
): Promise<void> {
    const { isKey, key } = getTranslationKeyFromSelection(document, selection);

    if (!isKey) {
        window.showWarningMessage(`Lingua: '${key}' is not valid translation path`);
        return;
    }

    let translationSet = await promtTranslationSet(translationSets);

    if (translationSet.isEmpty) {
        console.warn('[Lingua] No translation set defined');
        return;
    }

    if (translationSet.getTranslation(key)) {
        window.showInformationMessage('Lingua: There is already a translation with this path.');
    } else {
        const translation = await window.showInputBox({ placeHolder: 'Enter translation...' });

        if (translation) {
            const overwriteTranslation = true;
            await updateTranslationFile(translationSet.uri, key, translation, overwriteTranslation)
                .then((_) => {
                    return Promise.resolve();
                })
                .catch((_) => {
                    window.showWarningMessage(`Lingua: The path ${key} already exists! Cannot create translation.`, {
                        modal: true,
                    });
                    return Promise.reject();
                });
        }
    }
}
