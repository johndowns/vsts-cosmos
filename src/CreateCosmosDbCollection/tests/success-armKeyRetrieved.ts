import tmrm = require('vsts-task-lib/mock-run');
import path = require('path');
import { DocumentClient } from 'documentdb';

let taskPath = path.join(__dirname, '..', 'createCosmosDbCollection.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('authenticationType', 'arm');
let resourceGroupName = 'myresourcegroup';
tmr.setInput('resourceGroupName', resourceGroupName);

var endpointId = 'armService';
tmr.setInput(endpointId, endpointId);
let servicePrincipalId = "00000000-0000-0000-0000-000000000000";
let servicePrincipalKey = "dummy-key-value";
let tenantId = "00000000-0000-0000-0000-000000000001";
let subscriptionId = "00000000-0000-0000-0000-000000000002";
process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_SERVICEPRINCIPALID`] = servicePrincipalId;
process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_SERVICEPRINCIPALKEY`] = servicePrincipalKey;
process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_TENANTID`] = tenantId;
process.env[`ENDPOINT_AUTH_PARAMETER_${endpointId}_SUBSCRIPTIONID`] = subscriptionId;

let accountName = 'endpoint';
tmr.setInput('accountName', accountName);
tmr.setInput('accountKey', 'key');
tmr.setInput('databaseId', 'db');
tmr.setInput('collectionId', 'coll');
tmr.setInput('collectionThroughput', '1000');
tmr.setInput('collectionPartitionKey', 'partitionKey');
tmr.setInput('collectionStorageCapacity', 'unlimited');
tmr.setInput('databaseCreateIfNotExists', 'true');
tmr.setInput('collectionFailIfExists', 'true');

tmr.registerMock('./cosmosDb', {
    databaseExistsAsync: function(accountEndpoint: string, accountKey: string, databaseId: string): Promise<boolean> {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(true);
        });
    },

    collectionExistsAsync: function(accountEndpoint: string, accountKey: string, databaseId: string, collectionId: string): Promise<boolean> {
        return new Promise<boolean>(function(resolve, reject) {
            resolve(false);
        });
    },

    createCollectionAsync: function(accountEndpoint: string, accountKey: string, databaseId: string, collectionId: string, collectionThroughput: number, collectionPartitionKey?: string): Promise<void>  {
        return new Promise<void>(function(resolve, reject) {
            resolve();
        });
    },
});
tmr.registerMock('./azureRm', {
    getCosmosDbAccountKey: function(clientId: string, clientSecret: string, tenantId: string, subscriptionId: string, resourceGroupName: string, accountName: string): Promise<string> {
        return new Promise<string>(function(resolve, reject) {
            if (clientId == servicePrincipalId && clientSecret == servicePrincipalKey && tenantId == tenantId && subscriptionId == subscriptionId && resourceGroupName == resourceGroupName && accountName == accountName) {
                resolve("key");
            } else {
                reject('Mismatch in mock data');
            }
        });
    }
});

tmr.run();
