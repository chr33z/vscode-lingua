import * as vscode from 'vscode';
import { workspace, languages, Disposable, window, Uri, TextDocument } from 'vscode';
import TranslationReportProvider from './translation/translation-report-provider';
import { TranslationSets } from './translation/translation-sets';
import { LinguaSettings } from './lingua-settings';
import { createTranslation, locateTranslation, changeTranslation } from './translation/translation-utils';
import { updateTranslationDecorations } from './decoration';
import { readSettings, writeSettings } from './lingua-settings';

export async function activate(context: vscode.ExtensionContext) {
    const settings = await readSettings();
    let translationSets = new TranslationSets();

    const provider = new TranslationReportProvider(settings, translationSets);
    const providerRegistrations = Disposable.from(
        workspace.registerTextDocumentContentProvider(TranslationReportProvider.scheme, provider),
        languages.registerDocumentLinkProvider({ scheme: TranslationReportProvider.scheme }, provider)
    );
    context.subscriptions.push(provider, providerRegistrations);

    /*
        Analyse translation usage across all files declared in .lingua
    */
    context.subscriptions.push(
        vscode.commands.registerCommand('lingua.analyse', async () => {
            updateTranslationSets(settings, translationSets).then(async () => {
                const uri = Uri.parse('lingua:report');
                const doc = await workspace.openTextDocument(uri);
                return await window.showTextDocument(doc);
            });
        })
    );

    /*
        Go to a specific translation by selecting npthe translation path and select this command
        with the contect menu
    */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.gotoTranslation', async editor => {
            gotoTranslation(settings, translationSets, editor.document, editor.selection);
        })
    );

    /*
        Set the currently opened file as a translation file
    */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.selectLocaleFile', async editor => {
            const localeUri = editor.document.uri;

            const locale = await window.showInputBox({
                placeHolder: "Enter the language locale if this file (e.g. 'de' or 'en')",
            });
            if (locale) {
                // TODO: fix this uri madness
                const uri = workspace.asRelativePath(localeUri.path);
                writeSettings(settings, 'translationFiles', [{ locale: locale, uri: uri }]);
            }
        })
    );

    /*
        Create a translation for the selected translation identifier
    */
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.createTranslation', async editor => {
            updateTranslationSets(settings, translationSets).then(() => {
                const selection: vscode.Selection = editor.selection;
                createTranslation(translationSets, editor.document, selection).then(() => {
                    gotoTranslation(settings, translationSets, editor.document, editor.selection);
                });
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('lingua.changeTranslation', async editor => {
            updateTranslationSets(settings, translationSets).then(() => {
                const selection: vscode.Selection = editor.selection;
                changeTranslation(translationSets, editor.document, selection).then(() => {
                    gotoTranslation(settings, translationSets, editor.document, editor.selection);
                });
            });
        })
    );

    let activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        updateTranslationSets(settings, translationSets).then(() => {
            if (activeEditor) {
                updateTranslationDecorations(activeEditor, settings, translationSets.default);
            }
        });
    }

    vscode.window.onDidChangeActiveTextEditor(
        async editor => {
            activeEditor = editor;
            updateTranslationSets(settings, translationSets).then(() => {
                if (activeEditor) {
                    updateTranslationDecorations(activeEditor, settings, translationSets.default);
                }
            });
        },
        null,
        context.subscriptions
    );

    vscode.workspace.onDidChangeTextDocument(
        async event => {
            if (activeEditor && event.document === activeEditor.document) {
                updateTranslationSets(settings, translationSets).then(() => {
                    if (activeEditor) {
                        updateTranslationDecorations(activeEditor, settings, translationSets.default);
                    }
                });
            }
        },
        null,
        context.subscriptions
    );
}

export function deactivate() {}

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
