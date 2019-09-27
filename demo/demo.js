import { listen } from "@ledgerhq/logs";

import { createTransport, createClient } from "../"

listen(console.log);

Object.assign(window, { createTransport, createClient });

createClient().then(client => window.client = client)
