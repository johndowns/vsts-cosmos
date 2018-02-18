import { DocumentClient, UriFactory, UniqueId, CollectionPartitionKey, Collection } from 'documentdb';

export async function databaseExistsAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string)
    : Promise<boolean> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let databaseLink = UriFactory.createDatabaseUri(databaseId);

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
    accountName: string,
    accountKey: string,
    databaseId: string)
    : Promise<void> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    return new Promise<void>(function(resolve, reject) {
        client.createDatabase({ id: databaseId }, 
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
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string)
    : Promise<boolean> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;

    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });
    let collectionLink = UriFactory.createDocumentCollectionUri(databaseId, collectionId);

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
    accountName: string,
    accountKey: string,
    databaseId: string,
    collectionId: string,
    collectionStorageCapacity: string,
    collectionThroughput: number,
    collectionPartitionKey?: string)
    : Promise<void> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;

    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    var collection: Collection = {
        id: collectionId
    };

    if (collectionPartitionKey) {
        collection.partitionKey = {
            paths: [ collectionPartitionKey ],
            kind: "Hash"
        };
    }

    let databaseLink = UriFactory.createDatabaseUri(databaseId);

    return new Promise<void>(function(resolve, reject) {
        client.createCollection(databaseLink, 
            collection,
            { offerThroughput: collectionThroughput },
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve();
                } else {
                    reject(`Create collection operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        });
}
