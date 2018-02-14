import task = require('vsts-task-lib/task');
import toolRunnerModule = require('vsts-task-lib/toolrunner');
import * as cosmos from './cosmosDb'

async function run() {
    try {
        // get the inputs
        let accountEndpoint = task.getInput("accountEndpoint", true);
        let accountKey = task.getInput("accountKey", true);
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
        await runImpl(accountEndpoint, accountKey, databaseName, collectionName, collectionStorageCapacity, collectionThroughput, collectionPartitionKey, collectionFailIfExists, databaseCreateIfNotExists);

        task.setResult(task.TaskResult.Succeeded, null);
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err);
    }
}

async function runImpl(accountEndpoint: string, accountKey: string, databaseName: string, collectionName: string, collectionStorageCapacity: string, collectionThroughput: number, collectionPartitionKey: string, collectionFailIfExists: boolean, databaseCreateIfNotExists: boolean) {
    console.log(`Checking if database '${databaseName}' exists...`);
    var databaseExists = await cosmos.databaseExistsAsync(accountEndpoint, accountKey, databaseName);
    if (! databaseExists) {
        if (! databaseCreateIfNotExists) {
            throw new Error('Database does not exist.');
        }

        console.log('Database does not exist. Creating...');
        await cosmos.createDatabaseAsync(accountEndpoint, accountKey, databaseName);
    }
    else {
        console.log('Database exists.');
    }

    console.log(`Checking if collection '${collectionName}' exists...`);
    var collectionExists = await cosmos.collectionExistsAsync(accountEndpoint, accountKey, databaseName, collectionName);
    if (! collectionExists) {
        console.log('Collection does not exist. Creating...')
        await cosmos.createCollectionAsync(accountEndpoint, accountKey, databaseName, collectionName, collectionStorageCapacity, collectionThroughput, collectionPartitionKey);
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
