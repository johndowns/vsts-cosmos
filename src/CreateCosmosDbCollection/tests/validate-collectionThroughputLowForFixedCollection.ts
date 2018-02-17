import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import { DocumentClient } from 'documentdb';

let taskPath = path.join(__dirname, '..', 'createCosmosDbCollection.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('authenticationType', 'key');
tmr.setInput('accountName', 'endpoint');
tmr.setInput('accountKey', 'key');
tmr.setInput('databaseName', 'db');
tmr.setInput('collectionName', 'coll');
tmr.setInput('collectionThroughput', '401');
tmr.setInput('collectionPartitionKey', 'partitionKey');
tmr.setInput('collectionStorageCapacity', 'fixed');
tmr.setInput('databaseCreateIfNotExists', 'true');
tmr.setInput('collectionFailIfExists', 'true');

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
            resolve();
        });
    },
});

tmr.run();
