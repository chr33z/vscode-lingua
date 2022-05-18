import * as assert from 'assert';

import { isNgxTranslateProject } from '../../extension-utils';

suite('Extension', () => {
    test('Recognizes correct project setup', async () => {
        assert.equal(await isNgxTranslateProject(), true);
    });
});
