
---

# Duino-JS Website Aggregator

This is a fork of [Duino-js](https://github.com/sys-256/Duino-js), made by Hoiboy19, under MIT license.

I've added a Node.js server that serves as the client to all web miners, in this case, the website visitors. The worker then chooses the 40 best ashes of them and sends the transactions to the Duino server.

## Usage

To use the miner:

- You must have Node and npm installed on your server. See [Node.js installation guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).
- Change "your Duinocoin username" and "webaggregator" in the `index.html`, `duino-js.js`, and `server.js` files to your preferences.
- Download all the files to your server folder (e.g., `duinocoin`). In this folder, open your terminal and type:
  ```bash
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout selfsigned.key -out selfsigned.crt
  ```
  This will install a self-signed certificate for SSL connection to your WebSocket server.
- In the same folder (`duinocoin`), run `npm install` to get all dependencies installed. Then run `npm install ws net` to ensure you have the WebSocket server installed on your Node server.
- Test by running:
  ```bash
  npm server.js
  ```
  You should see indications that the server is running on port 8443:
  ```bash
  WebSocket server is listening on port 8443
  HTTPS server is listening on port 8443
  Initializing 40 connections to Duinocoin server...
  ```

- Navigate to `http://yourserver.com/duinocoin`, and you should see a widget showing your DUCO username, your DUCO balance, the active miners working for you, the value of your wallet in TRON (TRX), and more.
- You can use this widget by placing an `<iframe>` tag pointing to its address anywhere in your HTML. Every visitor to this page will then become a miner for your DUCO wallet.

  ![DUCO Widget](https://github.com/frnck37/Duino-JS-website-agregator-/blob/main/ducowidget.png)

**Note:** You need a web server like Apache or NGINX to run it because Web Workers don't work on local files. It should work in production, as intended.

My  username on DUCOwallet is "cyclotronic", because, as you can imagine, i'm mining DUCO using my bicycle Generator !

### Options

The `threads` variable is pretty customizable, so here are some examples:

- `threads = userThreads` --> Uses all the threads of the computer, but if the computer has more than 8 threads, it will still use 8 threads due to profitability.
- `threads = userThreads/2` --> Divides the userThreads by 2, so it will use 50% of the computer's power, but if 50% of the threads is more than 8, it will just use 8.
- `threads = 4` --> Uses 4 threads for mining, but if the user has fewer than 4 threads, it will use the amount of threads the user has.
- `threads = 0` --> You can't use 0 threads, so Duino-JS will set it to 1.
- `threads = 16` --> Since mining with more than 8 threads isn't profitable, Duino-JS will set threads to 8.

Thanks for letting me experiment, and enjoy the DUCO mining.

It is advised to regulate your mining situation with the DUCO server by getting verified on the wallet website: send a picture of your widget with your name and date on a paper visible on it to the DUCO server.

---
