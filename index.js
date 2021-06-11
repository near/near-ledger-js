const { default: LedgerTransportU2F } = require('@ledgerhq/hw-transport-u2f');
const { default: LedgerTransportWebUsb } = require('@ledgerhq/hw-transport-webusb');
const { default: LedgerTransportWebHid } = require('@ledgerhq/hw-transport-webhid');
const platform = require('platform');

let ENABLE_DEBUG_LOGGING = false;
const debugLog = (...args) => {
    ENABLE_DEBUG_LOGGING && console.log(...args)
};

function bip32PathToBytes(path) {
    const parts = path.split('/');
    return Buffer.concat(
        parts
            .map(part => part.endsWith(`'`)
                ? Math.abs(parseInt(part.slice(0, -1))) | 0x80000000
                : Math.abs(parseInt(part)))
            .map(i32 => Buffer.from([
                (i32 >> 24) & 0xFF,
                (i32 >> 16) & 0xFF,
                (i32 >> 8) & 0xFF,
                i32 & 0xFF,
            ])));
}

const networkId = 'W'.charCodeAt(0);

const DEFAULT_PATH = "44'/397'/0'/0'/1'";

// Basic structure transferred from https://github.com/vacuumlabs/adalite
async function isWebUsbSupported() {
    const isSupported = await LedgerTransportWebUsb.isSupported();
    return isSupported && platform.os.family !== 'Windows' && platform.name !== 'Opera';
}

async function isWebHidSupported() {
    return LedgerTransportWebHid.isSupported();
}

module.exports.setDebugLogging = (value) => ENABLE_DEBUG_LOGGING = value;
module.exports.getSupportedTransport = async function getSupportedTransports() {
    let transport;

    try {
        debugLog('checking webHID support');
        const supportWebHid = await isWebHidSupported();
        debugLog('checking webUSB support');
        const supportWebUsb = await isWebUsbSupported();

        debugLog("Will try:", { supportWebUsb, supportWebHid });
        if (supportWebHid) {
            // WebHID is still supported by latest Chrome, so try that first
            transport = await LedgerTransportWebHid.create();
        } else if (supportWebUsb) {
            transport = await LedgerTransportWebUsb.create();
        } else {
            // Firefox/Mozilla intend to not support WebHID or WebUSB
            transport = await LedgerTransportU2F.create();
        }
    } catch (hwTransportError) {
        try {
            console.warn('failed to initialize transport! Will try U2F fallback...', { hwTransportError })
            // fallback to U2F in case of errors detecting or creating preferred transports
            transport = await LedgerTransportU2F.create();
        } catch (u2fTransportError) {
            console.error('Failed to initialize transport', {
                hwTransportError: { name: hwTransportError.name, message: hwTransportError.message },
                u2fTransportError: { name: u2fTransportError.name, message: u2fTransportError.message }
            });

            throw hwTransportError;
        }
    }

    debugLog('Transport created!', transport);
    return transport;
}

module.exports.createClient = async function createClient(transport) {
    return {
        transport,
        async getVersion() {
            const response = await this.transport.send(0x80, 6, 0, 0);
            const [major, minor, patch] = Array.from(response);
            return `${major}.${minor}.${patch}`;
        },
        async getPublicKey(path) {
            path = path || DEFAULT_PATH;
            const response = await this.transport.send(0x80, 4, 0, networkId, bip32PathToBytes(path));
            return Buffer.from(response.subarray(0, -2));
        },
        async sign(transactionData, path) {
            // NOTE: getVersion call allows to reset state to avoid starting from partially filled buffer
            const version = await this.getVersion();
            console.info('Ledger app version:', version);
            // TODO: Assert compatible versions

            path = path || DEFAULT_PATH;
            transactionData = Buffer.from(transactionData);
            // 128 - 5 service bytes
            const CHUNK_SIZE = 123
            const allData = Buffer.concat([bip32PathToBytes(path), transactionData]);
            for (let offset = 0; offset < allData.length; offset += CHUNK_SIZE) {
                const chunk = Buffer.from(allData.subarray(offset, offset + CHUNK_SIZE));
                const isLastChunk = offset + CHUNK_SIZE >= allData.length;
                const response = await this.transport.send(0x80, 2, isLastChunk ? 0x80 : 0, networkId, chunk);
                if (isLastChunk) {
                    return Buffer.from(response.subarray(0, -2));
                }
            }
        }
    }
}
