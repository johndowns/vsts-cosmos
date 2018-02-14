import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import { DocumentClient } from 'documentdb';

let taskPath = path.join(__dirname, '..', 'createCosmosDbCollection.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('accountEndpoint', 'endpoint');
tmr.setInput('accountKey', 'key');
tmr.setInput('databaseName', 'db');
tmr.setInput('collectionName', 'coll');
tmr.setInput('collectionThroughput', '1000');
tmr.setInput('collectionPartitionKey', 'partitionKey');
tmr.setInput('collectionStorageCapacity', 'unlimited');
tmr.setInput('databaseCreateIfNotExists', 'true');
tmr.setInput('collectionFailIfExists', 'true');

tmr.registerMock('./cosmosDb', {
    databaseExistsAsync: function(accountEndpoint: string, accountKey: string, databaseName: string): Promise<boolean> {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(false);
        });
    },

    createDatabaseAsync: function(accountEndpoint: string, accountKey: string, databaseName: string): Promise<void>  {
        return new Promise<void>(function(resolve, reject) {
            reject('database not created');
        });
    }
});

tmr.run();
