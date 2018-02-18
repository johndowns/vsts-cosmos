import { DocumentClient, UriFactory, Collection, Procedure, Trigger, UserDefinedFunction } from 'documentdb';

export async function udfExistsAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string,
    udfId: string): Promise<boolean> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let udfLink = UriFactory.createUserDefinedFunctionUri(databaseId, collectionId, udfId);

    return new Promise<boolean>(function(resolve, reject) {
        client.readUserDefinedFunction(udfLink, 
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve(true);
                } else if (error && error.code == 404) {
                    resolve(false);
                } else {
                    reject(`Check UDF exists operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}

export async function storedProcedureExistsAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string,
    storedProcedureId: string): Promise<boolean> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let storedProcedureLink = UriFactory.createStoredProcedureUri(databaseId, collectionId, storedProcedureId);

    return new Promise<boolean>(function(resolve, reject) {
        client.readStoredProcedure(storedProcedureLink, 
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve(true);
                } else if (error && error.code == 404) {
                    resolve(false);
                } else {
                    reject(`Check stored procedure exists operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}

export async function createUdfAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string,
    udfId: string,
    udfScript: string): Promise<void> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let collectionLink = UriFactory.createDocumentCollectionUri(databaseId, collectionId);

    return new Promise<void>(function(resolve, reject) {
        client.createUserDefinedFunction(collectionLink, 
            {
                id: udfId,
                body: udfScript
            },
            {},
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve();
                }
                else {
                    reject(`Create user-defined function operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}

export async function createStoredProcedureAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string,
    storedProcedureId: string,
    storedProcedureScript: string): Promise<void> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let collectionLink = UriFactory.createDocumentCollectionUri(databaseId, collectionId);

    return new Promise<void>(function(resolve, reject) {
        client.createStoredProcedure(collectionLink, 
            {
                id: storedProcedureId,
                body: storedProcedureScript
            },
            {},
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve();
                }
                else {
                    reject(`Create stored procedure operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}

export async function replaceUdfAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string,
    udfId: string,
    udfScript: string): Promise<void> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let udfLink = UriFactory.createUserDefinedFunctionUri(databaseId, collectionId, udfId);

    return new Promise<void>(function(resolve, reject) {
        client.replaceUserDefinedFunction(udfLink, 
            {
                id: udfId,
                body: udfScript
            },
            {},
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve();
                }
                else {
                    reject(`Replace user-defined function operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}

export async function replaceStoredProcedureAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string,
    storedProcedureId: string,
    storedProcedureScript: string): Promise<void> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let storedProcedureLink = UriFactory.createStoredProcedureUri(databaseId, collectionId, storedProcedureId);

    return new Promise<void>(function(resolve, reject) {
        client.replaceStoredProcedure(storedProcedureLink, 
            {
                id: storedProcedureId,
                body: storedProcedureScript
            },
            {},
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve();
                }
                else {
                    reject(`Replace stored procedure operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}
