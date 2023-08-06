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
    if (enabled) {
        console.log("Enabled lingua extension on workspace");
    }
}

/**
 * Find translation files that follow the default pattern /i18n/_.json.
 */
export async function findTranslationFiles(): Promise<Map<string, Uri> | undefined> {
    const i18n = await workspace.findFiles(`**/i18n/**`, `**/node_modules/**`)
    if (i18n.length === 0) {
        return;
    }

    const translationFileMap = new Map();
    i18n.forEach(uri => {
        const path = uri.path;
        const filenameWithExtension = path.substring(path.lastIndexOf('/') + 1);

        if (filenameWithExtension.endsWith('.json')) {
            const languageId = filenameWithExtension.split('.')[0]
            translationFileMap.set(languageId, uri);
            console.log(languageId, uri);
        }
    });

    return translationFileMap.size > 0 ? translationFileMap : undefined;
}