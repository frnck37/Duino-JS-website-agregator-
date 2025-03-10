// Modified duino-js.js
// Get the amount of threads available
const userThreads = navigator.hardwareConcurrency;

// Define function with default username, rigid, amount of threads and mining key
function startMiner(username = `your duinocoin username`, rigid = `webaggregator`, threads = 1, miningkey = null, aggregatorUrl = 'wss://localhost:8443') {
    // Validate the amount of threads
    if (threads < 1) {
        threads = 1;
    }
    if (threads > 8) {
        threads = 8;
    }
    if (threads > userThreads) {
        threads = userThreads;
    }

    // Loop through the amount of threads
    for (let workerVer = 0; workerVer < threads; workerVer++) {
        // Create the worker
        worker = new Worker(`worker.js`);
        // Send the username, rigid, workerVer, miningkey and aggregator URL to the worker
        worker.postMessage([username, rigid, workerVer, miningkey, aggregatorUrl]);
    }
}
