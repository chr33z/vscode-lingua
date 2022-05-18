import { TranslationSets } from '../translation-sets';
import { TextEditor, window, WorkspaceEdit, workspace } from 'vscode';
import { promtTranslationSet, updateTranslationFile } from './translation-command-helper';
import { truncateText, isTranslationIdentifier } from '../translation-utils';
import { Configuration } from '../../configuration-settings';

export async function convertToTranslation(translationSets: TranslationSets, editor: TextEditor) {
    const text = editor.document.getText(editor.selection);

    let translationSet = await promtTranslationSet(translationSets);

    if (translationSet.isEmpty) {
        console.warn('[Lingua] No translation set defined');
        return;
    }

    if (translationSet.getTranslation(text) || translationSet.isPartialMatch(text)) {
        window.showWarningMessage(
            `Lingua: "${truncateText(text, 20)}" already is a translation key. Cannot create translation.`
        );
        return;
    }

    const translationKey = await window.showInputBox({ placeHolder: 'Enter a translation key...' });

    if (translationKey) {
        if (isTranslationIdentifier(translationKey)) {
            // add new translation to translation file
            const overwriteTranslation = false;
            const jsonIndentation = Configuration.jsonIndentation();
            await updateTranslationFile(translationSet.uri, translationKey, text, overwriteTranslation, jsonIndentation)
                .then(async (_) => {
                    // replace source selection with translation construct
                    const edit = new WorkspaceEdit();
                    edit.replace(editor.document.uri, editor.selection, `{{ '${translationKey}' | translate }}`);
                    await workspace.applyEdit(edit);

                    return Promise.resolve();
                })
                .catch((_) => {
                    window.showWarningMessage(`Lingua: Error adding translation for ${truncateText(text, 20)}`);
                });
        } else {
            window.showWarningMessage(
                `Lingua: "${truncateText(
                    translationKey,
                    20
                )}" is not formatted as a translation identifier. Cannot create translation.`
            );
        }
    }
}
