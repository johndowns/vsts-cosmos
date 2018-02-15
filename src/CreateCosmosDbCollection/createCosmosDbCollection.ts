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
        if (authenticationType == "arm") {
            var resourceGroupName = task.getInput("resourceGroupName", true);

            var connectedService: string = task.getInput("armService", true);
            var servicePrincipalClientId: string = task.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
            var servicePrincipalClientSecret: string = task.getEndpointAuthorizationParameter(connectedService, "serviceprincipalkey", false);
            var tenantId: string = task.getEndpointAuthorizationParameter(connectedService, "tenantid", false);
            var subscriptionName: string = task.getEndpointDataParameter(connectedService, "SubscriptionName", true);
            var subscriptionId: string = task.getEndpointDataParameter(connectedService, "SubscriptionId", true);

            console.log("TODO");
            console.log(subscriptionName);
            console.log(subscriptionId);
            console.log("TODO");
            accountKey = await azureRm.getCosmosDbAccountKey(servicePrincipalClientId, servicePrincipalClientSecret, tenantId, subscriptionId, resourceGroupName, accountName);
            // TODO exceptions in here aren't getting treated as failures
        } else if (authenticationType == "key") {
            if ((accountKey == undefined) || (accountKey == "")) {
                throw new Error("Account key must be specified.");
            }
        } else {
            throw new Error("Authentication type must either be 'Azure Resource Manager' or 'Cosmos DB account key or SAS token'.")
        }

        let collectionThroughput = Number(collectionThroughputInput);
        if (isNaN(collectionThroughput)) {
            throw new Error("Collection throughput must be a number.");
        } else if (collectionThroughput < 1000) {
            throw new Error("Collection throughput must be at least 1000 RU/s.");
        }
        
        if (collectionStorageCapacity != "fixed" && collectionStorageCapacity != "unlimited") {
            throw new Error("Collection storage capacity must either be 'Fixed' or 'Unlimited'.")
        }
        
        if (collectionStorageCapacity == "unlimited" && (collectionPartitionKey == undefined) || (collectionPartitionKey == "")) {
            throw new Error("A partition key must be specified for unlimited collections.");
        }

        // run the main logic
        await runImpl(accountName, accountKey, databaseName, collectionName, collectionStorageCapacity, collectionThroughput, collectionPartitionKey, collectionFailIfExists, databaseCreateIfNotExists);

        task.setResult(task.TaskResult.Succeeded, null);
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err);
    }
}

async function runImpl(accountName: string, accountKey: string, databaseName: string, collectionName: string, collectionStorageCapacity: string, collectionThroughput: number, collectionPartitionKey: string, collectionFailIfExists: boolean, databaseCreateIfNotExists: boolean) {
    console.log(`Checking if database '${databaseName}' exists...`);
    var databaseExists = await cosmos.databaseExistsAsync(accountName, accountKey, databaseName);
    if (! databaseExists) {
        if (! databaseCreateIfNotExists) {
            throw new Error('Database does not exist.');
        }

        console.log('Database does not exist. Creating...');
        await cosmos.createDatabaseAsync(accountName, accountKey, databaseName);
    }
    else {
        console.log('Database exists.');
    }

    console.log(`Checking if collection '${collectionName}' exists...`);
    var collectionExists = await cosmos.collectionExistsAsync(accountName, accountKey, databaseName, collectionName);
    if (! collectionExists) {
        console.log('Collection does not exist. Creating...')
        await cosmos.createCollectionAsync(accountName, accountKey, databaseName, collectionName, collectionStorageCapacity, collectionThroughput, collectionPartitionKey);
    }
    else {
        if (collectionFailIfExists) {
            throw new Error(`Collection ${ collectionName } already exists.`);
        } else {
            console.log('Collection exists.');
        }
    }
}

run();
