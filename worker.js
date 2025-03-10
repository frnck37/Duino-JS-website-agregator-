// ==== MODIFIED worker.js ====

// Import the SHA1 library
importScripts('hashes.js');

// Execute on message from the main script
onmessage = (event) => {
    // Gets the data from the event.data variable
    const [username, rigid, workerVer, miningkey, aggregatorUrl] = event.data;

    // Create a connection to the aggregator server instead of directly to Duinocoin
    const socket = new WebSocket(aggregatorUrl);
    let clientId = null;
    let currentJob = null;

    // Execute on message from the aggregator server
    socket.onmessage = (event) => {
        try {
            // Parse the JSON message from our aggregator
            const message = JSON.parse(event.data);
            
            // Handle different message types from the aggregator
            switch (message.type) {
                case 'config':
                    // Store client ID assigned by the aggregator
                    clientId = message.clientId;
                    console.log(`CPU${workerVer}: Registered with aggregator as client ${clientId}`);
                    break;
                
                case 'work':
                    // Get work assignment details
                    currentJob = message;
                    const connectionId = message.connectionId;
                    const job = message.job;
                    
                    console.log(`CPU${workerVer}: Received job from connection ${connectionId}`);
                    
                    // Parse job data
                    const lastBlockHash = job.lastBlockHash;
                    const expectedHash = job.expectedHash;
                    const difficulty = job.difficulty;
                    
                    // Start mining process
                    const startingTime = performance.now();
                    
                    // Search for the correct hash
                    for (let result = 0; result < 100 * difficulty + 1; result++) {
                        // Calculate SHA1 hash
                        const ducos1 = new Hashes.SHA1().hex(lastBlockHash + result);
                        
                        // If the hash matches the expected hash
                        if (expectedHash === ducos1) {
                            // Calculate time difference and hashrate
                            const timeDifference = (performance.now() - startingTime) / 1000;
                            const hashrate = (result / timeDifference).toFixed(2);
                            
                            console.log(`CPU${workerVer}: Solution found! Hashrate: ${hashrate} H/s`);
                            
                            // Send the result back to the aggregator
                            socket.send(JSON.stringify({
                                type: 'result',
                                connectionId: connectionId,
                                jobId: job.jobId,
                                clientId: clientId,
                                result: result,
                                hashrate: hashrate,
                                workerVer: workerVer
                            }));
                            
                            break;
                        }
                    }
                    break;
                
                case 'status':
                    // Handle status updates from the aggregator
                    console.log(`CPU${workerVer}: Status update: ${message.message}`);
                    break;
            }
        } catch (error) {
            console.error(`CPU${workerVer}: Error processing message: ${error.message}`);
        }
    };
    
    // Handle connection opening
    socket.onopen = () => {
        console.log(`CPU${workerVer}: Connected to aggregator at ${aggregatorUrl}`);
        
        // Register with the aggregator
        socket.send(JSON.stringify({
            type: 'register',
            username: username,
            rigid: rigid,
            workerVer: workerVer,
            miningkey: miningkey,
            threads: userThreads
        }));
    };
    
    // Handle connection errors
    socket.onerror = (error) => {
        console.error(`CPU${workerVer}: WebSocket error: ${error}`);
    };
    
    // Handle connection closing
    socket.onclose = () => {
        console.log(`CPU${workerVer}: Connection to aggregator closed. Attempting to reconnect...`);
        
        // Try to reconnect after 5 seconds
        setTimeout(() => {
            // The main thread should restart this worker
            self.close();
        }, 5000);
    };
};
