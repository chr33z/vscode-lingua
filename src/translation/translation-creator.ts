import { TranslationSets } from './translation-sets';
import { TextDocument, Selection, window, Range, Position, workspace, WorkspaceEdit } from 'vscode';
import { locateTranslation } from './translation-locator';

var textEncoding = require('text-encoding');
var TextEncoder = textEncoding.TextEncoder;

export async function createTranslation(
    translationSets: TranslationSets,
    document: TextDocument,
    selection: Selection
): Promise<void> {
    let range = selectTranslationPath(document, selection);

    let path = document.getText(range);
    path = cleanTranslationPath(path);

    if (!path.match(/^[a-zA-Z\.\_]+$/)) {
        window.showWarningMessage(`Lingua: '${path}' is not valid translation path`);
        return;
    }

    // promt user for locale
    const locale = await window.showQuickPick(Object.keys(translationSets.get));

    if (locale) {
        if (translationSets.get[locale].hasTranslation(path)) {
            window.showInformationMessage('Lingua: There is already a translation with this path.');
            locateTranslation(translationSets.get[locale], document, selection);
        } else {
            const translation = await window.showInputBox({ placeHolder: 'Enter translation...' });

            if (translation) {
                await workspace.openTextDocument(translationSets.get[locale].uri).then(async doc => {
                    // convert translation file to json
                    const json = JSON.parse(doc.getText());

                    // add translation to json
                    if (addTranslation(json, path, translation)) {
                        // write altered translation json back to file

                        const edit = new WorkspaceEdit();
                        edit.replace(
                            translationSets.get[locale].uri,
                            new Range(0, 0, Number.MAX_VALUE, 0),
                            JSON.stringify(json, null, 2)
                        );
                        await workspace.applyEdit(edit);

                        window.showInformationMessage(`Lingua: Created translation at ${path}`);

                        return Promise.resolve();
                    } else {
                        window.showWarningMessage(
                            `Lingua: The path ${path} already exists! Cannot create translation.`,
                            { modal: true }
                        );
                        locateTranslation(translationSets.get[locale], document, selection);
                    }
                });
            }
        }
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
    while (start > 0 && currentChar.match(/^[a-zA-Z\.\_]+$/)) {
        currentChar = line[--start];
    }
    start++;

    // search end
    let end = selection.start.character;
    currentChar = line[end];
    while (end < line.length - 1 && currentChar.match(/^[a-zA-Z\.\_]+$/)) {
        currentChar = line[++end];
    }

    return new Range(new Position(selection.start.line, start), new Position(selection.start.line, end));
}

function cleanTranslationPath(path: string): string {
    if (!path) {
        return '';
    }

    return path.trim().replace(/['|"]/g, '');
}

function addTranslation(json: any, path: string, translation: string): boolean {
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

    if (node[segment] && Object.keys(node[segment]).length > 0) {
        // This path already exists and contains translations
        return false;
    } else {
        node[segment] = translation;
        return true;
    }
}
