# Building a Hive Web3 Wallet: Authentication & Transaction Flow  
**Difficulty:** Intermediate  
**Length:** ~2,300 words  
**Audience:** Developers who already know JavaScript/Node.js and want to build a Web3‑compatible wallet that works on Hive.

---

## Table of Contents

1. [Introduction](#introduction)  
2. [Prerequisites](#prerequisites)  
3. [Understanding Hive Web3 Concepts](#understanding-hive-web3-concepts)  
4. [Setting Up the Wallet SDK](#setting-up-the-wallet-sdk)  
5. [User Authentication Flow](#user-authentication-flow)  
6. [Constructing & Signing Transactions](#constructing--signing-transactions)  
7. [Handling Broadcast & Confirmation](#handling-broadcast--confirmation)  
8. [Practical Tips & Best Practices](#practical-tips--best-practices)  
9. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)  
10. [Conclusion & Next Steps](#conclusion--next-steps)

---

## Introduction

Hive is a proof‑of‑stake blockchain that powers a vibrant ecosystem of social apps, games, and marketplaces. While the original Hive experience was built around a traditional Web2 stack—REST APIs, JSON payloads, and manual key management—Hive Web3 is a new paradigm that lets developers build **decentralized, permission‑less** wallets that can authenticate users, sign transactions, and interact with the chain without exposing private keys.

In this tutorial we’ll walk through a complete flow:

* Set up a lightweight wallet SDK (HiveKeychain + HiveSigner).  
* Authenticate users via the browser extension or mobile app.  
* Build, sign, and broadcast a Hive transaction (e.g., a transfer).  
* Poll the transaction status until it’s confirmed.  

By the end you’ll have a working prototype that you can extend into a full‑featured Web3 wallet or integrate into an existing dApp.

> **Why Hive Web3?**  
> * **Security** – Keys stay in the user’s wallet app, never in your server.  
> * **User experience** – One click login, instant transaction approval.  
> * **Ecosystem support** – HiveKeychain, HiveSigner, HiveAuth, and the Hive API network provide a rich set of tools.

---

## Prerequisites

| Item | What you need |
|------|---------------|
| **Node.js** | v18+ (LTS) |
| **npm or yarn** | Package manager |
| **Hive account** | Create a testnet account on <https://testnet.hive.blog> |
| **HiveKeychain extension** | <https://chrome.google.com/webstore/detail/hivekeychain/ghklnkjnlmljgojdgkchhnhcplgkecjl> |
| **HiveSigner mobile app** | (Optional) for mobile authentication |

> **Tip:** Use the Hive testnet to experiment. Mainnet transactions cost real HIVE, so keep a small amount on testnet for testing.

---

## Understanding Hive Web3 Concepts

| Concept | What it means | Why it matters |
|---------|---------------|----------------|
| **Accounts** | Hive accounts are user‑controlled, each with a public/private key pair. | All actions (posting, voting, transferring) are signed by the owner/key. |
| **Keys** | 4 key types: *owner*, *active*, *memo*, *posting*. | *Active* key is used for transfers, *posting* for content. |
| **Web3 SDKs** | Libraries that abstract away REST calls and key handling. | Makes it easier to build wallets and dApps. |
| **Broadcast API** | `<https://api.hive.blog>` endpoint that accepts signed operations. | The only way to submit a transaction. |
| **Transaction Status API** | `<https://api.hive.blog/get_transaction>` | Lets you query the blockchain for the outcome. |
| **HiveKeychain** | Browser extension that stores keys and signs on demand. | No need to handle raw keys in your code. |
| **HiveSigner** | Mobile app that signs via QR code or deep link. | Works on mobile, no extension needed. |
| **HiveAuth** | A lightweight library that talks to HiveKeychain/HiveSigner. | Handles authentication flow in a few lines. |

> **Key takeaway**: In Web3 you never expose the private key; you ask the wallet to sign the transaction and then broadcast the signed payload.

---

## Setting Up the Wallet SDK

We’ll use **`hive-auth`** as the core library. It works with HiveKeychain and HiveSigner out of the box.

```bash
# Create a new project
mkdir hive-web3-wallet && cd hive-web3-wallet
npm init -y

# Install dependencies
npm i hive-auth axios
```

### Directory structure

```
hive-web3-wallet/
├─ src/
│  ├─ auth.js
│  ├─ transaction.js
│  └─ index.js
├─ package.json
└─ README.md
```

> **Why `axios`?**  
> `hive-auth` only handles signing; we use `axios` to broadcast and query the Hive API.

---

## User Authentication Flow

### 1. Import & Configure HiveAuth

```js
// src/auth.js
import { HiveAuth } from 'hive-auth';

const hiveAuth = new HiveAuth({
  appName: 'HiveWeb3Wallet',          // Name displayed in the wallet
  callbackUrl: window.location.origin, // Where the wallet will redirect after auth
  network: 'hive',                    // 'hive' or 'hive_testnet'
  // Optional: specify the keys you need
  requiredAuth: {
    active: true,
    posting: false,
    memo: false,
  },
});

export default hiveAuth;
```

> **Tip**: For the testnet you can set `network: 'hive_testnet'`. For mainnet, just use `'hive'`.

### 2. Trigger Authentication

```js
// src/index.js
import hiveAuth from './auth';

async function login() {
  try {
    const { username, keychain } = await hiveAuth.login();
    console.log('Logged in as', username);
    // Store the keychain object for future signing
    window.keychain = keychain;
  } catch (err) {
    console.error('Auth failed', err);
  }
}

document.getElementById('loginBtn').onclick = login;
```

> **What happens under the hood?**  
> `HiveAuth` opens the HiveKeychain popup or HiveSigner QR, asks for the *active* key, and returns a `Keychain` instance that can sign later.

### 3. Persisting Session

You can store the `username` in `localStorage` or a cookie. The `Keychain` object is not serializable, so you’ll need to re‑authenticate on page reload. For a production app, consider using a lightweight session token or a JWT issued by your backend after verifying the signature.

---

## Constructing & Signing Transactions

### 1. Build a Transfer Operation

```js
// src/transaction.js
export function createTransferOp(from, to, amount, memo = '') {
  return {
    account: 'transfer',
    name: 'transfer',
    json: {
      from,
      to,
      amount,   // e.g., "10.000 HIVE"
      memo,
    },
  };
}
```

### 2. Assemble the Transaction

```js
// src/transaction.js
export function buildTx(op, requiredAuth = ['active']) {
  return {
    expiration: new Date(Date.now() + 60 * 1000).toISOString(), // 60s expiration
    ref_block_num: 0, // Will be filled by HiveAuth
    ref_block_prefix: 0, // Will be filled by HiveAuth
    operations: [op],
    extensions: [],
    block_num: 0, // Will be filled by HiveAuth
    transaction_id: '',
  };
}
```

> **Why set expiration?**  
> Hive requires a transaction to expire within ~2 minutes. We use 60 s for safety.

### 3. Sign the Transaction

```js
// src/index.js
import { createTransferOp } from './transaction';

async function transfer() {
  const to = document.getElementById('to').value;
  const amount = document.getElementById('amount').value; // e.g., "5.000 HIVE"
  const memo = document.getElementById('memo').value;

  const op = createTransferOp(window.keychain.username, to, amount, memo);

  // HiveAuth will fetch ref_block_num/prefix and sign
  const signedTx = await hiveAuth.signTransaction([op], { requiredAuth: ['active'] });

  // Broadcast the signed transaction
  broadcastTx(signedTx);
}

document.getElementById('transferBtn').onclick = transfer;
```

> **Behind the scenes**  
> `hiveAuth.signTransaction`:
> 1. Calls `api.getDynamicGlobalProperties` to get the latest block.  
> 2. Fills `ref_block_num` and `ref_block_prefix`.  
> 3. Calls the wallet extension to sign the transaction.  
> 4. Returns the signed transaction ready for broadcast.

---

## Handling Broadcast & Confirmation

### 1. Broadcast the Signed Transaction

```js
// src/index.js
import axios from 'axios';

async function broadcastTx(signedTx) {
  const apiUrl = 'https://api.hive.blog'; // Use testnet API if needed

  try {
    const res = await axios.post(`${apiUrl}/r/broadcast/transaction`, {
      transaction: signedTx,
    });

    console.log('Broadcast response', res.data);
    const txId = res.data.result.txid;
    pollTxStatus(txId);
  } catch (err) {
    console.error('Broadcast error', err.response?.data || err.message);
  }
}
```

### 2. Poll for Confirmation

```js
// src/index.js
async function pollTxStatus(txId) {
  const apiUrl = 'https://api.hive.blog';
  const pollInterval = 1500; // 1.5s

  const interval = setInterval(async () => {
    try {
      const res = await axios.get(`${apiUrl}/get_transaction`, {
        params: { id: txId },
      });

      if (res.data.result && res.data.result.block_num) {
        console.log('Transaction confirmed in block', res.data.result.block_num);
        clearInterval(interval);
        alert('✅ Transfer successful!');
      }
    } catch (err) {
      console.warn('Polling error', err.message);
    }
  }, pollInterval);
}
```

> **Why poll?**  
> Hive doesn’t push transaction notifications. Polling is the simplest way to detect confirmation.  
> For production, consider using a WebSocket provider or Hive's `witness` API for real‑time updates.

---

## Practical Tips & Best Practices

| Tip | Why it matters |
|-----|----------------|
| **Use testnet first** | Avoid losing real HIVE during development. |
| **Keep the UI responsive** | Disable buttons while waiting for auth/transaction to prevent double submissions. |
| **Validate amounts** | Ensure amounts have 3 decimal places and correct symbol. |
| **Handle timeouts** | Set a max waiting time for polling (e.g., 2 min) and fallback to error. |
| **Use HTTPS** | All API calls must be over HTTPS to avoid MITM. |
| **Store only the username** | Never persist the `Keychain` object or private keys on the client. |
| **Log errors to an analytics service** | Helps diagnose issues in production. |
| **Use `async/await`** | Improves readability compared to callbacks. |
| **Leverage environment variables** | Keep API URLs and app names configurable. |

---

## Common Pitfalls to Avoid

| Pitfall | Fix |
|---------|-----|
| **Using the wrong network** | Set `network: 'hive_testnet'` for testnet. |
| **Missing key permissions** | Ensure the wallet has granted *active* key permission. |
| **Incorrect expiration** | Use `new Date(Date.now() + 60 * 1000)` to set 60‑second expiration. |
| **Not handling errors** | Wrap async calls in `try/catch` and display user‑friendly messages. |
| **Exposing private keys** | Never log or store raw keys. |
| **Polling too frequently** | 1–2 s is enough; too frequent can hit rate limits. |
| **Ignoring memo encoding** | Memo must be plain text; HiveKeychain will encrypt it if the memo key is present. |
| **Using old API endpoints** | Always use the latest Hive API URLs (e.g., `https://api.hive.blog`). |

---

## Conclusion & Next Steps

You’ve now built a **minimal Hive Web3 wallet** that:

1. Authenticates users via HiveKeychain/HiveSigner.  
2. Builds, signs, and broadcasts Hive transactions.  
3. Polls the blockchain for confirmation.

### What’s Next?

| Idea | How to implement |
|------|------------------|
| **Add UI Framework** | Wrap the logic in React/Vue/Angular for a polished UI. |
| **Support Multiple Operations** | Add voting, posting, or custom ops. |
| **Integrate HiveEngine** | Use `hive-engine` endpoints to trade tokens. |
| **Add QR Code Signatures** | Use HiveSigner on mobile for QR‑based login. |
| **Implement WebSocket Notifications** | Subscribe to `<https://api.hive.blog/ws>` for real‑time updates. |
| **Add Error Tracking** | Integrate Sentry or LogRocket. |
| **Add Multi‑account Support** | Let users switch between accounts without re‑authenticating. |

> **Final thought** – The Hive Web3 stack is still evolving. Keep an eye on the official docs and community channels (Discord, Twitter, HiveEngine forums) for updates. Happy coding! 🚀

---

### Resources

- **Hive Docs** – <https://developers.hive.io>  
- **HiveKeychain** – <https://chrome.google.com/webstore/detail/hivekeychain/ghklnkjnlmljgojdgkchhnhcplgkecjl>  
- **HiveSigner** – <https://hivesigner.com>  
- **HiveAuth Library** – <https://github.com/hiveio/hive-auth>  
- **Hive API Reference** – <https://api.hive.blog>  
- **Hive Engine** – <https://hiveengine.com>  

Happy hacking!