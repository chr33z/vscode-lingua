import { workspace, Range, Position, window, TextDocument, Selection } from 'vscode';
import { TranslationSet } from './translation-set';
import { posix } from 'path';
const jsonSourceMap = require('json-source-map');

export async function locateTranslation(translationSet: TranslationSet, document: TextDocument, selection: Selection) {
    let range = selectTranslationPath(document, selection);

    let path = document.getText(range);
    path = cleanTranslationPath(path);

    if (!path.match(/^[a-zA-Z\.\_]+$/)) {
        window.showWarningMessage(`Lingua: '${path.substring(0, 30).padEnd(33, '.')}' is not valid translation path`);
        return;
    }

    if (!translationSet.hasTranslation(path) && !translationSet.isPartialMatch(path)) {
        window.showWarningMessage(`Lingua: Could not find '${path}' in ${posix.basename(translationSet.uri.path)}`);
        return;
    }

    const doc = await workspace.openTextDocument(translationSet.uri);

    const sourceMap = jsonSourceMap.parse(doc.getText());
    const sourceMapPath = `/${path.replace(/\./g, '/')}`;
    const sourcePointer = sourceMap.pointers[sourceMapPath];
    const valueStart = sourcePointer.value;
    const valueEnd = sourcePointer.valueEnd;
    const selectionRange = new Range(
        new Position(valueStart.line, valueStart.column),
        new Position(valueEnd.line, valueEnd.column)
    );

    window.showTextDocument(doc, { selection: selectionRange });
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
