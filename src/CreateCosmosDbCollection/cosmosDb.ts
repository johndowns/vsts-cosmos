import { DocumentClient, UriFactory, UniqueId, CollectionPartitionKey, Collection } from 'documentdb';

export async function tryCreateCollectionAsync(accountEndpoint: string, accountKey: string, databaseName: string, collectionName: string, collectionStorageCapacity: string, collectionThroughput: number, collectionPartitionKey?: string): Promise<CreateCollectionResult> {
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
    // TODO collectionStorageCapacity

    let databaseLink = UriFactory.createDatabaseUri(databaseName);

    return new Promise<CreateCollectionResult>(function(resolve, reject) {
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
                    reject(`Create collection operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        });
}

export async function createDatabaseAsync(accountEndpoint: string, accountKey: string, databaseName: string): Promise<void> {
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    return new Promise<void>(function(resolve, reject) {
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

export const enum CreateCollectionResult {
    Success,
    CollectionAlreadyExists,
    DatabaseDoesNotExist
}
