// ==== AGGREGATOR SERVER (server.js) ====

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const net = require('net');

// Configuration
const WEBSOCKET_PORT = 8443;
const DUCO_SERVER = 'magi.duinocoin.com';
const DUCO_PORT = 2813; // Assurez-vous que le port est correct
const USERNAME = 'your duinocoin username';
const RIG_IDENTIFIER = 'WebAggregator';
const CONNECTION_COUNT = 40; // Number of connections to maintain

// Load SSL certificate and key
const server = https.createServer({
    cert: fs.readFileSync('selfsigned.crt'),
    key: fs.readFileSync('selfsigned.key')
});

// Create WebSocket server for clients
const wss = new WebSocket.Server({ server });

wss.on('listening', () => {
    console.log(`WebSocket server is listening on port ${WEBSOCKET_PORT}`);
});

// Track connected browser clients
const clients = new Map();
// Track available clients (not currently working on a job)
let availableClients = new Set();
// Track connections to Duinocoin server
const ducoConnections = [];

// Initialize connections to Duinocoin server
function initializeDucoConnections() {
    console.log(`Initializing ${CONNECTION_COUNT} connections to Duinocoin server...`);
    
    for (let i = 0; i < CONNECTION_COUNT; i++) {
        createDucoConnection(i);
    }
}

// Create a single connection to Duinocoin server
function createDucoConnection(index) {
    const socket = new net.Socket();
    
    // Connection state
    const connectionState = {
        socket: socket,
        index: index,
        connected: false,
        activeJob: null,
        assignedClients: new Set(),
        pendingResults: []
    };
    
    // Store in our connections array
    ducoConnections[index] = connectionState;
    
    // Connect to Duinocoin server
    socket.connect(DUCO_PORT, DUCO_SERVER, () => {
        console.log(`Connection ${index}: Connected to Duinocoin server`);
        connectionState.connected = true;
    });
    
    // Handle data from Duinocoin server
    socket.on('data', (data) => {
        const message = data.toString().trim();
        
        // Handle different message types from Duinocoin
        if (message.startsWith('3.')) {
            // Server version - request a job
            console.log(`Connection ${index}: Server version ${message}`);
            requestJob(index);
        } 
        else if (message.includes(',')) {
            // Job data - parse and distribute
            console.log(`Connection ${index}: Received job: ${message}`);
            processJob(index, message);
        }
        else if (message === 'GOOD\n') {
            // Accepted share
            console.log(`Connection ${index}: Share accepted`);
            // Clear state
            connectionState.activeJob = null;
            connectionState.pendingResults = [];
            connectionState.assignedClients.clear();
            // Request next job
            requestJob(index);
        }
        else if (message === 'BAD\n') {
            // Rejected share
            console.log(`Connection ${index}: Share rejected`);
            // Clear state and request next job
            connectionState.activeJob = null;
            connectionState.pendingResults = [];
            connectionState.assignedClients.clear();
            requestJob(index);
        }
    });
    
    // Handle connection close
    socket.on('close', () => {
        console.log(`Connection ${index}: Disconnected from Duinocoin server`);
        connectionState.connected = false;
        
        // Release all assigned clients
        releaseClients(index);
        
        // Try to reconnect after delay
        setTimeout(() => {
            createDucoConnection(index);
        }, 5000);
    });
    
    // Handle errors
    socket.on('error', (err) => {
        console.error(`Connection ${index}: Error: ${err.message}`);
        socket.destroy();
    });
}

// Request a job from Duinocoin
function requestJob(connectionIndex) {
    const connection = ducoConnections[connectionIndex];
    
    if (connection && connection.connected && connection.socket.writable) {
        connection.socket.write(`JOB,${USERNAME},LOW\n`);
    }
}

// Process a job from Duinocoin and distribute to clients
function processJob(connectionIndex, jobData) {
    const connection = ducoConnections[connectionIndex];
    if (!connection) return;
    
    // Parse job data
    const jobParts = jobData.split(',');
    if (jobParts.length < 3) return;
    
    const job = {
        jobId: `job-${connectionIndex}-${Date.now()}`,
        lastBlockHash: jobParts[0],
        expectedHash: jobParts[1],
        difficulty: parseFloat(jobParts[2])
    };
    
    // Store job in connection state
    connection.activeJob = job;
    connection.pendingResults = [];
    
    // If no available clients, request another job later
    if (availableClients.size === 0) {
        console.log(`Connection ${connectionIndex}: No available clients, waiting...`);
        setTimeout(() => {
            if (connection.activeJob === job) {
                releaseClients(connectionIndex);
                requestJob(connectionIndex);
            }
        }, 5000);
        return;
    }
    
    // Assign clients to this job
    assignClientsToJob(connectionIndex);
}

