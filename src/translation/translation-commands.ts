import { TranslationSets } from './translation-sets';
import { TextDocument, Selection, window, Range, Position, workspace, WorkspaceEdit, TextEditor, Uri } from 'vscode';
import { TranslationSet } from './translation-set';
import { posix } from 'path';
import { truncateText, isTranslationIdentifier, getIdentifierFromSelection } from './translation-utils';

const jsonSourceMap = require('json-source-map');

export async function createTranslation(
    translationSets: TranslationSets,
    document: TextDocument,
    selection: Selection,
    useFlatTranslationKeys: boolean
): Promise<void> {
    const identifierResult = getIdentifierFromSelection(document, selection);
    const isIdentifier = identifierResult.isIdentifier;
    const identifier = identifierResult.value;

    if (!isIdentifier) {
        window.showWarningMessage(`Lingua: '${identifier}' is not valid translation path`);
        return;
    }

    let translationSet = await promtTranslationSet(translationSets);

    if (translationSet.isEmpty()) {
        console.warn('[Lingua] No translation set defined');
        return;
    }

    if (translationSet.getTranslation(identifier)) {
        window.showInformationMessage('Lingua: There is already a translation with this path.');
    } else {
        const translation = await window.showInputBox({ placeHolder: 'Enter translation...' });

        if (translation) {
            const overwriteTranslation = true;
            await updateTranslationFile(
                translationSet.uri,
                identifier,
                translation,
                useFlatTranslationKeys,
                overwriteTranslation
            )
                .then((_) => {
                    return Promise.resolve();
                })
                .catch((_) => {
                    window.showWarningMessage(
                        `Lingua: The path ${identifier} already exists! Cannot create translation.`,
                        { modal: true }
                    );
                    return Promise.reject();
                });
        }
    }
}

export async function locateTranslation(translationSet: TranslationSet, document: TextDocument, selection: Selection) {
    const identifierResult = getIdentifierFromSelection(document, selection);
    const isIdentifier = identifierResult.isIdentifier;
    const identifier = identifierResult.value;

    if (translationSet.isEmpty()) {
        console.warn('[Lingua] No translation set defined');
        return;
    }

    if (!isIdentifier) {
        window.showWarningMessage(`Lingua: '${identifier}' is not valid translation path`);
        return;
    }

    if (!translationSet.getTranslation(identifier) && !translationSet.isPartialMatch(identifier)) {
        window.showWarningMessage(
            `Lingua: Could not find '${identifier}' in ${posix.basename(translationSet.uri.path)}`
        );
        return;
    }

    const doc = await workspace.openTextDocument(translationSet.uri);

    const sourceMap = jsonSourceMap.parse(doc.getText());
    const sourceMapPath = `/${identifier.replace(/\./g, '/')}`;
    const sourcePointer = sourceMap.pointers[sourceMapPath];
    const valueStart = sourcePointer.value;
    const valueEnd = sourcePointer.valueEnd;
    const selectionRange = new Range(
        new Position(valueStart.line, valueStart.column),
        new Position(valueEnd.line, valueEnd.column)
    );

    window.showTextDocument(doc, { selection: selectionRange });
}

export async function changeTranslation(
    translationSets: TranslationSets,
    document: TextDocument,
    selection: Selection,
    useFlatTranslationKeys: boolean
) {
    const identifierResult = getIdentifierFromSelection(document, selection);
    const isIdentifier = identifierResult.isIdentifier;
    const identifier = identifierResult.value;

    if (!isIdentifier) {
        window.showWarningMessage(`Lingua: '${identifier}' is not valid translation identifier`);
        return;
    }

    let translationSet = await promtTranslationSet(translationSets);

    if (translationSet.isEmpty()) {
        console.warn('[Lingua] No translation set defined');
        return;
    }

    const newTranslation = await window.showInputBox({ placeHolder: 'Enter new translation...' });

    if (newTranslation) {
        const overwriteTranslation = true;
        await updateTranslationFile(
            translationSet.uri,
            identifier,
            newTranslation,
            useFlatTranslationKeys,
            overwriteTranslation
        )
            .then((_) => {
                return Promise.resolve();
            })
            .catch((_) => {
                window.showWarningMessage(`Lingua: Error changing translation for ${identifier}`);
                return Promise.reject();
            });
    }
}

export async function convertToTranslation(
    translationSets: TranslationSets,
    editor: TextEditor,
    useFlatTranslationKeys: boolean
) {
    const text = editor.document.getText(editor.selection);

    let translationSet = await promtTranslationSet(translationSets);

    if (translationSet.isEmpty()) {
        console.warn('[Lingua] No translation set defined');
        return;
    }

    if (translationSet.getTranslation(text) || translationSet.isPartialMatch(text)) {
        window.showWarningMessage(
            `Lingua: "${truncateText(text, 20)}" already is a translation identifier. Cannot create translation.`
        );
        return;
    }

    const translationIdentifer = await window.showInputBox({ placeHolder: 'Enter a translation identifier...' });

    if (translationIdentifer) {
        if (isTranslationIdentifier(translationIdentifer)) {
            // add new translation to translation file
            const overwriteTranslation = false;
            await updateTranslationFile(
                translationSet.uri,
                translationIdentifer,
                text,
                useFlatTranslationKeys,
                overwriteTranslation
            )
                .then(async (_) => {
                    // replace source selection with translation construct
                    const edit = new WorkspaceEdit();
                    edit.replace(editor.document.uri, editor.selection, `{{ '${translationIdentifer}' | translate }}`);
                    await workspace.applyEdit(edit);

                    return Promise.resolve();
                })
                .catch((_) => {
                    window.showWarningMessage(`Lingua: Error adding translation for ${truncateText(text, 20)}`);
                });
        } else {
            window.showWarningMessage(
                `Lingua: "${truncateText(
                    translationIdentifer,
                    20
                )}" is not formatted as a translation identifier. Cannot create translation.`
            );
        }
    }
}

async function promtTranslationSet(translationSets: TranslationSets): Promise<TranslationSet> {
    let translationSet = translationSets.default;
    if (Object.keys(translationSets.get).length > 1) {
        const language = await window.showQuickPick(Object.keys(translationSets.get));
        if (language) {
            translationSet = translationSets.get[language];
        }
    }
    return Promise.resolve(translationSet);
}

export async function updateTranslationFile(
    uri: Uri,
    identifier: string,
    translation: string,
    useFlatTranslationKeys: boolean,
    overwrite: boolean
) {
    const doc = await workspace.openTextDocument(uri);
    const json = JSON.parse(doc.getText());

    if (addTranslation(json, identifier, translation, useFlatTranslationKeys, overwrite)) {
        const edit = new WorkspaceEdit();
        edit.replace(uri, new Range(0, 0, Number.MAX_VALUE, 0), JSON.stringify(json, null, 2));
        await workspace.applyEdit(edit);

        window.showInformationMessage(`Lingua: Added translation for ${truncateText(translation, 20)}`);
        return Promise.resolve();
    } else {
        return Promise.reject();
    }
}

function addTranslation(
    json: any,
    path: string,
    translation: string,
    useFlatTranslationKeys: boolean,
    overwrite: boolean = false
): boolean {
    const segments = useFlatTranslationKeys ? [path] : path.split('.');

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
        // This path already exists and contains translations
        return false;
    } else {
        node[segment] = translation;
        return true;
    }
}
