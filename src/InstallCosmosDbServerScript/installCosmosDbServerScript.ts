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
        if (scriptType == "trigger") {
            if (triggerType != "Pre" && triggerType != "Post") {
                throw new Error("Trigger type must be either 'Pre' or 'Post.");
            }
            if (triggerOperation != "All" && triggerOperation != "Create" && triggerOperation != "Update" && triggerOperation != "Delete" && triggerOperation != "Replace") {
                throw new Error("Trigger operation must be one of 'All', 'Create', 'Update', 'Delete', or 'Replace'.");
            }
            await installCosmosDbServerScript(accountName, accountKey, databaseId, collectionId, scriptId, scriptFilePath, scriptType, triggerType, triggerOperation);
        }
        else {
            await installCosmosDbServerScript(accountName, accountKey, databaseId, collectionId, scriptId, scriptFilePath, scriptType);
        }

        task.setResult(task.TaskResult.Succeeded, null);
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err);
    }
}

async function installCosmosDbServerScript(accountName: string, accountKey: string, databaseId: string, collectionId: string, scriptId: string, scriptFilePath: string, scriptType: string, triggerType?: "Pre" | "Post", triggerOperation?: "All" | "Create" | "Update" | "Delete" | "Replace") {
    var scriptFileContents = fs.readFileSync(scriptFilePath).toString()

    var scriptExists: boolean;
    switch (scriptType) {
        case "udf":
            console.log(`Checking if user-defined function '${scriptId}' exists in collection '${collectionId}'...`);
            scriptExists = await cosmos.udfExistsAsync(accountName, accountKey, databaseId, collectionId, scriptId);
            break;
        case "storedprocedure":
            console.log(`Checking if stored procedure '${scriptId}' exists in collection '${collectionId}'...`);
            scriptExists = await cosmos.storedProcedureExistsAsync(accountName, accountKey, databaseId, collectionId, scriptId);
            break;
        case "trigger":
            console.log(`Checking if trigger '${scriptId}' exists in collection '${collectionId}'...`);
            scriptExists = await cosmos.triggerExistsAsync(accountName, accountKey, databaseId, collectionId, scriptId);
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
            case "storedprocedure":
                console.log('Stored procedure does not exist.');
                console.log(`Installing stored procedure '${scriptId}' into collection '${collectionId}'...`)
                await cosmos.createStoredProcedureAsync(accountName, accountKey, databaseId, collectionId, scriptId, scriptFileContents);
                break;
            case "trigger":
                console.log('Trigger does not exist.');
                console.log(`Installing ${triggerType}-trigger '${scriptId}' for operation '${triggerOperation}' into collection '${collectionId}'...`)
                await cosmos.createTriggerAsync(accountName, accountKey, databaseId, collectionId, scriptId, scriptFileContents, triggerType, triggerOperation);
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
            case "storedprocedure":
                console.log('Stored procedure already exists.');
                console.log(`Replacing stored procedure '${scriptId}' in collection '${collectionId}'...`)
                await cosmos.replaceStoredProcedureAsync(accountName, accountKey, databaseId, collectionId, scriptId, scriptFileContents);
                break;
            case "trigger":
                console.log('Trigger already exists.');
                console.log(`Replacing ${triggerType}-trigger '${scriptId}' for operation '${triggerOperation}' in collection '${collectionId}'...`)
                await cosmos.replaceTriggerAsync(accountName, accountKey, databaseId, collectionId, scriptId, scriptFileContents, triggerType, triggerOperation);
                break;
            default:
                throw new Error(`Script type ${scriptType} not recognised`);
        }
    }
}

run();
