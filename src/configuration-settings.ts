import { workspace } from 'vscode';

export function useFlatTranslationKeys(): boolean {
    return workspace.getConfiguration('lingua').get<boolean>('flatTranslationKeys', false);
}
