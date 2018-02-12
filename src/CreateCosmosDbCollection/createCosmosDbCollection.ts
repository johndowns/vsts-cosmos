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
            // TODO test
        }

        if (collectionStorageCapacity != "fixed" && collectionStorageCapacity != "unlimited") {
            throw new Error("Collection storage capacity must either be 'Fixed' or 'Unlimited'.")
            // TODO can we test this?
        }
        
        if (collectionStorageCapacity == "unlimited" && (collectionPartitionKey == undefined) || (collectionPartitionKey == "")) {
            throw new Error("A partition key must be specified for unlimited collections.");
            // TODo can we test this?
        }

        await runImpl(accountEndpoint, accountKey, collectionDatabaseName, collectionName, collectionThroughput, collectionPartitionKey, failIfExists, collectionCreateDatabaseIfNotExists);

        task.setResult(task.TaskResult.Succeeded, null);
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err);
    }
}

// TODO storage capacity not being used in runImpl

async function runImpl(accountEndpoint: string, accountKey: string, collectionDatabaseName: string, collectionName: string, collectionThroughput: number, collectionPartitionKey: string, failIfExists: boolean, collectionCreateDatabaseIfNotExists: boolean) {
    // try to create the collection
    task.debug(`Attempting to create collection '${collectionName}' in database '${collectionDatabaseName}'...`);
    var collectionCreateResult = await cosmos.tryCreateCollectionAsync(accountEndpoint, accountKey, collectionDatabaseName, collectionName, collectionThroughput, collectionPartitionKey);
    switch (collectionCreateResult) {
        case cosmos.CreateCollectionResult.Success:
            task.debug(`Collection created successfully.`);
            break;

        case cosmos.CreateCollectionResult.CollectionAlreadyExists:
            task.debug(`Collection already exists.`);
            if (failIfExists) {
                throw new Error(`Collection ${ collectionName } already exists.`);
            }
            break;

        case cosmos.CreateCollectionResult.DatabaseDoesNotExist:
            if ( ! collectionCreateDatabaseIfNotExists) {
                throw new Error(`Database ${ collectionDatabaseName } does not exist.`);
            }

            task.debug(`Database '${ collectionDatabaseName }' does not exist. Creating database...`);
            var databaseCreateResult = cosmos.createDatabaseAsync(accountEndpoint, accountKey, collectionDatabaseName);
            
            task.debug(`Database created.`);
            task.debug(`Re-attempting to create collection '${ collectionName }' in database '${ collectionDatabaseName }'...`);
            var collectionCreateRetryResult = await cosmos.tryCreateCollectionAsync(accountEndpoint, accountKey, collectionDatabaseName, collectionName, collectionThroughput, collectionPartitionKey);
            if (collectionCreateRetryResult == cosmos.CreateCollectionResult.Success) {
                task.debug(`Collection created successfully.`);
            } else {
                throw new Error(`Cannot create collection ${ collectionName }. Second attempt resulted in error: ${ collectionCreateRetryResult }`);
            }

            break;
    }
}

run();