// Assign available clients to a job
function assignClientsToJob(connectionIndex) {
    const connection = ducoConnections[connectionIndex];
    if (!connection || !connection.activeJob) return;
    
    // Get available clients
    const clientsToAssign = [...availableClients].slice(0, 5); // Limit to 5 clients per connection
    if (clientsToAssign.length === 0) return;
    
    console.log(`Connection ${connectionIndex}: Assigning ${clientsToAssign.length} clients to job`);
    
    // Mark clients as assigned
    clientsToAssign.forEach(clientId => {
        availableClients.delete(clientId);
        connection.assignedClients.add(clientId);
        
        // Send work to client
        const client = clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'work',
                connectionId: connectionIndex,
                job: connection.activeJob
            }));
        }
    });
    
    // Set timeout for job completion
    setTimeout(() => {
        processResults(connectionIndex);
    }, 10000); // 10 second timeout
}

// Process results for a job
function processResults(connectionIndex) {
    const connection = ducoConnections[connectionIndex];
    if (!connection || !connection.activeJob) return;
    
    // If we have any results, submit the best one
    if (connection.pendingResults.length > 0) {
        // Sort by difficulty (lower is better)
        connection.pendingResults.sort((a, b) => a.difficulty - b.difficulty);
        const bestResult = connection.pendingResults[0];
        
        console.log(`Connection ${connectionIndex}: Submitting result ${bestResult.result} with hashrate ${bestResult.hashrate}`);
        
        // Submit to Duinocoin
        if (connection.connected && connection.socket.writable) {
            connection.socket.write(`${bestResult.result},${bestResult.hashrate},Duino-JS Aggregator,${RIG_IDENTIFIER}-${connectionIndex}\n`);
        }
    } else {
        // No results received, request new job
        console.log(`Connection ${connectionIndex}: No results received, requesting new job`);
        releaseClients(connectionIndex);
        requestJob(connectionIndex);
    }
}

// Release clients assigned to a connection
function releaseClients(connectionIndex) {
    const connection = ducoConnections[connectionIndex];
    if (!connection) return;
    
    // Move assigned clients back to available pool
    connection.assignedClients.forEach(clientId => {
        if (clients.has(clientId)) {
            availableClients.add(clientId);
        }
    });
    
    // Clear assigned clients
    connection.assignedClients.clear();
    
    // Notify system of available clients
    console.log(`Released clients from connection ${connectionIndex}, available clients: ${availableClients.size}`);
    
    // Try to assign available clients to other connections
    assignAvailableClients();
}

// Assign available clients to connections that need them
function assignAvailableClients() {
    if (availableClients.size === 0) return;
    
    // Find connections with active jobs but no assigned clients
    ducoConnections.forEach((connection, index) => {
        if (connection.connected && connection.activeJob && connection.assignedClients.size === 0) {
            assignClientsToJob(index);
        }
    });
}

// Handle client connections
wss.on('connection', (ws) => {
    // Generate unique client ID
    const clientId = `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Store client
    clients.set(clientId, ws);
    availableClients.add(clientId);
    
    console.log(`Client ${clientId} connected. Total clients: ${clients.size}`);
    
    // Send configuration to client
    ws.send(JSON.stringify({
        type: 'config',
        clientId: clientId
    }));
    
    // Handle messages from client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Handle registration
            if (data.type === 'register') {
                console.log(`Client ${clientId} registered: ${data.username}/${data.rigid}`);
            }
            // Handle mining results
            else if (data.type === 'result') {
                const connectionId = data.connectionId;
                const connection = ducoConnections[connectionId];
                
                if (connection && connection.activeJob) {
                    // Store result
                    connection.pendingResults.push({
                        clientId: clientId,
                        result: data.result,
                        hashrate: data.hashrate,
                        difficulty: connection.activeJob.difficulty
                    });
                    
                    console.log(`Connection ${connectionId}: Received result from client ${clientId}: ${data.result} @ ${data.hashrate} H/s`);
                    
                    // If this is the first result, process it immediately
                    if (connection.pendingResults.length === 1) {
                        processResults(connectionId);
                    }
                }
            }
        } catch (error) {
            console.error(`Error processing message from client ${clientId}: ${error.message}`);
        }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        
        // Remove from available clients
        availableClients.delete(clientId);
        
        // Remove from all connection assignments
        ducoConnections.forEach(connection => {
            connection.assignedClients.delete(clientId);
        });
        
        // Remove from clients map
        clients.delete(clientId);
    });
    
    // Assign client to a connection if available
    assignAvailableClients();
});

// Start the server
server.listen(WEBSOCKET_PORT, () => {
    console.log(`HTTPS server is listening on port ${WEBSOCKET_PORT}`);
    initializeDucoConnections();
});
