import { TranslationSet } from '../translation-set';
import { TextDocument, Selection, window, workspace, Range, Position } from 'vscode';
import { getTranslationKeyFromSelection } from '../translation-utils';
import { posix } from 'path';
import { useFlatTranslationKeys } from '../../configuration-settings';

const jsonSourceMap = require('json-source-map');

export async function locateTranslation(translationSet: TranslationSet, document: TextDocument, selection: Selection) {
    const { isKey, key } = getTranslationKeyFromSelection(document, selection);

    if (translationSet.isEmpty) {
        console.warn('[Lingua] No translation set defined');
        return;
    }

    if (!isKey) {
        window.showWarningMessage(`Lingua: '${key}' is not valid translation path`);
        return;
    }

    if (!translationSet.getTranslation(key) && !translationSet.isPartialMatch(key)) {
        window.showWarningMessage(`Lingua: Could not find '${key}' in ${posix.basename(translationSet.uri.path)}`);
        return;
    }

    const doc = await workspace.openTextDocument(translationSet.uri);

    const sourceMap = jsonSourceMap.parse(doc.getText());
    const sourceMapPath = useFlatTranslationKeys() ? `/${key}` : `/${key.replace(/\./g, '/')}`;
    const sourcePointer = sourceMap.pointers[sourceMapPath];
    const valueStart = sourcePointer.value;
    const valueEnd = sourcePointer.valueEnd;
    const selectionRange = new Range(
        new Position(valueStart.line, valueStart.column),
        new Position(valueEnd.line, valueEnd.column)
    );

    window.showTextDocument(doc, { selection: selectionRange });
}
