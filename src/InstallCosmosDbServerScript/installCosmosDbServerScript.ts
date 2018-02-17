import task = require('vsts-task-lib/task');
import toolRunnerModule = require('vsts-task-lib/toolrunner');
import * as cosmos from './cosmosDb'
import * as azureRm from './azureRm'

async function run() {
    try {
        // get the inputs
        let authenticationType = task.getInput("authenticationType", true);
        let accountName = task.getInput("accountName", true);
        var accountKey = task.getInput("accountKey");
        let collectionName = task.getInput("collectionName", true);
        let databaseName = task.getInput("databaseName", true);
        let scriptId = task.getInput("scriptId", true);
        let scriptFile = task.getPathInput("scriptFilePath", true, true);
        let scriptType = task.getInput("scriptType", true);
        let triggerType = task.getInput("triggerType");
        let triggerOperation = task.getInput("triggerOperation");
        let behaviourIfExists = task.getInput('behaviourIfExists');

        // validate the inputs
        if (scriptType == "trigger" && (triggerType == undefined) || (triggerType == "")) {
            throw new Error("A trigger must have a `Trigger type` specified.")
        }
        if (scriptType == "trigger" && (triggerOperation == undefined) || (triggerOperation == "")) {
            throw new Error("A trigger must have a `Trigger operation` specified.")
        }

        // get authentication key
        if (authenticationType == "arm") {
            var resourceGroupName = task.getInput("resourceGroupName", true);

            var connectedService: string = task.getInput("armService", true);
            var servicePrincipalClientId: string = task.getEndpointAuthorizationParameter(connectedService, "serviceprincipalid", false);
            var servicePrincipalClientSecret: string = task.getEndpointAuthorizationParameter(connectedService, "serviceprincipalkey", false);
            var tenantId: string = task.getEndpointAuthorizationParameter(connectedService, "tenantid", false);
            var subscriptionId: string = task.getEndpointDataParameter(connectedService, "SubscriptionId", true);
    
            console.log(`Retrieving key for Cosmos DB account '${accountName}'...`);
            accountKey = await azureRm.getCosmosDbAccountKey(servicePrincipalClientId, servicePrincipalClientSecret, tenantId, subscriptionId, resourceGroupName, accountName);
        } else if (authenticationType == "key") {
            if ((accountKey == undefined) || (accountKey == "")) {
                throw new Error("Account key must be specified.");
            }
        } else {
            throw new Error("Authentication type must either be 'Azure Resource Manager' or 'Cosmos DB account key or SAS token'.")
        }

        // run the main logic
        console.log('TODO creating...');

        task.setResult(task.TaskResult.Succeeded, null);
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err);
    }
}

run();
