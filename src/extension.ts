import * as vscode from 'vscode';
import { workspace, languages, Disposable, window, Uri, TextDocument, commands, ConfigurationTarget } from 'vscode';
import { TranslationSets } from './translation/translation-sets';
import { LinguaSettings } from './lingua-settings';
import {
    createTranslation,
    locateTranslation,
    changeTranslation,
    convertToTranslation,
} from './translation/translation-utils';
import { updateTranslationDecorations } from './decoration';
import { readSettings, writeSettings } from './lingua-settings';
import AnalysisReportProvider from './translation/providers/analysis-report-provider';
import { posix } from 'path';
import AutoCompleteProvider from './auto-complete';
import { TranslationSet } from './translation/translation-set';
import { TranslationDuplicates } from './translation/analysis/translation-duplicates';

let settings: LinguaSettings;
let translationSets: TranslationSets;

export async function activate(context: vscode.ExtensionContext) {
    /*
        vscode shows all registered commands per default, whether the extension has
        loaded or not. Check if the project type is correct and enable/disable
        the commands
    */
    if (await isNgxTranslateProject()) {
        setExtensionEnabled(true);
    } else {
        setExtensionEnabled(false);
        return;
    }

    settings = await readSettings();
    translationSets = new TranslationSets();

    /* Register completion item provider for translations identifiers */
    let completionProvider = languages.registerCompletionItemProvider(
        'html',
        new AutoCompleteProvider(translationSets)
    );
    context.subscriptions.push(completionProvider);

    /* Register document provider for translation analysis */
    const provider = new AnalysisReportProvider(settings, translationSets);
    const providerRegistrations = Disposable.from(
        workspace.registerTextDocumentContentProvider(AnalysisReportProvider.scheme, provider),
        languages.registerDocumentLinkProvider({ scheme: AnalysisReportProvider.scheme }, provider)
    );
    context.subscriptions.push(provider, providerRegistrations);

    /* Analyse translation usage across all files declared in .lingua */
    context.subscriptions.push(
        vscode.commands.registerCommand('lingua.analyse', async () => {
            updateTranslationSets(settings, translationSets).then(async () => {
                // Analyse translation usage

                const uriUsed = Uri.parse('lingua:report-used');
                const docUsed = await workspace.openTextDocument(uriUsed);
                await window.showTextDocument(docUsed);

                const uriUnused = Uri.parse('lingua:report-missing');
                const docUnused = await workspace.openTextDocument(uriUnused);
                return await window.showTextDocument(docUnused);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('lingua.findDuplicates', async () => {
            updateTranslationSets(settings, translationSets).then(async () => {
                findDuplicates(translationSets.default);
            });
        })
    );

    /* Go to a translation entry in the default translation file */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.gotoTranslation', async (editor) => {
            gotoTranslation(settings, translationSets, editor.document, editor.selection);
        })
    );

    /* Set the currently opened file as a translation file */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.selectLocaleFile', async (editor) => {
            const languageFileUri = editor.document.uri;

            const language = await window.showInputBox({
                placeHolder: "Enter a language identifier of this file (e.g. 'de' or 'en')",
            });
            if (language) {
                // TODO: fix this uri madness
                const uri = workspace.asRelativePath(languageFileUri.path);

                writeSettings(settings, 'translationFiles', [{ lang: language, uri: uri }]);
                if (!workspace.getConfiguration('lingua').get('defaultLanguage')) {
                    workspace
                        .getConfiguration('lingua')
                        .update('defaultLanguage', language, ConfigurationTarget.Global);
                }
            }
        })
    );

    /* Create a translation for the selected translation identifier */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.createTranslation', async (editor) => {
            updateTranslationSets(settings, translationSets).then(() => {
                createTranslation(translationSets, editor.document, editor.selection);
            });
        })
    );

    /* Change a translation for the selected translation identifier */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.changeTranslation', async (editor) => {
            updateTranslationSets(settings, translationSets).then(() => {
                changeTranslation(translationSets, editor.document, editor.selection);
            });
        })
    );

    /* Convert a selected text to a translation file */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.convertToTranslation', async (editor) => {
            updateTranslationSets(settings, translationSets).then(() => {
                convertToTranslation(translationSets, editor);
            });
        })
    );

    // Callbacks to control decoration and settings updates

    let activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        updateTranslationSets(settings, translationSets).then(() => {
            if (activeEditor) {
                updateTranslationDecorations(activeEditor, translationSets.default);
            }
        });
    }

    vscode.window.onDidChangeActiveTextEditor(
        async (editor) => {
            activeEditor = editor;
            updateTranslationSets(settings, translationSets).then(() => {
                if (activeEditor) {
                    updateTranslationDecorations(activeEditor, translationSets.default);
                }
            });
        },
        null,
        context.subscriptions
    );

    vscode.workspace.onDidChangeTextDocument(
        async (event) => {
            const translationSetUri = translationSets.default.uri;

            // update either if content of current editor is changed or if content of
            // default translation changes
            if (
                (activeEditor && event.document === activeEditor.document) ||
                event.document.uri.path === translationSetUri.path
            ) {
                updateTranslationSets(settings, translationSets).then(() => {
                    if (activeEditor) {
                        updateTranslationDecorations(activeEditor, translationSets.default);
                    }
                });
            }
        },
        null,
        context.subscriptions
    );

    vscode.workspace.onDidSaveTextDocument(
        async (event) => {
            if (posix.extname(event.fileName) === '.lingua') {
                settings = await readSettings();
            }
        },
        null,
        context.subscriptions
    );
}

