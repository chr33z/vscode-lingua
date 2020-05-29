import * as vscode from 'vscode';
import { workspace, languages, Disposable, window, Uri, TextDocument, commands, ConfigurationTarget } from 'vscode';
import { TranslationSets } from './translation/translation-sets';
import { LinguaSettings } from './lingua-settings';
import { updateTranslationDecorations } from './decoration';
import { readSettings } from './lingua-settings';
import AnalysisReportProvider from './translation/providers/analysis-report-provider';
import { posix } from 'path';
import AutoCompleteProvider from './auto-complete';
import { TranslationKeyStyle } from './translation/translation-key-style';
import { createTranslation as commandCreateTranslation } from './translation/commands/translation-command-create';
import { convertToTranslation as commandConvertToTranslation } from './translation/commands/translation-command-convert';
import { locateTranslation as commandLocateTranslation } from './translation/commands/translation-command-locate';
import { isNgxTranslateProject, setExtensionEnabled } from './extension-utils';
import { Configuration } from './configuration-settings';
import { Notification } from './user-notifications';

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

    registerAutocompleteProvider(context);
    registerDocumentProvider(context);

    /* Analyse translation usage across all files declared in .lingua */
    context.subscriptions.push(
        vscode.commands.registerCommand('lingua.analyse', async () => {
            analyseTranslationUsage();
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
                const relativePath = workspace.asRelativePath(languageFileUri.path);

                settings.addTranslationSet(language, relativePath);
                if (translationSets.count <= 1) {
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
                commandCreateTranslation(translationSets, editor.document, editor.selection);
            });
        })
    );

    /* Change a translation for the selected translation identifier */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.changeTranslation', async (editor) => {
            updateTranslationSets(settings, translationSets).then(() => {
                commandCreateTranslation(translationSets, editor.document, editor.selection);
            });
        })
    );

    /* Convert a selected text to a translation file */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.convertToTranslation', async (editor) => {
            updateTranslationSets(settings, translationSets).then(() => {
                commandConvertToTranslation(translationSets, editor);
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

function registerDocumentProvider(context: vscode.ExtensionContext) {
    const provider = new AnalysisReportProvider(settings, translationSets);
    const providerRegistrations = Disposable.from(
        workspace.registerTextDocumentContentProvider(AnalysisReportProvider.scheme, provider),
        languages.registerDocumentLinkProvider({ scheme: AnalysisReportProvider.scheme }, provider)
    );
    context.subscriptions.push(provider, providerRegistrations);
}

function registerAutocompleteProvider(context: vscode.ExtensionContext) {
    let provider = languages.registerCompletionItemProvider('html', new AutoCompleteProvider(translationSets));
    context.subscriptions.push(provider);
}

function analyseTranslationUsage() {
    updateTranslationSets(settings, translationSets).then(async () => {
        const uriUsed = Uri.parse('lingua:analysis-report');
        const docUsed = await workspace.openTextDocument(uriUsed);
        await window.showTextDocument(docUsed);
    });
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
            commandLocateTranslation(defaultTranslation, document, selection);
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
    } else {
        Notification.showWarningNoTranslationFile();
        return Promise.reject();
    }

    if (translationSets.default && translationSets.default.translationKeyStyle != TranslationKeyStyle.Nested) {
        notifyUserTranslationKeyStyle();
    }
    return Promise.resolve();
}

export async function notifyUserTranslationKeyStyle() {
    const keyStyle = translationSets.default.translationKeyStyle;
    switch (keyStyle) {
        case TranslationKeyStyle.Flat:
            if (!Configuration.useFlatTranslationKeys()) {
                await Notification.showWarningFlatKeyStyle().then(() => {});
            }
            break;
        case TranslationKeyStyle.Mixed:
            Notification.showWarningNestedKeyStyle();
            break;
    }
}
