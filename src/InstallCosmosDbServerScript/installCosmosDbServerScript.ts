import task = require('vsts-task-lib/task');
import toolRunnerModule = require('vsts-task-lib/toolrunner');
import * as cosmos from './cosmosDb'
import * as azureRm from './azureRm'
import fs = require('fs');
import iconv = require('iconv-lite');

const ENCODING_ASCII: string = 'ascii';
const ENCODING_UTF_7: string = 'utf-7';
const ENCODING_UTF_8: string = 'utf-8';
const ENCODING_UTF_16LE: string = 'utf-16le';
const ENCODING_UTF_16BE: string = 'utf-16be';

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
        console.log('TODO creating...');
        await installCosmosDbServerScript(accountName, accountKey, databaseId, collectionId, scriptId, scriptFilePath, scriptType, triggerType, triggerOperation);

        task.setResult(task.TaskResult.Succeeded, null);
    }
    catch (err) {
        task.setResult(task.TaskResult.Failed, err);
    }
}

async function installCosmosDbServerScript(accountName: string, accountKey: string, databaseId: string, collectionId: string, scriptId: string, scriptFilePath: string, scriptType: string, triggerType: string, triggerOperation: string) {
    let scriptFileContents: string = iconv.decode(fs.readFileSync(scriptFilePath), getEncoding(scriptFilePath));

    if (scriptType == "udf") {
        console.log(`Installing user-defined function '${scriptId}' into collection '${collectionId}'...`)
        await cosmos.createUdfAsync(accountName, accountKey, databaseId, collectionId, scriptId, scriptFileContents);
    } else {
        throw new Error('TODO not supported type');
    }
}

var getEncoding = function (filePath: string): string {
    // thanks to https://github.com/qetza/vsts-replacetokens-task/blob/master/task/index.ts
    let fd: number = fs.openSync(filePath, 'r');

    try
    {
        let bytes: Buffer = new Buffer(4);
        fs.readSync(fd, bytes, 0, 4, 0);

        let encoding: string = ENCODING_ASCII;
        if (bytes[0] === 0x2b && bytes[1] === 0x2f && bytes[2] === 0x76 && (bytes[3] === 0x38 || bytes[3] === 0x39 || bytes[3] === 0x2b || bytes[3] === 0x2f))
            encoding = ENCODING_UTF_7;
        else if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)
            encoding = ENCODING_UTF_8
        else if (bytes[0] === 0xfe && bytes[1] === 0xff)
            encoding = ENCODING_UTF_16BE
        else if (bytes[0] === 0xff && bytes[1] === 0xfe)
            encoding = ENCODING_UTF_16LE
        else
            task.debug('BOM no found: default to ascii.');

        task.debug('encoding: ' + encoding);

        return encoding;
    }
    finally
    {
        fs.closeSync(fd);
    }
}

run();
