import { workspace } from 'vscode';

export class Configuration {
    public static useFlatTranslationKeys(): boolean {
        return workspace.getConfiguration('lingua').get<boolean>('flatTranslationKeys', false);
    }

    public static maxTranslationLength(defaultLength: number = 80): number {
        return workspace.getConfiguration('lingua').get<number>('decoration.maxTranslationLength') || defaultLength;
    }

    public static showInlineTranslation(defaultShow: boolean = true): boolean {
        return workspace.getConfiguration('lingua').get<boolean>('decoration.showInlineTranslation') || defaultShow;
    }

    public static defaultLanguage(): string | undefined {
        return workspace.getConfiguration('lingua').get<string>('defaultLanguage');
    }

    public static analysisExtension(): string {
        return workspace.getConfiguration('lingua').get<string>('analysisExtensions') || '';
    }
}
