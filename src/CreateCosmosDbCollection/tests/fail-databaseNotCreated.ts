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

// mock a specific module function called in task 
var databaseExists = false;
tmr.registerMock('./cosmosDb', {
    tryCreateCollectionAsync: function(accountEndpoint: string, accountKey: string, databaseName: string, collectionName: string, collectionThroughput: number, collectionPartitionKey?: string): Promise<void>  {
        return new Promise<void>(function(resolve, reject) {
            if (databaseExists) {
                resolve();
            }
            else {
                reject('Database does not exist.');
            }
        });
    },

    createDatabaseAsync: function(accountEndpoint: string, accountKey: string, databaseName: string): Promise<void>  {
        return new Promise<void>(function(resolve, reject) {
            databaseExists = false;
            resolve();
        });
    }
});



tmr.run();
