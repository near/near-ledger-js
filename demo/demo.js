import "regenerator-runtime/runtime";

import { listen } from "@ledgerhq/logs";
import bs58 from "bs58";

import { createClient, getSupportedTransport, setDebugLogging } from "../";

setDebugLogging(true);
listen(console.log);

Object.assign(window, {
    nearLedger: {
        available: false,
        disconnectHandler: null,

        handleDisconnect: function handleDisconnect(reason) {
            console.log('ledger disconnected', reason);
            this.setLedgerAvailableStatus(false);
        },
        setLedgerAvailableStatus: function setLedgerAvailableStatus(status) {
            this.available = status;

            const statusMessage = this.available ? "Ledger client available" : "Ledger client not available";
            document.getElementById('ledgerStatus').innerHTML = statusMessage;
            console.log(statusMessage);
        },
        initialize: async function initialize() {
            if (this.transport) {
                if (this.transport.close) {
                    console.log('Closing transport');
                    try {
                        this.transport.close && this.transport.close();
                    } catch (e) {
                        console.warn('Failed to close existing transport', e);
                    } finally {
                        this.transport.off('disconnect', this.disconnectHandler);
                    }
                }

                delete this.transport;
                delete this.client;
            }

            this.setLedgerAvailableStatus(false);

            this.transport = await this.createTransport();
            this.disconnectHandler = (...args) => this.handleDisconnect(...args)
            this.transport.on('disconnect', this.disconnectHandler);

            this.client = await this.createClient(this.transport);

            this.setLedgerAvailableStatus(true);
        },
        createClient,
        createTransport: async function createTransport() {
            const transport = await getSupportedTransport();
            transport.setScrambleKey("NEAR");
            return transport;
        },
        bs58,
        Buffer
    }
});
