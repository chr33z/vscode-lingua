import {
    CompletionItemProvider,
    TextDocument,
    Position,
    CancellationToken,
    CompletionContext,
    ProviderResult,
    CompletionItem,
    CompletionList,
    MarkdownString,
    Range,
    CompletionItemKind,
} from 'vscode';
import { TranslationSets } from './translation/translation-sets';
import { Configuration } from './configuration-settings';

export default class AutoCompleteProvider implements CompletionItemProvider {
    constructor(private _translationSets: TranslationSets) { }

    provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
    ): ProviderResult<CompletionItem[] | CompletionList> {
        if (!this._translationSets) {
            return;
        }

        const autocomplete = this.canAutocomplete(document, position);
        if (autocomplete === undefined) {
            return;
        }
        let translationCompletes: CompletionItem[] = [];
        this._translationSets.default.keys.forEach((key) => {
            if (autocomplete === "") {
                const item = new CompletionItem(key);
                const translation = this._translationSets.default.getTranslation(key) || undefined;
                item.documentation = new MarkdownString(translation);
                translationCompletes.push(item);
            }
            else {
                if (key.startsWith(autocomplete)) {
                    const item = new CompletionItem(key);
                    const translation = this._translationSets.default.getTranslation(key) || undefined;
                    item.kind = CompletionItemKind.Text;
                    item.documentation = new MarkdownString(translation);
                    translationCompletes.push(item);
                }
            }
        });

        return translationCompletes;
    }

    /**
     * 
     * @param document 
     * @param position 
     * @returns 'undefined' if there is no autocomplete, an empty string if it the start of an autocomplete, a string of already typed characters if it is an autocomplete
     */
    private canAutocomplete(document: TextDocument, position: Position): string | undefined {
        if (!Configuration.getAutocompleteEnabled()) {
            return;
        }

        const line = document.getText(new Range(position.line, 0, position.line, position.character));
        if (line.length < 2) {
            return;
        }
        const token = line.split(/[\s=]/);
        const lastToken = token[token.length - 1];

        const tokenStartsWithQuote = function (word: string): boolean {
            const reg = /^[\"\'\`]/;
            const match = word.match(reg);
            return match ? true : false;
        };

        if (tokenStartsWithQuote(lastToken)) {
            return lastToken.replace(/['"`]/g, "") || "";
        }

        return undefined;
    }
}
