import task = require('vsts-task-lib/task');
import toolRunnerModule = require('vsts-task-lib/toolrunner');
import * as cosmos from './cosmosDb'
import * as azureRm from './azureRm'

async function run() {
    try {
        // get the inputs
        let authenticationType = task.getInput("authenticationType", true);
        let accountName = task.getInput("accountName", true);
        var accountKey = task.getInput("accountKey");
        let collectionName = task.getInput("collectionName", true);
        let databaseName = task.getInput("databaseName", true);
        let collectionThroughputInput = task.getInput("collectionThroughput", true);
        let collectionStorageCapacity = task.getInput("collectionStorageCapacity", true);
        let collectionPartitionKey = task.getInput("collectionPartitionKey");
        let databaseCreateIfNotExists = task.getBoolInput("databaseCreateIfNotExists", true);
        let collectionFailIfExists = task.getBoolInput("collectionFailIfExists", true);

        // validate the inputs
        let collectionThroughput = Number(collectionThroughputInput);
        if (isNaN(collectionThroughput)) {
            throw new Error("Collection throughput must be a number.");
        }
        
        if (collectionStorageCapacity != "fixed" && collectionStorageCapacity != "unlimited") {
            throw new Error("Collection storage capacity must either be 'Fixed' or 'Unlimited'.")
        }

        if (collectionStorageCapacity == "unlimited" && collectionThroughput < 1000) {
            throw new Error("Collection throughput for 'Unlimited' collections must be at least 1000 RU/s.");
        } else if (collectionStorageCapacity == "fixed" && collectionThroughput < 400) {
            throw new Error("Collection throughput for 'Fixed' collections must be at least 400 RU/s.");
        }
        
        if (collectionStorageCapacity == "unlimited" && (collectionPartitionKey == undefined) || (collectionPartitionKey == "")) {
            throw new Error("A partition key must be specified for unlimited collections.");
        }

        // get authentication key
        if (authenticationType == "arm") {
            var resourceGroupName = task.getInput("resourceGroupName", true);

            var connectedService: string = task.getInput("armService", true);
            var servicePrincipalClientId: string = task.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
            var servicePrincipalClientSecret: string = task.getEndpointAuthorizationParameter(connectedService, "serviceprincipalkey", false);
            var tenantId: string = task.getEndpointAuthorizationParameter(connectedService, "tenantid", false);
            var subscriptionId: string = task.getEndpointDataParameter(connectedService, "SubscriptionId", true);
    
            console.log(`Retrieving key for Cosmos DB account '${accountName}'...`);
            accountKey = await azureRm.getCosmosDbAccountKey(servicePrincipalClientId, servicePrincipalClientSecret, tenantId, subscriptionId, resourceGroupName, accountName);
        } else if (authenticationType == "key") {
            if ((accountKey == undefined) || (accountKey == "")) {
                throw new Error("Account key must be specified.");
            }
        } else {
            throw new Error("Authentication type must either be 'Azure Resource Manager' or 'Cosmos DB account key or SAS token'.")
        }

        // run the main logic
        await createCollectionAsync(accountName, accountKey, databaseName, collectionName, collectionStorageCapacity, collectionThroughput, collectionPartitionKey, collectionFailIfExists, databaseCreateIfNotExists);

        task.setResult(task.TaskResult.Succeeded, null);
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err);
    }
}

async function createCollectionAsync(accountName: string, accountKey: string, databaseName: string, collectionName: string, collectionStorageCapacity: string, collectionThroughput: number, collectionPartitionKey: string, collectionFailIfExists: boolean, databaseCreateIfNotExists: boolean) {
    console.log(`Checking if database '${databaseName}' exists...`);
    var databaseExists = await cosmos.databaseExistsAsync(accountName, accountKey, databaseName);
    if (! databaseExists) {
        if (! databaseCreateIfNotExists) {
            throw new Error('Database does not exist.');
        }

        console.log(`Database '${databaseName}' does not exist. Creating...`);
        await cosmos.createDatabaseAsync(accountName, accountKey, databaseName);
        console.log('Database created.');
    }
    else {
        console.log('Database exists.');
    }

    console.log(`Checking if collection '${collectionName}' exists...`);
    var collectionExists = await cosmos.collectionExistsAsync(accountName, accountKey, databaseName, collectionName);
    if (! collectionExists) {
        console.log(`Collection '${ collectionName }' does not exist. Creating...`);
        await cosmos.createCollectionAsync(accountName, accountKey, databaseName, collectionName, collectionStorageCapacity, collectionThroughput, collectionPartitionKey);
        console.log('Collection created.');
    }
    else {
        if (collectionFailIfExists) {
            throw new Error(`Collection '${ collectionName }' already exists.`);
        } else {
            console.log('Collection exists.');
        }
    }
}

run();
