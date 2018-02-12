import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'vsts-task-lib/mock-test';

describe('Sample task tests', function () {
    before(() => {
    });

    after(() => {
    });

    it('should succeed when collection created successfully', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'success-collectionCreated.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert(tr.succeeded, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");

        done();
    });

    it('should succeed when collection and database created successfully', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'success-databaseAndCollectionCreated.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert(tr.succeeded, 'should have succeeded');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 0, "should have no errors");

        done();
    });

    it('should fail when collection not created', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'fail-collectionNotCreated.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert(! tr.succeeded, 'should have failed');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have one errors");

        done();
    });

    it('should fail when database not created', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'fail-databaseNotCreated.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();

        assert(! tr.succeeded, 'should have failed');
        assert.equal(tr.warningIssues.length, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have one errors");

        done();
    });

    /*
    it('it should fail if tool returns 1', (done: MochaDone) => {
        this.timeout(1000);

        let tp = path.join(__dirname, 'failrc.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.run();
        assert(!tr.succeeded, 'should have failed');
        assert.equal(tr.invokedToolCount, 1);
        assert.equal(tr.warningIssues, 0, "should have no warnings");
        assert.equal(tr.errorIssues.length, 1, "should have 1 error issue");
        assert.equal(tr.errorIssues[0], '/mocked/tools/echo failed with return code: 1', 'error issue output');
        assert(tr.stdout.indexOf('atool output here') >= 0, "tool stdout");
        assert.equal(tr.stdout.indexOf('Hello Mock!'), -1, "task module should have never been called");

        done();
    });
    */
});