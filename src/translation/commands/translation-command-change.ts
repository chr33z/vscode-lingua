import { TranslationSets } from '../translation-sets';
import { TextDocument, Selection, window } from 'vscode';
import { getTranslationKeyFromSelection } from '../translation-utils';
import { promtTranslationSet, updateTranslationFile } from './translation-command-helper';

export async function changeTranslation(
    translationSets: TranslationSets,
    document: TextDocument,
    selection: Selection,
    useFlatTranslationKeys: boolean
) {
    const { isKey, key } = getTranslationKeyFromSelection(document, selection);

    if (!isKey) {
        window.showWarningMessage(`Lingua: '${key}' is not valid translation identifier`);
        return;
    }

    let translationSet = await promtTranslationSet(translationSets);

    if (translationSet.isEmpty) {
        console.warn('[Lingua] No translation set defined');
        return;
    }

    const newTranslation = await window.showInputBox({ placeHolder: 'Enter new translation...' });

    if (newTranslation) {
        const overwriteTranslation = true;
        await updateTranslationFile(translationSet.uri, key, newTranslation, overwriteTranslation)
            .then((_) => {
                return Promise.resolve();
            })
            .catch((_) => {
                window.showWarningMessage(`Lingua: Error changing translation for ${key}`);
                return Promise.reject();
            });
    }
}
