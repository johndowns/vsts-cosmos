import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import { DocumentClient } from 'documentdb';

let taskPath = path.join(__dirname, '..', 'createCosmosDbCollection.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('collectionAccountEndpoint', 'endpoint');
tmr.setInput('collectionAccountKey', 'key');
tmr.setInput('collectionDatabaseName', 'db');
tmr.setInput('collectionName', 'coll');
tmr.setInput('collectionThroughput', '1000');
tmr.setInput('collectionPartitionKey', 'partitionKey');
tmr.setInput('collectionStorageCapacity', 'unlimited');
tmr.setInput('collectionCreateDatabaseIfNotExists', 'true');
tmr.setInput('failIfExists', 'true');

tmr.registerMock('./cosmosDb', {
    databaseExistsAsync: function(accountEndpoint: string, accountKey: string, databaseName: string): Promise<boolean> {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(true);
        });
    },

    collectionExistsAsync: function(accountEndpoint: string, accountKey: string, databaseName: string, collectionName: string): Promise<boolean> {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(false);
        });
    },

    createCollectionAsync: function(accountEndpoint: string, accountKey: string, databaseName: string, collectionName: string, collectionThroughput: number, collectionPartitionKey?: string): Promise<void>  {
        return new Promise<void>(function(resolve, reject) {
            reject('cannot create collection');
        });
    }
});

tmr.run();
