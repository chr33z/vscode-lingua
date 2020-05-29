import { workspace, Uri, commands } from 'vscode';

export function findFilesWithExtension(includeExt: string[]): Thenable<Uri[]> {
    const searchPattern = `**/src/**/*.{${includeExt.reduce((i, j) => i.trim() + ',' + j.trim())}}`;
    const excludePattern = `**/node_modules/**`;
    return workspace.findFiles(searchPattern, excludePattern);
}

/**
 * Check if the current project is a angular project with ngx-translate module
 */
export async function isNgxTranslateProject(): Promise<boolean> {
    const isAngular = await workspace.findFiles('**/**/angular.json', `**/node_modules/**`, 1);
    const hasNgxTranslateModule = await workspace.findFiles('**/node_modules/**/*ngx-translate*', null, 1);
    return isAngular.length > 0 && hasNgxTranslateModule.length > 0;
}

export function setExtensionEnabled(enabled: boolean) {
    // https://github.com/Microsoft/vscode/issues/10401#issuecomment-280090759
    commands.executeCommand('setContext', 'lingua:enabled', enabled);
}
