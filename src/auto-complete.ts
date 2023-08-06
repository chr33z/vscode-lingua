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
} from 'vscode';
import { TranslationSets } from './translation/translation-sets';

export default class AutoCompleteProvider implements CompletionItemProvider {
    constructor(private _translationSets: TranslationSets) {}

    provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
        context: CompletionContext
    ): ProviderResult<CompletionItem[] | CompletionList> {
        if (!this._translationSets) {
            return;
        }

        if (!this.canAutoComplete(document, position)) {
            return;
        }

        let translationCompletes: CompletionItem[] = [];
        this._translationSets.default.keys.forEach((key) => {
            const item = new CompletionItem(key);
            const translation = this._translationSets.default.getTranslation(key) || undefined;
            item.documentation = new MarkdownString(translation);
            translationCompletes.push(item);
        });

        return translationCompletes;
    }

    /**
     *
     * @param document For now a simple validation if the substring 'translate' is contained in the line
     * @param position
     */
    private canAutoComplete(document: TextDocument, position: Position): boolean {
        const line = document.getText(new Range(position.line, 0, position.line + 1, 0));
        return line.includes('translate');
    }
}
