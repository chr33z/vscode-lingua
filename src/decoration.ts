import { TextEditor, DecorationOptions, Range, window, Position, Uri, workspace } from 'vscode';
import { TranslationSet } from './translation/translation-set';
import { LinguaSettings } from './lingua-settings';
import { posix } from 'path';

const translationDecoration = window.createTextEditorDecorationType({
    light: {
        textDecoration: 'underline #146462',
    },
    dark: {
        textDecoration: 'underline #1a8582',
    },
});

const potentialIdentifierDecoration = window.createTextEditorDecorationType({
    light: {
        textDecoration: 'underline #b7950b wavy',
    },
    dark: {
        textDecoration: 'underline #b7950b wavy',
    },
});

/**
 * Scan editor content for possible translations paths and decorate the translation paths
 * with a hover overlay containing the translation
 */
export function updateTranslationDecorations(editor: TextEditor, translationSet: TranslationSet) {
    if (!canDecorateFile(editor.document.uri)) {
        return;
    }

    if (!editor || translationSet.isEmpty()) {
        return;
    }

    const regEx = /['|"|`]([a-zA-Z0-9\.\_\-]+)['|"|`]/gm;
    const text = editor.document.getText();
    const translationDecorations: DecorationOptions[] = [];
    const identifierDecorations: DecorationOptions[] = [];

    const maxTranslationLength =
        workspace.getConfiguration('lingua').get<number>('decoration.maxTranslationLength') || 80;
    const showInLineTranslation =
        workspace.getConfiguration('lingua').get<boolean>('decoration.showInlineTranslation') || true;

    let match;
    while ((match = regEx.exec(text))) {
        let path = match[0].replace(/['|"|`]/g, '').trim();
        path = path
            .split('.')
            .filter((seg) => seg.length > 0)
            .join('.');

        const translation = translationSet.getTranslation(path);
        const isPartialTranslation = translationSet.isPartialMatch(path);
        const startPos = editor.document.positionAt(match.index + 1);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        const n = maxTranslationLength;

        if (translation) {
            // Translation availble
            const shortTranslation = translation.length > n ? translation.substr(0, n - 1) + '...' : translation;
            const decoration = getDecoration(showInLineTranslation, startPos, endPos, shortTranslation);
            translationDecorations.push(decoration);
        } else if (isPartialTranslation) {
            // Partial translation
            const shortPath = path.length > n ? path.substr(0, n - 1) + '...' : path;
            const decoration = getDecoration(false, startPos, endPos, 'Translations available: ' + shortPath + ' ...');
            translationDecorations.push(decoration);
        }
    }

    editor.setDecorations(translationDecoration, translationDecorations);
    editor.setDecorations(potentialIdentifierDecoration, identifierDecorations);
}

function getDecoration(showInline: boolean, from: Position, to: Position, translation: string) {
    if (showInline) {
        return {
            range: new Range(from, to),
            hoverMessage: translation,
            renderOptions: {
                after: {
                    contentText: ' • ' + translation,
                    color: { id: 'lingua.lookupColor' },
                },
            },
        };
    } else {
        return {
            range: new Range(from, to),
            hoverMessage: translation,
        };
    }
}

function canDecorateFile(uri: Uri) {
    const ext = posix.extname(uri.path);
    return ext === '.ts' || ext === '.html';
}
