import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import { DocumentClient } from 'documentdb';
import { CreateCollectionResult } from '../cosmosDb'

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
    tryCreateCollectionAsync: function(accountEndpoint: string, accountKey: string, databaseName: string, collectionName: string, collectionThroughput: number, collectionPartitionKey?: string): Promise<CreateCollectionResult>  {
        return new Promise<CreateCollectionResult>(function(resolve, reject) {
            reject('cannot create collection');
        });
    }
});

tmr.run();
