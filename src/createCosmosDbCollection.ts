import task = require('vsts-task-lib/task');
import toolRunnerModule = require('vsts-task-lib/toolrunner');
import { DocumentClient, UriFactory, UniqueId } from 'documentdb';
var client: DocumentClient = require('documentdb').DocumentClient;

async function run() {
    try {
        // get the inputs
        let accountEndpoint = task.getInput("collectionAccountEndpoint", true);
        let accountKey = task.getInput("connectionAccountKey", true); // TODO allow for Azure connection instead of key
        let collectionName = task.getInput("collectionName", true);
        let collectionDatabaseName = task.getInput("collectionDatabaseName", true);
        let collectionThroughput = task.getInput("collectionThroughput", true);
        let collectionStorageCapacity = task.getInput("collectionStorageCapacity", true);
        let collectionPartitionKey = task.getInput("collectionPartitionKey");
        let collectionCreateDatabaseIfNotExists = task.getBoolInput("collectionCreateDatabaseIfNotExists", true);
        let failIfExists = task.getBoolInput("failIfExists", true);

        // TODO validate

        let databaseLink = UriFactory.createDatabaseUri(collectionDatabaseName);

        // connect to Cosmos DB and initialise a DocumentClient
        client = new DocumentClient(accountEndpoint, {
            masterKey: accountKey
        });

        // try to create the collection
        task.debug(`Attempting to create collection '${collectionName}' in database '${collectionDatabaseName}'...`);
        var collectionCreateResult = await tryCreateCollectionAsync(databaseLink, collectionName);
        switch (collectionCreateResult) {
            case CreateCollectionResult.Success:
                task.debug(`Collection created successfully.`);
                break;

            case CreateCollectionResult.CollectionAlreadyExists:
                task.debug(`Collection already exists.`);
                if (failIfExists) {
                    throw new Error(`Collection ${ collectionName } already exists.`);
                }
                else {
                    // the task succeeded
                }
                break;

            case CreateCollectionResult.DatabaseDoesNotExist:
                // TODO handle collectionCreateDatabaseIfNotExists param
                task.debug(`Database does not exist. Creating database...`);
                var databaseCreateResult = createDatabaseAsync(collectionDatabaseName);
                
                task.debug(`Database created.`);
                task.debug(`Attempting to create collection '${collectionName}' in database '${collectionDatabaseName}'...`);
                var collectionCreateRetryResult = await tryCreateCollectionAsync(databaseLink, collectionName);
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

async function tryCreateCollectionAsync(databaseLink: string, collectionName: string): Promise<CreateCollectionResult> {
    return new Promise<CreateCollectionResult>(function(resolve, reject) {
        client.createCollection(databaseLink, 
            { id: collectionName },
            //{ offerThroughput: 1000, offerType: "TODO" },
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

async function createDatabaseAsync(databaseName: string) {
    return new Promise(function(resolve, reject) {
        client.createDatabase({ id: databaseName }, 
            (error, resource, responseHeaders) => {
                if (error) {
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
