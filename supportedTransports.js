const { default: LedgerTransportU2F } = require('@ledgerhq/hw-transport-u2f');
const { default: LedgerTransportWebUsb } = require('@ledgerhq/hw-transport-webusb');
const { default: LedgerTransportWebHid } = require('@ledgerhq/hw-transport-webhid');
const platform = require('platform');

let ENABLE_DEBUG_LOGGING = false;
const debugLog = (...args) => {
    ENABLE_DEBUG_LOGGING && console.log(...args)
};

// Fallback order inspired by https://github.com/vacuumlabs/adalite
async function isWebUsbSupported() {
    try {
        const isSupported = await LedgerTransportWebUsb.isSupported();
        return isSupported && platform.os.family !== 'Windows' && platform.name !== 'Opera';
    } catch (e) {
        return false;
    }
}

async function isWebHidSupported() {
    return LedgerTransportWebHid.isSupported()
        .catch(() => false);
}

async function isU2fSupported() {
    return LedgerTransportU2F.isSupported()
        .catch(() => false);
}

async function createSupportedTransport() {
    const [
        supportWebHid,
        supportWebUsb,
        supportU2f
    ] = await Promise.all([
        isWebHidSupported(),
        isWebUsbSupported(),
        isU2fSupported()
    ]);

    debugLog("Transports supported:", { supportWebHid, supportWebUsb, supportU2f });

    if (!supportWebHid && !supportWebUsb && !supportU2f) {
        const err = new Error('No transports appear to be supported.');
        err.name = 'NoTransportSupported';
        throw err;
    }

    // Sometimes transports return true for `isSupported()`, but are proven broken when attempting to `create()` them.
    // We will try each transport we think is supported in the current environment, in order of this array
    const supportedTransports = [
        // WebHID is still supported by latest Chrome, so try that first
        ...(supportWebHid ? [{ name: 'WebHID', createTransport: () => LedgerTransportWebHid.create() }] : []),

        ...(supportWebUsb ? [{ name: 'WebUSB', createTransport: () => LedgerTransportWebUsb.create() }] : []),

        // Firefox/Mozilla intend to not support WebHID or WebUSB
        ...(supportU2f ? [{ name: 'U2F', createTransport: () => LedgerTransportU2F.create() }] : []),
    ]

    let transport = null;
    let errors = [];

    for (let i = 0; i < supportedTransports.length && !transport; i += 1) {
        const { name, createTransport } = supportedTransports[i];
        debugLog(`Creating ${name} transport`)
        try {
            transport = await createTransport();
        } catch (err) {
            // If the user clicked the `cancel` button, stop attempting fallbacks
            if (err.name === 'TransportOpenUserCancelled') {
                throw err;
            }

            console.warn(`Failed to create ${name} transport.`, err);
            errors.push({ name: err.name, message: err.message });
        }
    }

    return [errors, transport];
}

module.exports.setDebugLogging = (value) => ENABLE_DEBUG_LOGGING = value;
module.exports.getSupportedTransport = async function getSupportedTransports() {
    const [errors, transport] = await createSupportedTransport();

    if (errors && !transport) {
        console.error('Failed to initialize ledger transport', { errors });
        throw errors[errors.length - 1];
    }

    if (transport) { debugLog('Ledger transport created!', transport); }

    return transport;
}
