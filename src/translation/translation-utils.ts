import { TranslationSets } from './translation-sets';
import { TextDocument, Selection, window, Range, Position, workspace, WorkspaceEdit, TextEditor, Uri } from 'vscode';
import { TranslationSet } from './translation-set';
import { posix } from 'path';

const jsonSourceMap = require('json-source-map');

export async function createTranslation(
    translationSets: TranslationSets,
    document: TextDocument,
    selection: Selection
): Promise<void> {
    // Extract identifier from selection
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
            await updateTranslationFile(translationSet.uri, identifier, translation, true)
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
    // Extract identifier from selection
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
    selection: Selection
) {
    // Extract identifier from selection
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

    // Promt user for new translation
    const newTranslation = await window.showInputBox({ placeHolder: 'Enter new translation...' });

    if (newTranslation) {
        await updateTranslationFile(translationSet.uri, identifier, newTranslation, true)
            .then((_) => {
                return Promise.resolve();
            })
            .catch((_) => {
                window.showWarningMessage(`Lingua: Error changing translation for ${identifier}`);
                return Promise.reject();
            });
    }
}

export async function convertToTranslation(translationSets: TranslationSets, editor: TextEditor) {
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
        if (isIdentifier(translationIdentifer)) {
            // add new translation to translation file
            await updateTranslationFile(translationSet.uri, translationIdentifer, text)
                .then(async (_) => {
                    // replace source selection with translation construct
                    const edit = new WorkspaceEdit();
                    edit.replace(editor.document.uri, editor.selection, `{{ '${translationIdentifer}' | translate }`);
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

//#region Utility functions

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

function getIdentifierFromSelection(
    document: TextDocument,
    selection: Selection
): { value: string; isIdentifier: boolean } {
    let range = selectTranslationPath(document, selection);

    let identifier = document.getText(range);
    identifier = identifier.trim().replace(/['|"|`]/g, '');

    if (!isIdentifier(identifier)) {
        return { value: identifier, isIdentifier: false };
    } else {
        return { value: identifier, isIdentifier: true };
    }
}

/**
 * Extract text that is enclosed by quotation marks
 * @param document
 * @param selection
 */
function getTextFromSelection(document: TextDocument, selection: Selection): string {
    // get the selected line
    const line = document.getText(
        new Range(new Position(selection.start.line, 0), new Position(selection.start.line + 1, 0))
    );

    // search start
    let start = selection.start.character;
    let currentChar = line[start];
    while (start > 0 && currentChar !== "'" && currentChar !== '"') {
        currentChar = line[--start];
    }
    start++;

    // search end
    let end = selection.start.character;
    currentChar = line[end];
    while (end < line.length - 1 && currentChar !== "'" && currentChar !== '"') {
        currentChar = line[++end];
    }

    const range = new Range(new Position(selection.start.line, start), new Position(selection.start.line, end));
    return document.getText(range);
}

function selectTranslationPath(document: TextDocument, selection: Selection): Range {
    // get the selected line
    const line = document.getText(
        new Range(new Position(selection.start.line, 0), new Position(selection.start.line + 1, 0))
    );

    // search start
    let start = selection.start.character;
    let currentChar = line[start];
    while (start > 0 && currentChar.match(/^[a-zA-Z0-9\.\_\-]+$/)) {
        currentChar = line[--start];
    }
    start++;

    // search end
    let end = selection.start.character;
    currentChar = line[end];
    while (end < line.length - 1 && currentChar.match(/^[a-zA-Z0-9\.\_\-]+$/)) {
        currentChar = line[++end];
    }

    return new Range(new Position(selection.start.line, start), new Position(selection.start.line, end));
}

function addTranslation(json: any, path: string, translation: string, overwrite: boolean = false): boolean {
    const segments = path.split('.');

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

async function updateTranslationFile(uri: Uri, identifier: string, translation: string, overwrite: boolean = false) {
    workspace.openTextDocument(uri).then(async (doc) => {
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
    });
}

function isIdentifier(text: string): boolean {
    return !!text.match(/^[a-zA-Z0-9\.\_\-]+$/);
}

function truncateText(text: string, length: number) {
    return text.length > length ? text.substr(0, length - 1) + '...' : text;
}

//#endregion
