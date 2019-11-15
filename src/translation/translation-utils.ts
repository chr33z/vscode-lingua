import { TranslationSets } from './translation-sets';
import { TextDocument, Selection, window, Range, Position, workspace, WorkspaceEdit } from 'vscode';
import { TranslationSet } from './translation-set';
import { posix } from 'path';

const jsonSourceMap = require('json-source-map');

var textEncoding = require('text-encoding');
var TextEncoder = textEncoding.TextEncoder;

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

    // promt user for locale
    const locale = await window.showQuickPick(Object.keys(translationSets.get));

    if (locale) {
        if (translationSets.get[locale].hasTranslation(identifier)) {
            window.showInformationMessage('Lingua: There is already a translation with this path.');
            locateTranslation(translationSets.get[locale], document, selection);
        } else {
            const translation = await window.showInputBox({ placeHolder: 'Enter translation...' });

            if (translation) {
                await workspace.openTextDocument(translationSets.get[locale].uri).then(async doc => {
                    const json = JSON.parse(doc.getText());

                    // add translation to json
                    if (addTranslation(json, identifier, translation)) {
                        // write altered translation json back to file

                        const edit = new WorkspaceEdit();
                        edit.replace(
                            translationSets.get[locale].uri,
                            new Range(0, 0, Number.MAX_VALUE, 0),
                            JSON.stringify(json, null, 2)
                        );
                        await workspace.applyEdit(edit);

                        window.showInformationMessage(`Lingua: Created translation at ${identifier}`);

                        return Promise.resolve();
                    } else {
                        window.showWarningMessage(
                            `Lingua: The path ${identifier} already exists! Cannot create translation.`,
                            { modal: true }
                        );
                        locateTranslation(translationSets.get[locale], document, selection);
                    }
                });
            }
        }
    }
}

export async function locateTranslation(translationSet: TranslationSet, document: TextDocument, selection: Selection) {
    // Extract identifier from selection
    const identifierResult = getIdentifierFromSelection(document, selection);
    const isIdentifier = identifierResult.isIdentifier;
    const identifier = identifierResult.value;

    if (!isIdentifier) {
        window.showWarningMessage(`Lingua: '${identifier}' is not valid translation path`);
        return;
    }

    if (!translationSet.hasTranslation(identifier) && !translationSet.isPartialMatch(identifier)) {
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
        window.showWarningMessage(`Lingua: '${identifier}' is not valid translation path`);
        return;
    }

    // Promt user for language if multiple are defined otherwise take default
    let translationSet = translationSets.default;
    if (Object.keys(translationSets.get).length > 1) {
        const language = await window.showQuickPick(Object.keys(translationSets.get));
        if (language) {
            translationSet = translationSets.get[language];
        }
    }

    if (!translationSet) {
        return;
    }

    // Promt user for new translation
    const newTranslation = await window.showInputBox({ placeHolder: 'Enter new translation...' });

    if (newTranslation) {
        await workspace.openTextDocument(translationSet.uri).then(async doc => {
            const json = JSON.parse(doc.getText());

            // overwrite translation in json
            if (addTranslation(json, identifier, newTranslation, true) && translationSet) {
                // write altered translation json back to file

                const edit = new WorkspaceEdit();
                edit.replace(translationSet.uri, new Range(0, 0, Number.MAX_VALUE, 0), JSON.stringify(json, null, 2));
                await workspace.applyEdit(edit);

                window.showInformationMessage(`Lingua: Changed translation for ${identifier}`);

                return Promise.resolve();
            }
        });
    }
}

function getIdentifierFromSelection(
    document: TextDocument,
    selection: Selection
): { value: string; isIdentifier: boolean } {
    let range = selectTranslationPath(document, selection);

    let identifier = document.getText(range);
    identifier = identifier.trim().replace(/['|"]/g, ''); // TODO: add backticks

    if (!identifier.match(/^[a-zA-Z\.\_\-]+$/)) {
        return { value: identifier, isIdentifier: false };
    } else {
        return { value: identifier, isIdentifier: true };
    }
}

function selectTranslationPath(document: TextDocument, selection: Selection) {
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
