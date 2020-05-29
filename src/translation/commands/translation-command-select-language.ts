import { promtTranslationSet } from './translation-command-helper';
import { TranslationSets } from '../translation-sets';
import { Configuration } from '../../configuration-settings';

export async function commandSelectDefaultLanguage(translationSets: TranslationSets) {
    if (translationSets.count == 0) {
        return;
    }

    let translationSet = await promtTranslationSet(translationSets);
    Configuration.setDefaultLanguage(translationSet.identifier);
}
