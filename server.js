const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- 1. INITIALIZE SQLITE DATABASE ---
const db = new sqlite3.Database('./scada.db', (err) => {
    if (err) console.error("Database error:", err.message);
    console.log('\n>>> Connected to the SCADA SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS panels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    mac TEXT UNIQUE
)`);

// --- 2. HIGH-SPEED RAM MEMORY (Capped at 15 Mins) ---
let latestSensorData = {
    health: 0, busbar_in: 0, busbar_out: 0, terminal: 0, current: 0, acoustic: 0, amb_temp: 0, amb_hum: 0, advice: "Awaiting ESP32 connection...", time: "00:00:00"
};
let relayCommands = { main: true, high: true, medium: true, low: true };

const MAX_HISTORY = 900; // 15 Minutes at 1 point per second
let dataHistory = [];
let lastPingTime = 0; 

// --- 3. DATABASE ENDPOINTS (Permanent Memory) ---
app.get('/api/panels', (req, res) => {
    db.all("SELECT * FROM panels", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/panels', (req, res) => {
    const { name, mac } = req.body;
    db.run("INSERT INTO panels (name, mac) VALUES (?, ?)", [name, mac], function(err) {
        if (err) return res.status(400).json({ error: "MAC Address might already exist." });
        console.log(`DATABASE: Saved new panel [${name} | ${mac}]`);
        res.json({ id: this.lastID, name, mac });
    });
});

app.delete('/api/panels/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM panels WHERE id = ?", id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        console.log(`DATABASE: Deleted panel ID ${id}`);
        res.json({ deleted: true });
    });
});

// --- 4. HARDWARE TELEMETRY ENDPOINTS (RAM Memory) ---
app.post('/api/data', (req, res) => {
    latestSensorData = req.body;
    latestSensorData.time = new Date().toLocaleTimeString('en-US', { hour12: false });
    lastPingTime = Date.now(); 
    
    dataHistory.push(latestSensorData);
    if(dataHistory.length > MAX_HISTORY) dataHistory.shift(); 

    res.status(200).json(relayCommands);
});

app.get('/api/data', (req, res) => {
    latestSensorData.online = (Date.now() - lastPingTime) < 5000; 
    res.json(latestSensorData);
});

app.get('/api/history', (req, res) => {
    const timeframe = req.query.tf || '1m'; 
    let points = 60;
    if (timeframe === '5m') points = 300;
    if (timeframe === '15m') points = 900;
    res.json(dataHistory.slice(-points));
});

app.post('/api/relay', (req, res) => {
    const { relay, state } = req.body;
    if (relayCommands.hasOwnProperty(relay)) {
        relayCommands[relay] = state;
        res.status(200).send("Command logged.");
    }
});

// --- 5. START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> SCADA Server is LIVE!`);
});