# near-ledger-js 

A JavaScript library for communication with [Ledger](https://www.ledger.com/) Hardware Wallet.

# Example usage
```javascript
  import { createClient, getSupportedTransport } from "near-ledger-js";
  
  const transport = await getSupportedTransport();
  transport.setScrambleKey("NEAR");
  
  transport.on('disconnect', () => {...});
```

In an onClick handler:
```javascript
  const client = await createClient(transport);
  // If no error thrown, ledger is available. NOTE: U2F transport will still get here even if device is not present 
```

To see debug logging for `getSupportedTransport()`, import `setDebugLogging()` and call `setDebugLogging(true)` before using the package.

# How to run demo project
1. `yarn` to install dependencies
2. `yarn start` to start local server with Parcel
3. Open https://localhost:1234 in your browser
4. Open browser console
5. Try examples shown on the page

# License

This repository is distributed under the terms of both the MIT license and the Apache License (Version 2.0).
See [LICENSE](LICENSE) and [LICENSE-APACHE](LICENSE-APACHE) for details.
