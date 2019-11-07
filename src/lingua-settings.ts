import { Uri } from 'vscode';

export class LinguaSettings {
    public static Default: LinguaSettings = {
        scanFiles: ['ts', 'html'],
        translationFiles: [],
    };

    public scanFiles: string[] = [];
    public translationFiles: [] = [];
}
