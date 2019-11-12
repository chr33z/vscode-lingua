import { TextEditor, DecorationOptions, Range, window, OverviewRulerLane, ThemeColor } from 'vscode';
import { TranslationSet } from './translation/translation-set';

const translationDecoration = window.createTextEditorDecorationType({
    borderRadius: '3px',
    borderWidth: '1px',
    borderStyle: 'dotted',
    overviewRulerLane: OverviewRulerLane.Right,
    light: {
        borderColor: '#001f3fFF',
    },
    dark: {
        borderColor: '#0074D9FF',
    },
});

/**
 * Scan editor content for possible translations paths and decorate the translation paths
 * with a hover overlay containing the translation
 */
export function updateTranslationDecorations(editor: TextEditor, translationSet: TranslationSet | null) {
    if (!editor || !translationSet) {
        return;
    }
    const regEx = /'[a-zA-Z\.\_]+'/gm;
    const text = editor.document.getText();
    const translationDecorations: DecorationOptions[] = [];

    let match;
    while ((match = regEx.exec(text))) {
        const path = match[0].replace(/['|"']/g, '');
        const translation = translationSet.hasTranslation(path);

        if (translation) {
            const startPos = editor.document.positionAt(match.index);
            const endPos = editor.document.positionAt(match.index + match[0].length);
            const decoration = {
                range: new Range(startPos, endPos),
                hoverMessage: translation,
            };
            translationDecorations.push(decoration);
        }
    }

    editor.setDecorations(translationDecoration, translationDecorations);
}
