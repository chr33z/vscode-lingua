import { Uri } from 'vscode';

export class LinguaSettings {
    public static Default: LinguaSettings = {
        scanFiles: ['ts', 'html'],
        translationFiles: [],
        defaultLocale: 'de',
    };

    public scanFiles: string[] = [];
    public translationFiles: { locale: string; uri: Uri }[] = [];
    public defaultLocale: string = '';
}
