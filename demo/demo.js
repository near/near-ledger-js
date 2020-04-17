import { listen } from "@ledgerhq/logs";
import bs58 from "bs58";

import { createTransport, createClient } from "../";

listen(console.log);

Object.assign(window, { createTransport, createClient, bs58, Buffer });

createClient().then(client => window.client = client);
