import "regenerator-runtime/runtime";

import { listen } from "@ledgerhq/logs";
import bs58 from "bs58";

import { createClient, getSupportedTransport } from "../";

listen(console.log);

async function createTransport() {
    const transport = await getSupportedTransport();
    transport.setScrambleKey("NEAR");
    return transport;
}

Object.assign(window, {
    initialize: async function initialize() {
        const transport = await createTransport();
        const client = await createClient(transport);
        Object.assign(window, { transport, client });
    },
    createClient,
    createTransport,
    bs58,
    Buffer
});
