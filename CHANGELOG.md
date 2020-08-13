## [0.8.2]

### Fix

-   Bump lodash dependency

## [0.8.1]

### Fix

-   Removed the "always-on" feature for the inline translation settings. The setting now works as expected.
-   Maximum Lookup Length settings now works as expected.

## [0.8.0]

### New features

-   Users can now chose between a 'nested' and a 'flat' translation key style (see Readme for infos about configuration.)
-   Added command 'selectDefaultLanguage' to select the default language that is used to show inline translations.

## [0.7.1]

### Fix

-   Did not change default language correctly and translation decorator did not work

## [0.7.0]

### Fix

-   Added test coverage
-   Fixed identification of ngx-translate projects
-   Fixed potential security vulnerability introduced by a dependency.
-   Fixed minor bugs

## [0.6.1]

### Fix

-   Fixed potential security vulnerability introduced by a dependency.

## [0.5.0]

### New features

-   There is now an autocomplete function that shows all available translation identifiers when
    typing in html.

### Other changes

-   Most of the settings now reside in the extensions settings page in vscode. The .lingua settings
    still exist to store mapping of languages to language files.

## [0.4.0]

-   Extension restrictions on Angular + ngx-translate projects
-   Themable translation previews
