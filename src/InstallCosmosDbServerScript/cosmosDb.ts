import { DocumentClient, UriFactory, Collection, Procedure, Trigger, UserDefinedFunction } from 'documentdb';

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
        client.upsertUserDefinedFunction(collectionLink, 
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
                    reject(`Upsert user-defined function operation failed with error code '${error.code}', body '${error}'.`);
                }
            });
        }
    );
}
