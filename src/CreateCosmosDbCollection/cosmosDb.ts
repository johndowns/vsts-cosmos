import { DocumentClient, UriFactory, UniqueId, CollectionPartitionKey, Collection } from 'documentdb';

export async function databaseExistsAsync(
    accountEndpoint: string,
    accountKey: string, 
    databaseName: string)
    : Promise<boolean> {
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let databaseLink = UriFactory.createDatabaseUri(databaseName);

    return new Promise<boolean>(function(resolve, reject) {
        client.readDatabase(databaseLink,
            {},
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve(true);
                }
                else if (error && error.code == 404) {
                    resolve(false);
                }
                else {
                    reject(`Check database exist operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}

export async function createDatabaseAsync(
    accountEndpoint: string,
    accountKey: string,
    databaseName: string)
    : Promise<void> {
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    return new Promise<void>(function(resolve, reject) {
        client.createDatabase({ id: databaseName }, 
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve();
                } else {
                    reject(`Create database operation failed with error code '${error.code}', body '${error.body}'.`);
                }
            });
    });
}

export async function collectionExistsAsync(
    accountEndpoint: string,
    accountKey: string, 
    databaseName: string,
    collectionName: string)
    : Promise<boolean> {
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });
    let collectionLink = UriFactory.createDocumentCollectionUri(databaseName, collectionName);

    return new Promise<boolean>(function(resolve, reject) {
        client.readCollection(collectionLink,
            {},
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve(true);
                }
                else if (error && error.code == 404) {
                    resolve(false);
                }
                else {
                    reject(`Check collection exist operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}

export async function createCollectionAsync(
    accountEndpoint: string,
    accountKey: string,
    databaseName: string,
    collectionName: string,
    collectionStorageCapacity: string,
    collectionThroughput: number,
    collectionPartitionKey?: string)
    : Promise<CreateCollectionResult> {
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    var collection: Collection = {
        id: collectionName
    };

    if (collectionPartitionKey) {
        collection.partitionKey = {
            paths: [ collectionPartitionKey ],
            kind: "Hash"
        };
    }

    let databaseLink = UriFactory.createDatabaseUri(databaseName);

    return new Promise<CreateCollectionResult>(function(resolve, reject) {
        client.createCollection(databaseLink, 
            collection,
            { offerThroughput: collectionThroughput },
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve(CreateCollectionResult.Success);
                } else {
                    reject(`Create collection operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        });
}

export const enum CreateCollectionResult {
    Success = "Success",
    CollectionAlreadyExists = "CollectionAlreadyExists",
    DatabaseDoesNotExist = "DatabaseDoesNotExist"
}
