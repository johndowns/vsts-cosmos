import fs = require('fs');
import iconv = require('iconv-lite');

const ENCODING_ASCII: string = 'ascii';
const ENCODING_UTF_7: string = 'utf-7';
const ENCODING_UTF_8: string = 'utf-8';
const ENCODING_UTF_16LE: string = 'utf-16le';
const ENCODING_UTF_16BE: string = 'utf-16be';

export function getFileContents(filePath: string): string {
    return iconv.decode(fs.readFileSync(filePath), getEncoding(filePath));
}

function getEncoding(filePath: string): string {
    // thanks to https://github.com/qetza/vsts-replacetokens-task/blob/master/task/index.ts
    let fd: number = fs.openSync(filePath, 'r');

    try
    {
        let bytes: Buffer = new Buffer(4);
        fs.readSync(fd, bytes, 0, 4, 0);

        let encoding: string = ENCODING_ASCII;
        if (bytes[0] === 0x2b && bytes[1] === 0x2f && bytes[2] === 0x76 && (bytes[3] === 0x38 || bytes[3] === 0x39 || bytes[3] === 0x2b || bytes[3] === 0x2f)) {
            encoding = ENCODING_UTF_7;
        } else if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
            encoding = ENCODING_UTF_8;
        } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
            encoding = ENCODING_UTF_16BE;
        } else if (bytes[0] === 0xff && bytes[1] === 0xfe) {
            encoding = ENCODING_UTF_16LE;
        } else {
            throw Error("File encoding not recognised.");
        }

        return encoding;
    }
    finally
    {
        fs.closeSync(fd);
    }
}