import "regenerator-runtime/runtime";

import { listen } from "@ledgerhq/logs";
import bs58 from "bs58";

import { createClient, getSupportedTransport, setDebugLogging } from "../";

setDebugLogging(true);
listen(console.log);

window.ledgerConnected = false;

async function createTransport() {
    const transport = await getSupportedTransport();
    transport.setScrambleKey("NEAR");
    return transport;
}

function updateLedgerConnectedBanner() {
    document.getElementById('ledgerStatus').innerHTML = window.ledgerConnected ? "Ledger Connected" : "Ledger Not Connected"
}

Object.assign(window, {
    initialize: async function initialize() {
        const transport = await createTransport();
        transport.on('disconnect', (...args) => {
            console.log('Ledger disconnected', ...args);
            window.ledgerConnected = false;
            updateLedgerConnectedBanner()
        });

        const client = await createClient(transport);

        Object.assign(window, { transport, client, ledgerConnected: true });
        updateLedgerConnectedBanner()
    },
    createClient,
    createTransport,
    bs58,
    Buffer
});
