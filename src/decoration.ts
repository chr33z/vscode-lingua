import { TextEditor, DecorationOptions, Range, window, Position, Uri, TextEditorDecorationType } from 'vscode';
import { TranslationSet } from './translation/translation-set';
import { posix } from 'path';
import { Configuration } from './configuration-settings';

let translationDecoration: TextEditorDecorationType;
let potentialIdentifierDecoration: TextEditorDecorationType;

/**
 * Scan editor content for possible translations paths and decorate the translation paths
 * with a hover overlay containing the translation
 */
export function updateTranslationDecorations(editor: TextEditor, translationSet: TranslationSet) {
    if (!canDecorateFile(editor.document.uri)) {
        return;
    }

    if (!editor || translationSet.isEmpty) {
        return;
    }

    if (!translationDecoration || !potentialIdentifierDecoration) {
        translationDecoration = createTranslationDecoration();
        potentialIdentifierDecoration = createPotentialIdentifierDecoration();
    }

    // Clear previous decorations
    editor.setDecorations(translationDecoration, []);
    editor.setDecorations(potentialIdentifierDecoration, []);

    const regEx = /['|"|`]([a-zA-Z0-9\.\_\-]+)['|"|`]/gm;
    const text = editor.document.getText();
    const translationDecorations: DecorationOptions[] = [];
    const identifierDecorations: DecorationOptions[] = [];

    const maxTranslationLength = Configuration.maxTranslationLength();
    const showInLineTranslation = Configuration.showInlineTranslation();

    let match;
    while ((match = regEx.exec(text))) {
        let path = match[0].replace(/['|"|`]/g, '').trim();
        path = path
            .split('.')
            .filter((seg) => seg.length > 0)
            .join('.');

        const translation = translationSet.getTranslation(path);
        const isPartialTranslation = translationSet.isPartialMatch(path);
        const startPos = editor.document.positionAt(match.index);
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
            identifierDecorations.push(decoration);
        }
    }

    editor.setDecorations(translationDecoration, translationDecorations);
    editor.setDecorations(potentialIdentifierDecoration, identifierDecorations);
}

function createTranslationDecoration() {
    const theme = window.activeColorTheme.kind;
    return window.createTextEditorDecorationType({
        light: {
            textDecoration: `underline ${Configuration.getInlineColor(theme)}`,
        },
        dark: {
            textDecoration: `underline ${Configuration.getInlineColor(theme)}`,
        },
    });
}

function createPotentialIdentifierDecoration() {
    const theme = window.activeColorTheme.kind;
    return window.createTextEditorDecorationType({
        light: {
            textDecoration: `underline ${Configuration.getPotentialIdentifierColor(theme)} wavy`,
        },
        dark: {
            textDecoration: `underline ${Configuration.getPotentialIdentifierColor(theme)} wavy`,
        },
    });
}

function getDecoration(showInline: boolean, from: Position, to: Position, translation: string) {
    const theme = window.activeColorTheme.kind;
    if (showInline) {
        return {
            range: new Range(from, to),
            hoverMessage: translation,
            renderOptions: {
                after: {
                    contentText: ' • ' + translation,
                    color: `${Configuration.getInlineColor(theme)}`,
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
