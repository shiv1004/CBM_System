let panelCount = 0;

document.addEventListener("DOMContentLoaded", () => {
  fetch('/api/panels')
    .then(res => res.json())
    .then(panels => {
      panels.forEach(panel => {
        renderPanel(panel.id, panel.name, panel.mac);
      });
    })
    .catch(err => console.error("Error loading panels from DB:", err));
});

function renderPanel(idNum, pName, pMac) {
  const uniqueId = `db-${idNum}`; 
  
  const summaryHTML = `
    <div class="summary-card" id="summary-${uniqueId}" onclick="showDetail('${uniqueId}')">
      <div class="summary-header">
        <h2 style="font-size: 18px; margin: 0;">${pName}</h2>
        <div class="status-badge offline" id="summary-badge-${uniqueId}">OFFLINE</div>
      </div>
      <div style="text-align: center; color: var(--text-muted); font-size: 12px; font-family: monospace;">ID: ${pMac}</div>
      <div class="summary-health" id="summary-health-${uniqueId}" style="color: var(--text-muted);">-- <span class="unit">%</span></div>
      <div style="text-align: center; color: var(--text-muted); font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Health Index</div>
    </div>
  `;
  document.getElementById('overview-grid').insertAdjacentHTML('beforeend', summaryHTML);

  const detailHTML = `
    <div class="switchgear-panel" id="panel-${uniqueId}" style="display: none;">
      <div class="panel-header">
        <div style="display: flex; align-items: center;">
          <h2>${pName}</h2>
          <span class="mac-id">ID: ${pMac}</span>
        </div>
        <button class="btn-delete" onclick="deletePanel(${idNum}, '${uniqueId}')">Remove Node</button>
        <div class="status-badge offline" id="panel-badge-${uniqueId}">OFFLINE</div>
      </div>
      
      <div class="grid-top">
        <div class="card" id="health-card-${uniqueId}" style="border-top: 4px solid var(--border);" onclick="openChart('health', 'Health Index', '%', '#00fa9a')">
          <h3>Health Index</h3><div class="data-val" id="health-${uniqueId}" style="color: var(--text-muted);">-- <span class="unit">%</span></div>
        </div>
        <div class="card" id="advice-box" style="align-items: flex-start; text-align: left;">
          <h3>Advisory Engine</h3><div class="advice-text" id="advice-${uniqueId}" style="color: var(--text-muted);">Wire up ESP32 (${pMac}) to connect.</div>
        </div>
      </div>
      
      <div class="section-label">Power & Thermal Dynamics</div>
      <div class="grid-bottom">
        <div class="card" onclick="openChart('busbar_in', 'Busbar (In)', '°C', '#ff8c00')"><h3>Busbar (In)</h3><div class="data-val" id="busbar-in-${uniqueId}" style="color: #ff8c00;">-- <span class="unit">&deg;C</span></div></div>
        <div class="card" onclick="openChart('busbar_out', 'Busbar (Out)', '°C', '#ff8c00')"><h3>Busbar (Out)</h3><div class="data-val" id="busbar-out-${uniqueId}" style="color: #ff8c00;">-- <span class="unit">&deg;C</span></div></div>
        <div class="card" onclick="openChart('terminal', 'Terminal Block', '°C', '#ff8c00')"><h3>Terminal Block</h3><div class="data-val" id="terminal-${uniqueId}" style="color: #ff8c00;">-- <span class="unit">&deg;C</span></div></div>
        <div class="card" onclick="openChart('current', 'Line Current', 'A', '#00e5ff')"><h3>Line Current</h3><div class="data-val" id="current-${uniqueId}" style="color: #00e5ff;">-- <span class="unit">A</span></div></div>
      </div>

      <div class="section-label">Diagnostics & Environment</div>
      <div class="grid-bottom">
        <div class="card" onclick="openChart('acoustic', 'Acoustic Peak', 'ADC', '#b452ff')"><h3>Acoustic Peak</h3><div class="data-val" id="acoustic-${uniqueId}" style="color: #b452ff;">--</div></div>
        <div class="card" onclick="openChart('amb_temp', 'Ambient Temp', '°C', '#00bfff')"><h3>Ambient Temp</h3><div class="data-val" id="amb-temp-${uniqueId}" style="color: #00bfff;">-- <span class="unit">&deg;C</span></div></div>
        <div class="card" onclick="openChart('amb_hum', 'Ambient Humidity', '%', '#00bfff')"><h3>Ambient Humid</h3><div class="data-val" id="amb-hum-${uniqueId}" style="color: #00bfff;">-- <span class="unit">%</span></div></div>
      </div>

      <div class="relay-control-box" style="margin-top: 30px;">
        <h3 style="margin-top: 0; color: var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 10px;">BREAKER CONTROLS</h3>
        
        <div id="breaker-list-${uniqueId}">
          <div class="relay-row fixed-row" style="background: rgba(255, 255, 255, 0.03); padding: 12px 10px; border-radius: 8px;">
            <div class="drag-handle" style="visibility: hidden;">⠿</div>
            <div class="priority-col" style="color: #ffffff; font-weight: bold; font-size: 16px;">MAIN FEEDER</div>
            <input type="text" class="editable-label" value="Switchgear Master" disabled style="opacity: 0.5;">
            <label class="breaker-switch"><input type="checkbox" checked onchange="toggleMain('${uniqueId}', this.checked)"><span class="breaker-slider"></span></label>
          </div>
          
          <div class="relay-row sortable-row" draggable="true">
            <div class="drag-handle">⠿</div>
            <div class="priority-col priority-text" style="color: #ededed;">High Priority</div>
            <input type="text" class="editable-label" value="Load 1">
            <label class="breaker-switch"><input type="checkbox" data-relay="high" checked onchange="toggleRelay('panel${uniqueId}_high', this.checked)"><span class="breaker-slider"></span></label>
          </div>
          <div class="relay-row sortable-row" draggable="true">
            <div class="drag-handle">⠿</div>
            <div class="priority-col priority-text" style="color: #cccccc;">Medium Priority</div>
            <input type="text" class="editable-label" value="Load 2">
            <label class="breaker-switch"><input type="checkbox" data-relay="medium" checked onchange="toggleRelay('panel${uniqueId}_medium', this.checked)"><span class="breaker-slider"></span></label>
          </div>
          <div class="relay-row sortable-row" draggable="true">
            <div class="drag-handle">⠿</div>
            <div class="priority-col priority-text" style="color: #808080;">Low Priority</div>
            <input type="text" class="editable-label" value="Load 3">
            <label class="breaker-switch"><input type="checkbox" data-relay="low" checked onchange="toggleRelay('panel${uniqueId}_low', this.checked)"><span class="breaker-slider"></span></label>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('detailed-panels-container').insertAdjacentHTML('beforeend', detailHTML);
  bindDragEvents(document.getElementById(`breaker-list-${uniqueId}`));
}

function bindDragEvents(container) {
  const draggables = container.querySelectorAll('.sortable-row');
  draggables.forEach(draggable => {
    draggable.addEventListener('dragstart', () => { draggable.classList.add('dragging'); });
    draggable.addEventListener('dragend', () => {
      draggable.classList.remove('dragging');
      updatePriorityLabels(container);
    });
  });

  container.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(container, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (draggable) {
      if (afterElement == null) container.appendChild(draggable);
      else container.insertBefore(draggable, afterElement);
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.sortable-row:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updatePriorityLabels(container) {
  const rows = container.querySelectorAll('.sortable-row');
  const priorities = ["High Priority", "Medium Priority", "Low Priority"];
  const colors = ["#ededed", "#cccccc", "#808080"]; 
  rows.forEach((row, index) => {
    const label = row.querySelector('.priority-text');
    if (label && priorities[index]) {
      label.innerText = priorities[index];
      label.style.color = colors[index];
    }
  });
}

function toggleMain(idStr, isEnergized) {
  let mainName = idStr === 'db-1' ? 'main' : `panel${idStr}_main`;
  toggleRelay(mainName, isEnergized);

  if (!isEnergized) {
    const list = document.getElementById(`breaker-list-${idStr}`);
    const checkboxes = list.querySelectorAll('.sortable-row input[type="checkbox"]');
    
    checkboxes.forEach(cb => {
      if (cb.checked) {
        cb.checked = false; 
        const rName = cb.getAttribute('data-relay');
        let actualName = idStr === 'db-1' ? rName : `panel${idStr}_${rName}`;
        toggleRelay(actualName, false); 
      }
    });
  }
}

function showOverview() {
  document.getElementById('detail-view').style.display = 'none';
  document.getElementById('overview-view').style.display = 'block';
}

function showDetail(idStr) {
  const panels = document.querySelectorAll('.switchgear-panel');
  panels.forEach(p => p.style.display = 'none');
  
  const targetPanel = document.getElementById(`panel-${idStr}`);
  if(targetPanel) {
    targetPanel.style.display = 'block';
    document.getElementById('overview-view').style.display = 'none';
    document.getElementById('detail-view').style.display = 'block';
  }
}

function openModal() { document.getElementById('provisionModal').style.display = 'flex'; }
function closeModal() {
  document.getElementById('provisionModal').style.display = 'none';
  document.getElementById('inputName').value = '';
  document.getElementById('inputMac').value = '';
}

function submitNewPanel() {
  const pName = document.getElementById('inputName').value || "Unnamed Node";
  const pMac = document.getElementById('inputMac').value || "UNKNOWN-MAC";
  
  fetch('/api/panels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: pName, mac: pMac })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) alert("Error: " + data.error);
    else {
      renderPanel(data.id, data.name, data.mac);
      closeModal();
    }
  })
  .catch(err => console.error(err));
}

function deletePanel(dbId, domId) {
  fetch(`/api/panels/${dbId}`, { method: 'DELETE' })
  .then(res => res.json())
  .then(data => {
    const summary = document.getElementById(`summary-${domId}`);
    const detail = document.getElementById(`panel-${domId}`);
    if(summary) summary.remove();
    if(detail) detail.remove();
    showOverview(); 
  })
  .catch(err => console.error(err));
}

function toggleRelay(relayName, state) {
  fetch('/api/relay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ relay: relayName, state: state }) })
  .catch(error => console.error("Error:", error));
}

let activeChart = null;
let currentChartSensor = "";
let currentChartTitle = "";
let currentChartUnit = "";
let currentChartColor = "";
let currentTimeframe = "1m";
let maxPointsOnChart = 60; 

function setTimeframe(tf) {
  currentTimeframe = tf;
  document.querySelectorAll('.tf-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-${tf}`).classList.add('active');

  if (tf === '1m') maxPointsOnChart = 60;
  if (tf === '5m') maxPointsOnChart = 300;
  if (tf === '15m') maxPointsOnChart = 900;

  if (currentChartSensor !== "") drawChart(currentChartSensor, currentChartTitle, currentChartUnit, currentChartColor);
}

