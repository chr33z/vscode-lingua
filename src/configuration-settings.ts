import { workspace, ConfigurationTarget } from 'vscode';

export class Configuration {
    public static useFlatTranslationKeys(): boolean {
        return workspace.getConfiguration('lingua').get<boolean>('flatTranslationKeys', false);
    }

    public static maxTranslationLength(defaultLength: number = 80): number {
        return workspace.getConfiguration('lingua').get<number>('decoration.maxTranslationLength', defaultLength);
    }

    public static showInlineTranslation(defaultShow: boolean = true): boolean {
        return workspace.getConfiguration('lingua').get<boolean>('decoration.showInlineTranslation', defaultShow);
    }

    public static defaultLanguage(): string | undefined {
        return workspace.getConfiguration('lingua').get<string>('defaultLanguage');
    }

    public static analysisExtension(): string {
        return workspace.getConfiguration('lingua').get<string>('analysisExtensions') || '';
    }

    public static warnAboutTranslationKeyStyles(): boolean {
        return workspace.getConfiguration('lingua').get<boolean>('warnAboutFlatAndMixedTranslationKeys', true);
    }

    public static async setUseFlatTranslationKey(enabled: boolean) {
        return workspace.getConfiguration('lingua').update('flatTranslationKeys', enabled);
    }

    public static async setWarnAboutTranslationKeyStyles(enabled: boolean) {
        return workspace.getConfiguration('lingua').update('warnAboutFlatAndMixedTranslationKeys', enabled);
    }

    public static async setDefaultLanguage(language: string) {
        workspace.getConfiguration('lingua').update('defaultLanguage', language);
    }
}
