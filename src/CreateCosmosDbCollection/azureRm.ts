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

    console.log("1");
    return new Promise<string>(function(resolve, reject) {
        console.log("2");
        MsRest.loginWithServicePrincipalSecret(clientId, clientSecret, tenantId,
            async (err, credentials) => {
                if (err) {
                    console.log("3");
                    reject(err);
                }
    
                console.log("4");
                var client = new CosmosDbManagementClient(credentials, subscriptionId);
                var keyResponse = await client.databaseAccounts.listKeys(resourceGroupName, accountName);
                resolve(keyResponse.primaryMasterKey);
                console.log("5");
            }
        );
    });
}
