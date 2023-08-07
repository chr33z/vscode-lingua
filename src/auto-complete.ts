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
                    const item = new CompletionItem(key.replace(autocomplete, ""));
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
        const line = document.getText(new Range(position.line, 0, position.line, position.character));
        if (line.length < 2) {
            return;
        }

        const charIsQuote = function (char: string) {
            return char === '"' || char === "'";
        };

        const lineContainsQuote = function (line: string): string | undefined {
            const reversedLine = line.split("").reverse().join("");
            const reg = /^[a-zA-Z1-9|\.\-\_]+[\"\']/;
            const match = reversedLine.match(reg);

            if (!match) {
                return;
            }

            return match[0].split("").reverse().join("");
        };

        const lastCharacter1 = line.at(line.length - 1) || "";
        const lastCharacter2 = line.at(line.length - 2) || "";

        if (charIsQuote(lastCharacter1) && charIsQuote(lastCharacter2)) {
            // If both last characters are quotes, then we are outside of an autocomplete -> return undefined
            return undefined;
        }
        else if (charIsQuote(lastCharacter1) && !charIsQuote(lastCharacter2)) {
            // If only the last character is a quote, then we are at the start of an autocomplete -> return empty string
            return "";
        }
        else {
            // If neither last character is a quote, then we are in the middle of an autocomplete -> return the characters already typed
            return lineContainsQuote(line)?.replace(/['"]/g, "") || "";
        }
        return undefined;
    }
}
