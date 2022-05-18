import { expect } from 'chai';
import * as vscode from 'vscode';
import { Selection, Position, Range } from 'vscode';
import { selectTranslationPath, isTranslationIdentifier } from '../../translation/translation-utils';
// tslint:disable: no-unused-expression

suite('Translation Utils', () => {
    const readSelectTranslationPathTestDoc = async function (): Promise<vscode.TextDocument> {
        const uri = (
            await vscode.workspace.findFiles('**/src/**/selectTranslationPathTest.html', '**/node_modules/**', 1)
        )[0];
        return vscode.workspace.openTextDocument(uri);
    };

    test('select translation paths', async () => {
        const doc = await readSelectTranslationPathTestDoc();

        // single selection at start
        const s1 = new Selection(new Position(0, 4), new Position(0, 4));
        const r1 = new Range(new Position(0, 4), new Position(0, 14));
        expect(selectTranslationPath(doc, s1)).to.deep.eq(r1);

        // single selection at end
        const s2 = new Selection(new Position(0, 14), new Position(0, 14));
        const r2 = new Range(new Position(0, 4), new Position(0, 14));
        expect(selectTranslationPath(doc, s2)).to.deep.eq(r2);

        // whole selection (second test line)
        const s3 = new Selection(new Position(1, 4), new Position(1, 14));
        const r3 = new Range(new Position(1, 4), new Position(1, 14));
        expect(selectTranslationPath(doc, s3)).to.deep.eq(r3);

        // reverse whole selection (second test line)
        const s4 = new Selection(new Position(1, 14), new Position(1, 4));
        const r4 = new Range(new Position(1, 4), new Position(1, 14));
        expect(selectTranslationPath(doc, s4)).to.deep.eq(r4);

        // third test line
        const s5 = new Selection(new Position(2, 8), new Position(2, 8));
        const r5 = new Range(new Position(2, 1), new Position(2, 12));
        expect(selectTranslationPath(doc, s5)).to.deep.eq(r5);
    });

    test('isTranslationIdentifier', () => {
        expect(isTranslationIdentifier('some')).to.be.true;
        expect(isTranslationIdentifier('some.path')).to.be.true;
        expect(isTranslationIdentifier('some.path.THAT.IS.CORRECT')).to.be.true;
        expect(isTranslationIdentifier('s_ome.pa-th.THAT.IS.C-_ORRECT')).to.be.true;
        expect(isTranslationIdentifier('hello world')).to.be.true;

        expect(isTranslationIdentifier('!§/(!"§!_')).to.be.false;
    });
});