function openChart(sensorKey, title, unit, hexColor) {
  document.getElementById('chartModal').style.display = 'flex';
  currentChartSensor = sensorKey;
  currentChartTitle = title;
  currentChartUnit = unit;
  currentChartColor = hexColor;
  drawChart(sensorKey, title, unit, hexColor);
}

function drawChart(sensorKey, title, unit, hexColor) {
  document.getElementById('chartTitle').innerText = title + " Trend";
  fetch(`/api/history?tf=${currentTimeframe}`)
    .then(res => res.json())
    .then(history => {
       const timeLabels = history.map(d => d.time);
       const sensorData = history.map(d => d[sensorKey]);

       const ctx = document.getElementById('sensorChart').getContext('2d');
       if(activeChart) activeChart.destroy(); 

       activeChart = new Chart(ctx, {
         type: 'line',
         data: { labels: timeLabels, datasets: [{ label: title + " (" + unit + ")", data: sensorData, borderColor: hexColor, backgroundColor: hexColor + "22", borderWidth: 2, fill: true, tension: 0.3, pointRadius: currentTimeframe === '1m' ? 2 : 0 }] },
         options: { responsive: true, animation: false, scales: { x: { ticks: { color: '#808080', maxTicksLimit: 10 }, grid: { color: '#262626' } }, y: { ticks: { color: '#808080' }, grid: { color: '#262626' } } }, plugins: { legend: { labels: { color: '#ededed' } } } }
       });
    });
}

