import { workspace, Range, Position, window } from 'vscode';
import { TranslationSet } from './translation-set';
import { posix } from 'path';
const jsonSourceMap = require('json-source-map');

export async function locateTranslation(translationSet: TranslationSet, path: string) {
    path = cleanTranslationPath(path);

    if (!path.match(/^[a-zA-Z\.]+$/)) {
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

function cleanTranslationPath(path: string): string {
    if (!path) {
        return '';
    }

    return path.trim().replace(/['|"]/g, '');
}
