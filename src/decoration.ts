import { TextEditor, DecorationOptions, Range, window, OverviewRulerLane, ThemeColor } from 'vscode';
import { TranslationSet } from './translation/translation-set';
import { LinguaSettings } from './lingua-settings';

const translationDecoration = window.createTextEditorDecorationType({
    borderRadius: '3px',
    borderWidth: '1px',
    borderStyle: 'dotted',
    light: {
        borderColor: '#001f3fFF',
    },
    dark: {
        borderColor: '#0074D9FF',
    },
});

const potentialIdentifierDecoration = window.createTextEditorDecorationType({
    light: {
        textDecoration: 'underline #FF851B',
    },
    dark: {
        textDecoration: 'underline #FFDC00',
    },
});

/**
 * Scan editor content for possible translations paths and decorate the translation paths
 * with a hover overlay containing the translation
 */
export function updateTranslationDecorations(
    editor: TextEditor,
    settings: LinguaSettings,
    translationSet: TranslationSet | null
) {
    if (!editor || !translationSet) {
        return;
    }
    const regEx = /['|"|`]([a-zA-Z0-9\.\_\-]+)\.?.*['|"|`]/gm;
    const text = editor.document.getText();
    const translationDecorations: DecorationOptions[] = [];
    const identifierDecorations: DecorationOptions[] = [];

    let match;
    while ((match = regEx.exec(text))) {
        let path = match[0].replace(/['|"|`]/g, '').trim();
        path = path.split('.').join('.');

        const translation = translationSet.hasTranslation(path);
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);

        if (translation) {
            const decoration = {
                range: new Range(startPos, endPos),
                hoverMessage: translation,
            };
            translationDecorations.push(decoration);
        } else if (settings.showPotentialIdentifieres) {
            const decoration = {
                range: new Range(startPos, endPos),
            };
            identifierDecorations.push(decoration);
        }
    }

    editor.setDecorations(translationDecoration, translationDecorations);
    editor.setDecorations(potentialIdentifierDecoration, identifierDecorations);
}
