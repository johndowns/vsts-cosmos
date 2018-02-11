import task = require('vsts-task-lib/task');
import toolRunnerModule = require('vsts-task-lib/toolrunner');
import { DocumentClient, UriFactory, UniqueId, CollectionPartitionKey, Collection } from 'documentdb';
//var client: DocumentClient = require('documentdb').DocumentClient;

async function run() {
    try {
        // get the inputs
        let accountEndpoint = task.getInput("collectionAccountEndpoint", true);
        let accountKey = task.getInput("connectionAccountKey", true); // TODO allow for Azure connection instead of key
        let collectionName = task.getInput("collectionName", true);
        let collectionDatabaseName = task.getInput("collectionDatabaseName", true);
        let collectionThroughputInput = task.getInput("collectionThroughput", true);
        let collectionStorageCapacity = task.getInput("collectionStorageCapacity", true);
        let collectionPartitionKey = task.getInput("collectionPartitionKey");
        let collectionCreateDatabaseIfNotExists = task.getBoolInput("collectionCreateDatabaseIfNotExists", true);
        let failIfExists = task.getBoolInput("failIfExists", true);
        let databaseLink = UriFactory.createDatabaseUri(collectionDatabaseName);

        // validate the inputs
        // TODO validate conditionally required fields
        let collectionThroughput = Number(collectionThroughputInput);
        if (isNaN(collectionThroughput)) {
            throw new Error('Collection throughput must be a number.');
            // TODO test this
        }

        // initialise a DocumentClient for connecting to Cosmos DB
        var client = new DocumentClient(accountEndpoint, {
            masterKey: accountKey
        });

        // try to create the collection
        task.debug(`Attempting to create collection '${collectionName}' in database '${collectionDatabaseName}'...`);
        var collectionCreateResult = await tryCreateCollectionAsync(client, databaseLink, collectionName, collectionThroughput, collectionPartitionKey);
        switch (collectionCreateResult) {
            case CreateCollectionResult.Success:
                task.debug(`Collection created successfully.`);
                break;

            case CreateCollectionResult.CollectionAlreadyExists:
                task.debug(`Collection already exists.`);
                if (failIfExists) {
                    throw new Error(`Collection ${ collectionName } already exists.`);
                }
                break;

            case CreateCollectionResult.DatabaseDoesNotExist:
                if ( ! collectionCreateDatabaseIfNotExists) {
                    throw new Error(`Database ${ collectionDatabaseName } does not exist.`);
                }

                task.debug(`Database '${ collectionDatabaseName }' does not exist. Creating database...`);
                var databaseCreateResult = createDatabaseAsync(client, collectionDatabaseName);
                
                task.debug(`Database created.`);
                task.debug(`Re-attempting to create collection '${collectionName}' in database '${collectionDatabaseName}'...`);
                var collectionCreateRetryResult = await tryCreateCollectionAsync(client, databaseLink, collectionName, collectionThroughput, collectionPartitionKey);
                if (collectionCreateRetryResult == CreateCollectionResult.Success) {
                    task.debug(`Collection created successfully.`);
                } else {
                    throw new Error(`Cannot create collection ${collectionName}. Second attempt resulted in error: ${collectionCreateRetryResult}`);
                }

                break;
        }
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err.message);
    }
}

async function tryCreateCollectionAsync(client: DocumentClient, databaseLink: string, collectionName: string, collectionThroughput: number, collectionPartitionKey?: string): Promise<CreateCollectionResult> {
    return new Promise<CreateCollectionResult>(function(resolve, reject) {

        var collection: Collection = {
            id: collectionName
        };
        if (collectionPartitionKey) {
            collection.partitionKey = {
                paths: [ collectionPartitionKey ],
                kind: "Hash"
            };
        }

        client.createCollection(databaseLink, 
            collection,
            { offerThroughput: collectionThroughput },
            (error, resource, responseHeaders) => {
                if (! error) {
                    resolve(CreateCollectionResult.Success);
                } else if (error.code == 404) {
                    resolve(CreateCollectionResult.DatabaseDoesNotExist);
                } else if (error.code == 409) {
                    resolve(CreateCollectionResult.CollectionAlreadyExists);
                } else if (error) {
                    reject(`Create collection operation failed with error code '${error.code}', body '${error.body}'.`);
                }
            });
        });
}

async function createDatabaseAsync(client: DocumentClient, databaseName: string) {
    return new Promise(function(resolve, reject) {
        client.createDatabase({ id: databaseName }, 
            (error, resource, responseHeaders) => {
                if (! error) {
                    resolve();
                } else {
                    reject(`Create database operation failed with error code '${error.code}', body '${error.body}'.`);
                }
            });
    });
}

enum CreateCollectionResult {
    Success,
    CollectionAlreadyExists,
    DatabaseDoesNotExist
}

run();
