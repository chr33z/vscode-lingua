import { ColorThemeKind, workspace } from 'vscode';

export class Configuration {
    public static useFlatTranslationKeys(): boolean {
        return workspace.getConfiguration('lingua').get<boolean>('flatTranslationKeys', false);
    }

    public static maxTranslationLength(defaultLength: number = 80): number {
        return workspace.getConfiguration('lingua').get<number>('decoration.maxLookupLength', defaultLength);
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

    public static jsonIndentation(): number {
        return workspace.getConfiguration('lingua').get<number>('jsonIndentation', 2);
    }

    public static sortKeys(): boolean {
        return workspace.getConfiguration('lingua').get<boolean>('sortKeys', false);
    }

    public static getInlineColor(theme: ColorThemeKind): string {
        const themeName = ColorThemeKind[theme];
        return workspace.getConfiguration('lingua').get<string>(`inlineColor.${themeName}`, "#1a8582");
    }

    public static getPotentialIdentifierColor(theme: ColorThemeKind): string {
        const themeName = ColorThemeKind[theme];
        return workspace.getConfiguration('lingua').get<string>(`potentialIdentifierColor.${themeName}`, "#b7950b");
    }

    public static getAutocompleteEnabled(): boolean {
        return workspace.getConfiguration('lingua').get<boolean>('autocomplete.enabled', true);
    }
}
