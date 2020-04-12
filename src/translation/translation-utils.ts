import { TextDocument, Selection, Range, Position } from 'vscode';

const validIdentiferCharacters = /^[a-zA-Z0-9\.\_\-]+$/;

export function getIdentifierFromSelection(
    document: TextDocument,
    selection: Selection
): { value: string; isIdentifier: boolean } {
    let range = selectTranslationPath(document, selection);

    let identifier = document.getText(range);
    identifier = identifier.trim().replace(/['|"|`]/g, '');

    if (!isTranslationIdentifier(identifier)) {
        return { value: identifier, isIdentifier: false };
    } else {
        return { value: identifier, isIdentifier: true };
    }
}

export function selectTranslationPath(document: TextDocument, selection: Selection): Range {
    const line = document.getText(
        new Range(new Position(selection.start.line, 0), new Position(selection.start.line + 1, 0))
    );

    let start = selection.start.character;
    let end = selection.start.character;

    // Move start position if both start and end are the end of the selection
    if (start === end && !line[start].match(validIdentiferCharacters)) {
        start--;
    }

    // search start
    let startChar = line[start];
    while (start > 0 && startChar.match(validIdentiferCharacters)) {
        startChar = line[--start];
    }
    start++;

    // search end
    let endChar = line[end];
    while (end < line.length - 1 && endChar.match(validIdentiferCharacters)) {
        endChar = line[++end];
    }

    return new Range(new Position(selection.start.line, start), new Position(selection.start.line, end));
}

export function isTranslationIdentifier(text: string): boolean {
    return !!text.match(validIdentiferCharacters);
}

export function truncateText(text: string, length: number) {
    return text.length > length ? text.substr(0, length - 1) + '...' : text;
}
