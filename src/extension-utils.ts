import { workspace, Uri, commands } from 'vscode';

export function findFilesWithExtension(includeExt: string[]): Thenable<Uri[]> {
    const searchPattern = `**/src/**/*.{${includeExt.reduce((i, j) => i.trim() + ',' + j.trim())}}`;
    const excludePattern = `**/node_modules/**`;
    return workspace.findFiles(searchPattern, excludePattern);
}

/**
 * Check if the current workspace is a angular workspace or an NX workspace with an installed ngx-translate module
 */
export async function isNgxTranslateProject(): Promise<boolean> {
    const isAngularWorkspace = (await workspace.findFiles('**/**/angular.json', `**/node_modules/**`, 1))?.length > 0;
    const isNxWorkspace = (await workspace.findFiles('**/**/nx.json', `**/node_modules/**`, 1))?.length > 0;
    const hasNgxTranslateModule = (await workspace.findFiles('**/node_modules/**/*ngx-translate*', null, 1))?.length > 0;
    return (isAngularWorkspace || isNxWorkspace) && hasNgxTranslateModule;
}

export function setExtensionEnabled(enabled: boolean) {
    // https://github.com/Microsoft/vscode/issues/10401#issuecomment-280090759
    commands.executeCommand('setContext', 'lingua:enabled', enabled);
    if(enabled) {
        console.log("Enabled lingua extension on workspace");
    }
}