export function deactivate() {}

function setExtensionEnabled(enabled: boolean) {
    // https://github.com/Microsoft/vscode/issues/10401#issuecomment-280090759
    commands.executeCommand('setContext', 'lingua:enabled', enabled);
}

/**
 * Go to a existing translation or partial translation using a translation identifert
 * @param settings
 * @param translationSets
 * @param document
 * @param selection Either the whole selected identifier or a selection inside the identifier
 */
async function gotoTranslation(
    settings: LinguaSettings,
    translationSets: TranslationSets,
    document: TextDocument,
    selection: vscode.Selection
) {
    updateTranslationSets(settings, translationSets).then(() => {
        const defaultTranslation = translationSets.default;
        if (defaultTranslation) {
            locateTranslation(defaultTranslation, document, selection);
        }
    });
}

/**
    Update all translation sets that are declared in .lingua config.
    A translation set contains all translation paths and its corresponding translations.
    For each [locale].json there can be a seperate translation set
*/
async function updateTranslationSets(settings: LinguaSettings, translationSets: TranslationSets): Promise<void> {
    if (settings.translationFiles.length) {
        await translationSets.build(settings);
        return Promise.resolve();
    } else {
        window.showWarningMessage(
            'Lingua: There is no translation file *.json configured for this extension.\n' +
                'To use it, please navigate to your translation file and set it via the context menu\n' +
                " or by calling 'lingua:selectLocaleFile'"
        );
        return Promise.reject();
    }
}

async function findDuplicates(translationSet: TranslationSet) {
    const extensionSettings = vscode.workspace.getConfiguration('lingua').get<string>('analysisExtensions') || '';
    const extensions = extensionSettings.replace(/\s*/, '').split(',');
    TranslationDuplicates.findDuplicatePathLeaves(translationSet);
    TranslationDuplicates.findDuplicateTranslations(translationSet);
}

/**
 * Check if the current project is a angular project with ngx-translate module
 */
async function isNgxTranslateProject(): Promise<boolean> {
    const isAngular = await workspace.findFiles('**/angular.json', `**/node_modules/**`);
    const hasNgxTranslateModule = await workspace.findFiles('**/node_modules/**/ngx-translate*');
    return isAngular.length > 0 && hasNgxTranslateModule.length > 0;
}
