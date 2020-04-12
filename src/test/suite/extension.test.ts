import * as assert from 'assert';

import * as lingua from '../../extension';

suite('Extension', () => {
	test('Recognizes correct project setup', async () => {
		assert.equal(await lingua.isNgxTranslateProject(), true);
	});
});
