
import "regenerator-runtime/runtime";

import TransportU2F from "@ledgerhq/hw-transport-u2f";

export async function createTransport() {
    const transport = await TransportU2F.create();
    transport.setScrambleKey("NEAR");
    return transport;
}

export async function createClient() {
    const transport = await createTransport();
    return {
        transport,
        async getVersion() {
            const response = await this.transport.send(0x80, 6, 0, 0);
            const [major, minor, patch] = Array.from(response);
            return `${major}.${minor}.${patch}`;
        }
    }
}




Object.assign(window, { createTransport, createClient });