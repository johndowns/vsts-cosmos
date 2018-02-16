import CosmosDbManagementClient = require("azure-arm-cosmosdb");
import { ServiceClientCredentials } from 'ms-rest';
import MsRest = require('ms-rest-azure');

export async function getCosmosDbAccountKey(
    clientId: string,
    clientSecret: string,
    tenantId: string,
    subscriptionId: string, 
    resourceGroupName: string, 
    accountName: string)
    : Promise<string> {

    return new Promise<string>(function(resolve, reject) {
        MsRest.loginWithServicePrincipalSecret(clientId, clientSecret, tenantId,
            async (err, credentials) => {
                if (err) {
                    reject(err);
                }
    
                var client = new CosmosDbManagementClient(credentials, subscriptionId);
                try {
                    var keyResponse = await client.databaseAccounts.listKeys(resourceGroupName, accountName);
                    resolve(keyResponse.primaryMasterKey);
                }                
                catch (err) {
                    reject(err);
                }
            }
        );
    });
}
