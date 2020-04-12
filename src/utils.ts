import { workspace, Uri } from 'vscode';

export function findFilesWithExtension(includeExt: string[]): Thenable<Uri[]> {
    const searchPattern = `**/src/**/*.{${includeExt.reduce((i, j) => i + ',' + j)}}`;
    const excludePattern = `**/node_modules/**`;
    return workspace.findFiles(searchPattern, excludePattern);
}
