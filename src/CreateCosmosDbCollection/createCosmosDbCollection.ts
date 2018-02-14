import task = require('vsts-task-lib/task');
import toolRunnerModule = require('vsts-task-lib/toolrunner');
import * as cosmos from './cosmosDb'

async function run() {
    try {
        // get the inputs
        let accountEndpoint = task.getInput("collectionAccountEndpoint", true);
        let accountKey = task.getInput("collectionAccountKey", true);
        let collectionName = task.getInput("collectionName", true);
        let collectionDatabaseName = task.getInput("collectionDatabaseName", true);
        let collectionThroughputInput = task.getInput("collectionThroughput", true);
        let collectionStorageCapacity = task.getInput("collectionStorageCapacity", true);
        let collectionPartitionKey = task.getInput("collectionPartitionKey");
        let collectionCreateDatabaseIfNotExists = task.getBoolInput("collectionCreateDatabaseIfNotExists", true);
        let failIfExists = task.getBoolInput("failIfExists", true);

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
        await runImpl(accountEndpoint, accountKey, collectionDatabaseName, collectionName, collectionStorageCapacity, collectionThroughput, collectionPartitionKey, failIfExists, collectionCreateDatabaseIfNotExists);

        task.setResult(task.TaskResult.Succeeded, null);
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err);
    }
}

async function runImpl(accountEndpoint: string, accountKey: string, collectionDatabaseName: string, collectionName: string, collectionStorageCapacity: string, collectionThroughput: number, collectionPartitionKey: string, failIfExists: boolean, collectionCreateDatabaseIfNotExists: boolean) {
    console.log(`Checking if database '${collectionDatabaseName}' exists...`);
    var databaseExists = await cosmos.databaseExistsAsync(accountEndpoint, accountKey, collectionDatabaseName);
    if (! databaseExists) {
        if (! collectionCreateDatabaseIfNotExists) {
            throw new Error('Database does not exist.');
        }

        console.log('Database does not exist. Creating...');
        await cosmos.createDatabaseAsync(accountEndpoint, accountKey, collectionDatabaseName);
    }

    console.log(`Checking if collection '${collectionName}' exists...`);
    var collectionExists = await cosmos.collectionExistsAsync(accountEndpoint, accountKey, collectionDatabaseName, collectionName);
    if (! collectionExists) {
        console.log('Collection does not exist. Creating...')
        cosmos.createCollectionAsync(accountEndpoint, accountKey, collectionDatabaseName, collectionName, collectionStorageCapacity, collectionThroughput, collectionPartitionKey);
    }
    else {
        if (failIfExists) {
            throw new Error(`Collection ${ collectionName } already exists.`);
        } else {
            console.log('Collection already exists.');
        }
    }
}

run();
