import "regenerator-runtime/runtime";

import TransportU2F from "@ledgerhq/hw-transport-u2f";
import { listen } from "@ledgerhq/logs";
import bs58 from "bs58";

import { createClient } from "../";

listen(console.log);

async function createTransport() {
    const transport = await TransportU2F.create();
    transport.setScrambleKey("NEAR");
    return transport;
}

Object.assign(window, { createClient, createTransport, bs58, Buffer });

(async () => {
    const transport = await createTransport();
    const client = await createClient(transport);
    Object.assign(window, { transport, client });
})().catch(console.error);
