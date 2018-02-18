import { DocumentClient, UriFactory, Collection, Procedure, Trigger, TriggerOperation, TriggerType, UserDefinedFunction } from 'documentdb';

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

export async function triggerExistsAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string,
    triggerId: string): Promise<boolean> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let triggerLink = UriFactory.createTriggerUri(databaseId, collectionId, triggerId);

    return new Promise<boolean>(function(resolve, reject) {
        client.readTrigger(triggerLink, 
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve(true);
                } else if (error && error.code == 404) {
                    resolve(false);
                } else {
                    reject(`Check trigger exists operation failed with error code '${error.code}', body '${error}'.`);
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

export async function createTriggerAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string,
    triggerId: string,
    triggerScript: string,
    triggerType: TriggerType,
    triggerOperation: TriggerOperation)
    : Promise<void> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let collectionLink = UriFactory.createDocumentCollectionUri(databaseId, collectionId);

    return new Promise<void>(function(resolve, reject) {
        client.createTrigger(collectionLink, 
            {
                id: triggerId,
                body: triggerScript,
                triggerType: triggerType,
                triggerOperation: triggerOperation
            },
            {},
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve();
                }
                else {
                    reject(`Create trigger operation failed with error code '${error.code}', body '${error}'.`);
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

export async function replaceTriggerAsync(
    accountName: string,
    accountKey: string, 
    databaseId: string,
    collectionId: string,
    triggerId: string,
    triggerScript: string,
    triggerType: TriggerType,
    triggerOperation: TriggerOperation)
    : Promise<void> {
    var accountEndpoint = `https://${accountName}.documents.azure.com`;
    var client = new DocumentClient(accountEndpoint, {
        masterKey: accountKey
    });

    let triggerLink = UriFactory.createTriggerUri(databaseId, collectionId, triggerId);

    return new Promise<void>(function(resolve, reject) {
        client.replaceTrigger(triggerLink, 
            {
                id: triggerId,
                body: triggerScript,
                triggerType: triggerType,
                triggerOperation: triggerOperation
            },
            {},
            (error, resource, responseHeaders) => {
                if (resource) {
                    resolve();
                }
                else {
                    reject(`Replace trigger operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}
