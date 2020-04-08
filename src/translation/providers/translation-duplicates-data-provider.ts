import { TreeDataProvider, TreeItem, window, TreeItemCollapsibleState } from 'vscode';
import { DuplicateTranslationResult } from '../duplicates/duplicate-translation-result';

export class TranslationDuplicatesDataProvider implements TreeDataProvider<TranslationTreeItem> {
    constructor(private _duplicateTranslationResults: DuplicateTranslationResult[]) {}

    getTreeItem(element: TranslationTreeItem): TreeItem {
        return element;
    }

    getChildren(element?: TranslationTreeItem): Thenable<TranslationTreeItem[]> {
        if (element) {
            if (!element.isLeaf) {
                return Promise.resolve(this.getChildEntries(element.index));
            } else {
                return Promise.resolve([]);
            }
        } else {
            return Promise.resolve(this.getParentEntries());
        }
    }

    private getParentEntries(): TranslationTreeItem[] {
        const parentEntries: TranslationTreeItem[] = [];
        this._duplicateTranslationResults.forEach((result, i) => {
            const description = `(${result.occurences})`;
            parentEntries.push(
                new TranslationTreeItem(result.translation, i, TreeItemCollapsibleState.Collapsed, description)
            );
        });
        return parentEntries;
    }

    private getChildEntries(index: number): TranslationTreeItem[] {
        const translation = this._duplicateTranslationResults[index];

        const childEntries: TranslationTreeItem[] = [];
        translation.paths.forEach((path, i) => {
            const isLeaf = true;
            childEntries.push(new TranslationTreeItem(path, i, TreeItemCollapsibleState.None, '', isLeaf));
        });
        return childEntries;
    }
}

class TranslationTreeItem extends TreeItem {
    constructor(
        public readonly label: string,
        public readonly index: number,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly desc: string = '',
        public readonly isLeaf: boolean = false
    ) {
        super(label, collapsibleState);
    }

    get description(): string {
        return this.desc;
    }

    // iconPath = {
    //     light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    //     dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg'),
    // };
}
