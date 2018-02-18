import task = require('vsts-task-lib/task');
import toolRunnerModule = require('vsts-task-lib/toolrunner');
import * as cosmos from './cosmosDb'
import * as azureRm from './azureRm'
import fs = require('fs');

async function run() {
    try {
        // get the inputs
        let authenticationType = task.getInput("authenticationType", true);
        let accountName = task.getInput("accountName", true);
        var accountKey = task.getInput("accountKey");
        let collectionId = task.getInput("collectionId", true);
        let databaseId = task.getInput("databaseId", true);
        let scriptId = task.getInput("scriptId", true);
        let scriptFilePath = task.getPathInput("scriptFilePath", true, true);
        let scriptType = task.getInput("scriptType", true);
        let triggerType = task.getInput("triggerType");
        let triggerOperation = task.getInput("triggerOperation");

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
        await installCosmosDbServerScript(accountName, accountKey, databaseId, collectionId, scriptId, scriptFilePath, scriptType, triggerType, triggerOperation);

        task.setResult(task.TaskResult.Succeeded, null);
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err);
    }
}

async function installCosmosDbServerScript(accountName: string, accountKey: string, databaseId: string, collectionId: string, scriptId: string, scriptFilePath: string, scriptType: string, triggerType: string, triggerOperation: string) {
    var scriptFileContents = fs.readFileSync(scriptFilePath).toString()

    var scriptExists: boolean;
    switch (scriptType) {
        case "udf":
            console.log(`Checking if user-defined function '${scriptId}' exists in collection '${collectionId}'...`);
            scriptExists = await cosmos.udfExistsAsync(accountName, accountKey, databaseId, collectionId, scriptId);
            break;
        default:
            throw new Error(`Script type ${scriptType} not recognised`);
    }

    if (! scriptExists)
    {
        switch (scriptType) {
            case "udf":
                console.log('User-defined function does not exist.');
                console.log(`Installing user-defined function '${scriptId}' into collection '${collectionId}'...`)
                await cosmos.createUdfAsync(accountName, accountKey, databaseId, collectionId, scriptId, scriptFileContents);
                break;
            default:
                throw new Error(`Script type ${scriptType} not recognised`);
        }
    } else {
        switch (scriptType) {
            case "udf":
                console.log('User-defined function already exists.');
                console.log(`Replacing user-defined function '${scriptId}' in collection '${collectionId}'...`)
                await cosmos.replaceUdfAsync(accountName, accountKey, databaseId, collectionId, scriptId, scriptFileContents);
                break;
            default:
                throw new Error(`Script type ${scriptType} not recognised`);
        }
    }
}

run();