function closeChart() {
  document.getElementById('chartModal').style.display = 'none';
  currentChartSensor = "";
}

// Assuming the live data targets the very first panel added (db-1) for prototyping
setInterval(() => {
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      
      if (data.online && activeChart && currentChartSensor !== "") {
          activeChart.data.labels.push(data.time);
          activeChart.data.datasets[0].data.push(data[currentChartSensor]);
          if(activeChart.data.labels.length > maxPointsOnChart) {
              activeChart.data.labels.shift();
              activeChart.data.datasets[0].data.shift();
          }
          activeChart.update();
      }

      // Hardcoded to update the first database panel (db-1) for this prototype
      const domId = 'db-1';
      if (!document.getElementById(`panel-${domId}`)) return;

      let panelBadge = document.getElementById(`panel-badge-${domId}`);
      let summaryBadge = document.getElementById(`summary-badge-${domId}`);
      let adviceText = document.getElementById(`advice-${domId}`);
      let summaryHealth = document.getElementById(`summary-health-${domId}`);
      let healthCard = document.getElementById(`health-card-${domId}`);
      let healthText = document.getElementById(`health-${domId}`);

      if (data.online) {
          if (panelBadge) { panelBadge.className = "status-badge"; panelBadge.innerText = "LIVE"; }
          if (summaryBadge) { summaryBadge.className = "status-badge"; summaryBadge.innerText = "LIVE"; }
          adviceText.innerHTML = data.advice; 
      } else {
          if (panelBadge) { panelBadge.className = "status-badge offline"; panelBadge.innerText = "OFFLINE"; }
          if (summaryBadge) { summaryBadge.className = "status-badge offline"; summaryBadge.innerText = "OFFLINE"; }
          adviceText.innerHTML = "SYSTEM OFFLINE. Check ESP32 power and WiFi connection.";
          adviceText.style.color = "var(--warning)"; 
          if(summaryHealth) { summaryHealth.style.color = "var(--text-muted)"; summaryHealth.style.textShadow = "none"; }
          healthCard.style.borderTop = "4px solid var(--border)";
          healthText.style.color = "var(--text-muted)";
          return; 
      }

      document.getElementById(`health-${domId}`).innerHTML = data.health + ' <span class="unit">%</span>';
      document.getElementById(`busbar-in-${domId}`).innerHTML = data.busbar_in + ' <span class="unit">&deg;C</span>';
      document.getElementById(`busbar-out-${domId}`).innerHTML = data.busbar_out + ' <span class="unit">&deg;C</span>';
      document.getElementById(`terminal-${domId}`).innerHTML = data.terminal + ' <span class="unit">&deg;C</span>';
      document.getElementById(`current-${domId}`).innerHTML = data.current + ' <span class="unit">A</span>';
      document.getElementById(`acoustic-${domId}`).innerHTML = data.acoustic;
      document.getElementById(`amb-temp-${domId}`).innerHTML = data.amb_temp + ' <span class="unit">&deg;C</span>';
      document.getElementById(`amb-hum-${domId}`).innerHTML = data.amb_hum + ' <span class="unit">%</span>';

      if (summaryHealth) summaryHealth.innerHTML = data.health + ' <span class="unit">%</span>';

      if(data.health >= 80) {
        healthCard.style.borderTop = "4px solid var(--success)";
        healthText.style.color = "var(--success)";
        if(summaryHealth) { summaryHealth.style.color = "var(--success)"; summaryHealth.style.textShadow = "0 0 10px rgba(0,250,154,0.3)"; }
        adviceText.style.color = "var(--text-muted)";
      } else if(data.health >= 50) {
        healthCard.style.borderTop = "4px solid var(--warning)";
        healthText.style.color = "var(--warning)";
        if(summaryHealth) { summaryHealth.style.color = "var(--warning)"; summaryHealth.style.textShadow = "0 0 10px rgba(255,140,0,0.3)"; }
        adviceText.style.color = "var(--warning)";
      } else {
        healthCard.style.borderTop = "4px solid var(--danger)";
        healthText.style.color = "var(--danger)";
        if(summaryHealth) { summaryHealth.style.color = "var(--danger)"; summaryHealth.style.textShadow = "0 0 10px rgba(255,64,64,0.3)"; }
        adviceText.style.color = "var(--danger)";
      }
    })
    .catch(error => console.error("Data error:", error));
}, 1000);