import { expect } from 'chai';
import { findFilesWithExtension } from '../../utils';

suite('Utils', () => {
    test('find specified files in project', async () => {
        const extensions = ['ts', 'html'];
        const files = await findFilesWithExtension(extensions);

        const tsFiles = files.filter((f) => f.path.endsWith('ts'));
        const htmlFiles = files.filter((f) => f.path.endsWith('html'));

        expect(tsFiles.length).to.eq(10);
        expect(htmlFiles.length).to.eq(2);
    });
});
