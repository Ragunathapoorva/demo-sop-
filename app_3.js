// Application State
const AppState = {
    currentUser: 'Guest User',
    currentView: 'dashboard',
    isLoggedIn: false,
    devices: [],
    attacks: [],
    detections: [],
    mitigationRules: [],
    blockedEntities: [],
    logs: [],
    threatLevel: 'LOW',
    activeAttack: null,
    models: [
        { name: 'CNN-LSTM Hybrid', accuracy: 98.5, precision: 97.8, recall: 98.1, f1_score: 97.9, status: 'active' },
        { name: 'Random Forest', accuracy: 95.2, precision: 94.8, recall: 95.5, f1_score: 95.1, status: 'active' },
        { name: 'XGBoost', accuracy: 96.8, precision: 96.2, recall: 97.1, f1_score: 96.6, status: 'active' }
    ]
};

// IoT Device Data
const IoTDevices = [
    { id: 'temp_01', type: 'Temperature Sensor', location: 'Building A', status: 'safe', value: 22.5, protocol: 'MQTT', x: -50, y: 0, z: -30 },
    { id: 'cam_02', type: 'Security Camera', location: 'Entrance', status: 'safe', value: 'recording', protocol: 'HTTP', x: 0, y: 20, z: 0 },
    { id: 'motion_03', type: 'Motion Detector', location: 'Hallway', status: 'safe', value: 'no_motion', protocol: 'CoAP', x: 30, y: -10, z: 25 },
    { id: 'smart_04', type: 'Smart Thermostat', location: 'Office', status: 'safe', value: 24.0, protocol: 'MQTT', x: -20, y: 15, z: 40 },
    { id: 'door_05', type: 'Smart Lock', location: 'Main Door', status: 'safe', value: 'locked', protocol: 'Zigbee', x: 40, y: -5, z: -20 },
    { id: 'smoke_06', type: 'Smoke Detector', location: 'Kitchen', status: 'safe', value: 'clear', protocol: 'LoRa', x: -35, y: 25, z: 15 },
    { id: 'light_07', type: 'Smart Light', location: 'Conference Room', status: 'safe', value: 'on', protocol: 'MQTT', x: 15, y: -20, z: -35 },
    { id: 'hvac_08', type: 'HVAC Controller', location: 'Central', status: 'safe', value: 'cooling', protocol: 'HTTP', x: 0, y: 0, z: 0 }
];

// Attack Types
const AttackTypes = [
    { name: 'FGSM', description: 'Fast Gradient Sign Method', category: 'Adversarial ML', severity: 'High' },
    { name: 'PGD', description: 'Projected Gradient Descent', category: 'Adversarial ML', severity: 'High' },
    { name: 'DDoS', description: 'Distributed Denial of Service', category: 'Network', severity: 'Critical' },
    { name: 'Spoofing', description: 'Identity Spoofing Attack', category: 'Identity', severity: 'Medium' },
    { name: 'Injection', description: 'Packet Injection Attack', category: 'Network', severity: 'High' },
    { name: 'Poisoning', description: 'Data Poisoning Attack', category: 'ML', severity: 'High' }
];

// Charts
let trafficChart = null;
let performanceChart = null;

// 3D Scene
let scene, camera, renderer, deviceMeshes = [];
let animationId = null;

// WebSocket Simulation
class WebSocketSimulator {
    constructor() {
        this.callbacks = {};
        this.isConnected = false;
        this.interval = null;
    }

    connect() {
        this.isConnected = true;
        this.startDataStream();
        console.log('WebSocket simulator connected');
    }

    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    startDataStream() {
        this.interval = setInterval(() => {
            // Simulate real-time traffic data
            const normalTraffic = Math.floor(Math.random() * 100) + 50;
            const maliciousTraffic = Math.floor(Math.random() * 20) + (AppState.activeAttack ? 30 : 0);
            
            this.emit('traffic_data', {
                timestamp: new Date().toISOString(),
                normal: normalTraffic,
                malicious: maliciousTraffic
            });

            // Randomly generate detection events
            if (Math.random() < 0.15 || AppState.activeAttack) {
                this.generateDetectionEvent();
            }

            // Update device statuses randomly
            this.updateDeviceStatuses();

        }, 2000);
    }

    generateDetectionEvent() {
        const attackType = AttackTypes[Math.floor(Math.random() * AttackTypes.length)];
        const targetDevice = IoTDevices[Math.floor(Math.random() * IoTDevices.length)];
        
        const detection = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: attackType.name,
            description: attackType.description,
            source: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            target: targetDevice.id,
            severity: attackType.severity,
            confidence: (Math.random() * 0.3 + 0.7).toFixed(3),
            model: AppState.models[Math.floor(Math.random() * AppState.models.length)].name
        };

        AppState.detections.unshift(detection);
        if (AppState.detections.length > 50) {
            AppState.detections = AppState.detections.slice(0, 50);
        }

        // Add to logs
        AppState.logs.unshift({
            timestamp: detection.timestamp,
            type: 'Attack Detected',
            source: detection.source,
            target: detection.target,
            severity: detection.severity,
            action: 'Blocked'
        });

        this.emit('detection', detection);
        
        // Trigger mitigation
        this.triggerMitigation(detection);
    }

    triggerMitigation(detection) {
        // Add mitigation rule
        const rule = {
            id: Date.now().toString(),
            name: `Block ${detection.type} from ${detection.source}`,
            type: 'IP Block',
            target: detection.source,
            timestamp: new Date().toISOString(),
            status: 'active'
        };

        AppState.mitigationRules.unshift(rule);
        
        // Add to blocked entities
        AppState.blockedEntities.unshift({
            id: Date.now().toString(),
            entity: detection.source,
            type: 'IP Address',
            reason: `${detection.type} attack detected`,
            timestamp: new Date().toISOString(),
            status: 'blocked'
        });

        // Update threat level
        this.updateThreatLevel(detection.severity);

        this.emit('mitigation', rule);
    }

    updateThreatLevel(severity) {
        const severityLevels = {
            'Low': 1,
            'Medium': 2,
            'High': 3,
            'Critical': 4
        };

        const currentLevel = severityLevels[AppState.threatLevel] || 1;
        const newLevel = severityLevels[severity] || 1;

        if (newLevel > currentLevel) {
            const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
            AppState.threatLevel = levels[newLevel - 1];
            this.emit('threat_level', AppState.threatLevel);
        }
    }

    updateDeviceStatuses() {
        IoTDevices.forEach(device => {
            // Randomly update device values
            if (device.type === 'Temperature Sensor') {
                device.value = (Math.random() * 10 + 18).toFixed(1);
            } else if (device.type === 'Smart Thermostat') {
                device.value = (Math.random() * 8 + 20).toFixed(1);
            }

            // Randomly change device status (mostly safe)
            const rand = Math.random();
            if (AppState.activeAttack && rand < 0.3) {
                device.status = rand < 0.1 ? 'compromised' : 'suspicious';
            } else if (rand < 0.05) {
                device.status = 'suspicious';
            } else {
                device.status = 'safe';
            }
        });

        this.emit('device_update', IoTDevices);
    }

    disconnect() {
        this.isConnected = false;
        if (this.interval) {
            clearInterval(this.interval);
        }
        console.log('WebSocket simulator disconnected');
    }
}

const wsSimulator = new WebSocketSimulator();

// Simple Login Function - This will definitely work
function doLogin() {
    console.log('Processing login...');
    
    try {
        // Get form values (accept any values, even empty)
        const username = document.getElementById('username')?.value || 'Admin User';
        const role = document.getElementById('userRole')?.value || 'admin';
        
        console.log('Login with:', username, role);
        
        // Set state
        AppState.currentUser = username;
        AppState.isLoggedIn = true;
        
        // Update header
        const currentUserElement = document.getElementById('currentUser');
        const currentRoleElement = document.getElementById('currentRole');
        
        if (currentUserElement) {
            currentUserElement.textContent = username;
        }
        if (currentRoleElement) {
            currentRoleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        }
        
        // Hide login modal, show app
        const loginModal = document.getElementById('loginModal');
        const app = document.getElementById('app');
        
        if (loginModal) {
            loginModal.style.display = 'none';
        }
        if (app) {
            app.style.display = 'grid';
        }
        
        console.log('Login UI updated, initializing dashboard...');
        
        // Initialize dashboard after a short delay
        setTimeout(() => {
            initializeDashboard();
            wsSimulator.connect();
            console.log('Dashboard and WebSocket initialized');
        }, 200);
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error - please refresh the page');
    }
}

// Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

function initializeApp() {
    console.log('Initializing application...');
    
    // Initialize devices state
    AppState.devices = [...IoTDevices];
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup WebSocket simulation
    setupWebSocketListeners();
    
    // Show login modal
    showLoginModal();
    
    console.log('Application initialized');
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Simple login handlers - multiple ways to trigger login
    setTimeout(() => {
        // Form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.onsubmit = function(e) {
                e.preventDefault();
                doLogin();
                return false;
            };
        }
        
        // Button click
        const loginBtn = loginForm?.querySelector('button[type="submit"]');
        if (loginBtn) {
            loginBtn.onclick = function(e) {
                e.preventDefault();
                doLogin();
                return false;
            };
        }
        
        // Enter key on inputs
        const inputs = ['username', 'password'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.onkeypress = function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        doLogin();
                    }
                };
            }
        });
        
    }, 100);
    
    // Logout button
    setTimeout(() => {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = handleLogout;
        }
    }, 100);
    
    // Navigation
    setTimeout(() => {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.onclick = function() {
                const view = this.getAttribute('data-view');
                console.log('Switching to view:', view);
                switchView(view);
            };
        });
    }, 100);
    
    // Attack simulation
    setTimeout(() => {
        const startAttackBtn = document.getElementById('startAttack');
        const stopAttackBtn = document.getElementById('stopAttack');
        const intensitySlider = document.getElementById('attackIntensity');
        
        if (startAttackBtn) {
            startAttackBtn.onclick = startAttackSimulation;
        }
        if (stopAttackBtn) {
            stopAttackBtn.onclick = stopAttackSimulation;
        }
        if (intensitySlider) {
            intensitySlider.oninput = updateIntensityDisplay;
        }
    }, 100);
    
    // Network controls
    setTimeout(() => {
        const resetViewBtn = document.getElementById('resetView');
        const toggleAnimationBtn = document.getElementById('toggleAnimation');
        
        if (resetViewBtn) {
            resetViewBtn.onclick = resetNetworkView;
        }
        if (toggleAnimationBtn) {
            toggleAnimationBtn.onclick = toggleNetworkAnimation;
        }
    }, 100);
    
    console.log('Event listeners set up');
}

function setupWebSocketListeners() {
    wsSimulator.on('traffic_data', updateTrafficChart);
    wsSimulator.on('detection', addDetectionEvent);
    wsSimulator.on('mitigation', updateMitigationView);
    wsSimulator.on('threat_level', updateThreatLevel);
    wsSimulator.on('device_update', updateDeviceList);
}

function showLoginModal() {
    console.log('Showing login modal');
    const loginModal = document.getElementById('loginModal');
    const app = document.getElementById('app');
    
    if (loginModal) {
        loginModal.style.display = 'flex';
    }
    if (app) {
        app.style.display = 'none';
    }
}

function handleLogout() {
    console.log('Handling logout...');
    AppState.isLoggedIn = false;
    AppState.currentUser = null;
    wsSimulator.disconnect();
    cleanup3DScene();
    showLoginModal();
    
    // Clear form
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
}

function switchView(viewName) {
    console.log('Switching to view:', viewName);
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    const activeView = document.getElementById(`${viewName}View`);
    if (activeView) {
        activeView.classList.add('active');
    }
    
    AppState.currentView = viewName;
    
    // Initialize view-specific content
    switch (viewName) {
        case 'network':
            setTimeout(initialize3DNetwork, 100);
            break;
        case 'detection':
            initializeDetectionView();
            break;
        case 'attacks':
            populateTargetDevices();
            break;
        case 'logs':
            updateLogsTable();
            break;
    }
}

function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Initialize devices state
    AppState.devices = [...IoTDevices];
    
    // Initialize charts with delay to ensure DOM is ready
    setTimeout(() => {
        initializeTrafficChart();
        
        // Add some initial data
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                updateTrafficChart({
                    timestamp: new Date().toISOString(),
                    normal: Math.floor(Math.random() * 50) + 30,
                    malicious: Math.floor(Math.random() * 10) + 2
                });
            }, i * 300);
        }
    }, 300);
    
    // Update counters and lists
    updateDashboardCounters();
    updateDeviceList();
    populateRecentAttacks();
    updateThreatLevel(AppState.threatLevel);
    
    console.log('Dashboard initialized');
}

function initializeTrafficChart() {
    const ctx = document.getElementById('trafficChart');
    if (!ctx) {
        console.log('Traffic chart canvas not found');
        return;
    }
    
    console.log('Initializing traffic chart...');
    
    try {
        trafficChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Normal Traffic',
                    data: [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Malicious Traffic',
                    data: [],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                elements: {
                    point: {
                        radius: 0
                    }
                }
            }
        });
        
        console.log('Traffic chart initialized successfully');
    } catch (error) {
        console.error('Error initializing traffic chart:', error);
    }
}

function updateTrafficChart(data) {
    if (!trafficChart) {
        console.log('Traffic chart not initialized yet');
        return;
    }
    
    const timeLabel = new Date(data.timestamp).toLocaleTimeString();
    
    trafficChart.data.labels.push(timeLabel);
    trafficChart.data.datasets[0].data.push(data.normal);
    trafficChart.data.datasets[1].data.push(data.malicious);
    
    // Keep only last 20 data points
    if (trafficChart.data.labels.length > 20) {
        trafficChart.data.labels.shift();
        trafficChart.data.datasets[0].data.shift();
        trafficChart.data.datasets[1].data.shift();
    }
    
    trafficChart.update('none');
}

function updateDashboardCounters() {
    const activeDevicesElement = document.getElementById('activeDevices');
    const activeThreatsElement = document.getElementById('activeThreats');
    const blockedAttacksElement = document.getElementById('blockedAttacks');
    
    if (activeDevicesElement) {
        activeDevicesElement.textContent = AppState.devices.filter(d => d.status === 'safe').length;
    }
    if (activeThreatsElement) {
        const recentThreats = AppState.detections.filter(d => {
            const detectionTime = new Date(d.timestamp);
            const now = new Date();
            return (now - detectionTime) < 300000; // Last 5 minutes
        }).length;
        activeThreatsElement.textContent = recentThreats;
    }
    if (blockedAttacksElement) {
        blockedAttacksElement.textContent = AppState.blockedEntities.length;
    }
}

function updateDeviceList() {
    const deviceList = document.getElementById('deviceList');
    if (!deviceList) return;
    
    deviceList.innerHTML = '';
    
    AppState.devices.forEach(device => {
        const deviceElement = document.createElement('div');
        deviceElement.className = `device-item ${device.status}`;
        deviceElement.innerHTML = `
            <div class="device-info">
                <div class="device-name">${device.type}</div>
                <div class="device-details">${device.location} • ${device.protocol}</div>
            </div>
            <div class="device-status ${device.status}">${device.status.toUpperCase()}</div>
        `;
        deviceList.appendChild(deviceElement);
    });
    
    updateDashboardCounters();
}

function populateRecentAttacks() {
    const attacksContainer = document.getElementById('recentAttacks');
    if (!attacksContainer) return;
    
    attacksContainer.innerHTML = '';
    
    if (AppState.detections.length === 0) {
        attacksContainer.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; margin: 20px 0;">No recent attacks detected</p>';
        return;
    }
    
    AppState.detections.slice(0, 5).forEach(detection => {
        const attackElement = document.createElement('div');
        attackElement.className = 'attack-item';
        
        const timeAgo = getTimeAgo(detection.timestamp);
        
        attackElement.innerHTML = `
            <div class="attack-time">${timeAgo}</div>
            <div class="attack-details">
                <div class="attack-type">${detection.type}</div>
                <div class="attack-description">
                    ${detection.source} → ${detection.target} (${detection.confidence} confidence)
                </div>
            </div>
        `;
        attacksContainer.appendChild(attackElement);
    });
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h`;
}

function updateThreatLevel(level) {
    const threatLevelElement = document.getElementById('currentThreatLevel');
    const threatIndicator = document.querySelector('.threat-indicator');
    
    if (threatLevelElement) {
        threatLevelElement.textContent = level;
    }
    
    if (threatIndicator) {
        threatIndicator.className = `threat-indicator ${level.toLowerCase()}`;
    }
    
    AppState.threatLevel = level;
}

function initialize3DNetwork() {
    const container = document.getElementById('network3D');
    if (!container) {
        console.log('3D network container not found');
        return;
    }
    
    if (scene) {
        console.log('3D network already initialized');
        return;
    }
    
    console.log('Initializing 3D network...');
    
    try {
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f1419);
        
        // Camera setup
        camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 50, 100);
        camera.lookAt(0, 0, 0);
        
        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // Create device meshes
        createDeviceMeshes();
        
        // Create connections
        createConnections();
        
        // Animation
        animate3DNetwork();
        
        // Controls
        setupNetworkControls();
        
        // Handle window resize
        window.addEventListener('resize', onNetworkWindowResize);
        
        console.log('3D network initialized successfully');
    } catch (error) {
        console.error('Error initializing 3D network:', error);
    }
}

function createDeviceMeshes() {
    deviceMeshes = [];
    
    AppState.devices.forEach((device, index) => {
        // Create device geometry based on type
        let geometry;
        if (device.type.includes('Camera')) {
            geometry = new THREE.BoxGeometry(3, 2, 1);
        } else if (device.type.includes('Sensor')) {
            geometry = new THREE.SphereGeometry(1.5, 16, 16);
        } else {
            geometry = new THREE.CylinderGeometry(1, 1, 2, 8);
        }
        
        // Create material based on status
        const color = getDeviceColor(device.status);
        const material = new THREE.MeshLambertMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(device.x || 0, device.y || 0, device.z || 0);
        mesh.userData = device;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add glow effect for compromised devices
        if (device.status === 'compromised') {
            const glowGeometry = new THREE.SphereGeometry(2.5, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            mesh.add(glow);
        }
        
        scene.add(mesh);
        deviceMeshes.push(mesh);
        
        // Add device label
        createDeviceLabel(mesh, device);
    });
}

function createDeviceLabel(mesh, device) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(device.id, canvas.width / 2, 25);
    context.fillText(device.location, canvas.width / 2, 45);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: texture });
    const label = new THREE.Sprite(labelMaterial);
    label.scale.set(8, 2, 1);
    label.position.set(0, 4, 0);
    
    mesh.add(label);
}

function createConnections() {
    // Create connections between devices
    const connectionGeometry = new THREE.BufferGeometry();
    const connectionMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.3
    });
    
    const points = [];
    
    // Create hub at center
    const hubPosition = new THREE.Vector3(0, 0, 0);
    
    AppState.devices.forEach(device => {
        const devicePosition = new THREE.Vector3(device.x || 0, device.y || 0, device.z || 0);
        
        // Add connection from hub to device
        points.push(hubPosition, devicePosition);
    });
    
    connectionGeometry.setFromPoints(points);
    const connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);
    scene.add(connections);
}

function getDeviceColor(status) {
    switch (status) {
        case 'safe': return 0x28a745;
        case 'suspicious': return 0xffc107;
        case 'compromised': return 0xdc3545;
        default: return 0x6c757d;
    }
}

function animate3DNetwork() {
    animationId = requestAnimationFrame(animate3DNetwork);
    
    // Rotate camera around the scene
    const time = Date.now() * 0.0005;
    camera.position.x = Math.cos(time) * 80;
    camera.position.z = Math.sin(time) * 80;
    camera.lookAt(scene.position);
    
    // Animate device meshes
    deviceMeshes.forEach((mesh, index) => {
        mesh.rotation.y += 0.01;
        
        // Pulse effect for compromised devices
        if (mesh.userData.status === 'compromised') {
            const scale = 1 + Math.sin(Date.now() * 0.01 + index) * 0.2;
            mesh.scale.set(scale, scale, scale);
        } else {
            mesh.scale.set(1, 1, 1);
        }
        
        // Update material color based on status
        const color = getDeviceColor(mesh.userData.status);
        mesh.material.color.setHex(color);
    });
    
    renderer.render(scene, camera);
}

function setupNetworkControls() {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    
    const container = document.getElementById('network3D');
    
    container.addEventListener('mousedown', (event) => {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    });
    
    container.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
    
    container.addEventListener('mousemove', (event) => {
        if (isMouseDown) {
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            camera.position.x += deltaX * 0.1;
            camera.position.y -= deltaY * 0.1;
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    });
    
    container.addEventListener('wheel', (event) => {
        const delta = event.deltaY > 0 ? 1.1 : 0.9;
        camera.position.multiplyScalar(delta);
    });
}

function resetNetworkView() {
    if (camera) {
        camera.position.set(0, 50, 100);
        camera.lookAt(0, 0, 0);
    }
}

function toggleNetworkAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        const btn = document.getElementById('toggleAnimation');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-play"></i> Start Animation';
        }
    } else {
        animate3DNetwork();
        const btn = document.getElementById('toggleAnimation');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-pause"></i> Stop Animation';
        }
    }
}

function onNetworkWindowResize() {
    if (camera && renderer) {
        const container = document.getElementById('network3D');
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

function cleanup3DScene() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    
    scene = null;
    camera = null;
    renderer = null;
    deviceMeshes = [];
}

function initializeDetectionView() {
    updateDetectionFeed();
    initializePerformanceChart();
}

function updateDetectionFeed() {
    const detectionFeed = document.getElementById('detectionFeed');
    if (!detectionFeed) return;
    
    detectionFeed.innerHTML = '';
    
    if (AppState.detections.length === 0) {
        detectionFeed.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; margin: 20px 0;">No threats detected</p>';
        return;
    }
    
    AppState.detections.slice(0, 10).forEach(detection => {
        const detectionElement = document.createElement('div');
        detectionElement.className = 'detection-item';
        
        detectionElement.innerHTML = `
            <div class="detection-header">
                <span class="detection-type">${detection.type}</span>
                <span class="detection-time">${getTimeAgo(detection.timestamp)}</span>
            </div>
            <div class="detection-details">
                <strong>Source:</strong> ${detection.source}<br>
                <strong>Target:</strong> ${detection.target}<br>
                <strong>Confidence:</strong> ${detection.confidence}<br>
                <strong>Model:</strong> ${detection.model}
            </div>
        `;
        
        detectionFeed.appendChild(detectionElement);
    });
}

function initializePerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    try {
        performanceChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
                datasets: [{
                    data: [98.5, 97.8, 98.1, 97.9],
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing performance chart:', error);
    }
}

function addDetectionEvent(detection) {
    updateDetectionFeed();
    populateRecentAttacks();
    updateDashboardCounters();
}

function populateTargetDevices() {
    const targetSelect = document.getElementById('targetDevice');
    if (!targetSelect) return;
    
    // Clear existing options except first
    while (targetSelect.children.length > 1) {
        targetSelect.removeChild(targetSelect.lastChild);
    }
    
    AppState.devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        option.textContent = `${device.type} (${device.location})`;
        targetSelect.appendChild(option);
    });
}

function updateIntensityDisplay() {
    const intensity = document.getElementById('attackIntensity').value;
    const display = document.getElementById('intensityValue');
    if (display) {
        display.textContent = intensity;
    }
}

function startAttackSimulation() {
    console.log('Starting attack simulation...');
    
    const attackType = document.getElementById('attackType').value;
    const targetDevice = document.getElementById('targetDevice').value;
    const intensity = document.getElementById('attackIntensity').value;
    const duration = parseInt(document.getElementById('attackDuration').value);
    
    if (!attackType) {
        alert('Please select an attack type');
        return;
    }
    
    AppState.activeAttack = {
        type: attackType,
        target: targetDevice || 'all',
        intensity: parseInt(intensity),
        duration: duration,
        startTime: Date.now(),
        progress: 0
    };
    
    const startBtn = document.getElementById('startAttack');
    const stopBtn = document.getElementById('stopAttack');
    const statusElement = document.getElementById('simulationStatus');
    
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (statusElement) {
        statusElement.textContent = 'Attack in Progress';
        statusElement.className = 'status status--error';
    }
    
    updateAttackProgress();
    
    // Simulate attack effects
    simulateAttackEffects();
    
    console.log('Attack simulation started:', AppState.activeAttack);
}

function stopAttackSimulation() {
    console.log('Stopping attack simulation...');
    
    AppState.activeAttack = null;
    
    const startBtn = document.getElementById('startAttack');
    const stopBtn = document.getElementById('stopAttack');
    const statusElement = document.getElementById('simulationStatus');
    const progressElement = document.getElementById('attackProgress');
    
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (statusElement) {
        statusElement.textContent = 'Simulation Ready';
        statusElement.className = 'status status--info';
    }
    if (progressElement) {
        progressElement.innerHTML = '<p>No active attack simulation</p>';
    }
    
    // Reset device statuses gradually
    setTimeout(() => {
        AppState.devices.forEach(device => {
            if (Math.random() < 0.7) {
                device.status = 'safe';
            }
        });
        updateDeviceList();
    }, 2000);
    
    console.log('Attack simulation stopped');
}

function updateAttackProgress() {
    if (!AppState.activeAttack) return;
    
    const elapsed = Date.now() - AppState.activeAttack.startTime;
    const progress = Math.min((elapsed / (AppState.activeAttack.duration * 1000)) * 100, 100);
    AppState.activeAttack.progress = progress;
    
    const progressContainer = document.getElementById('attackProgress');
    
    if (progress < 100) {
        if (progressContainer) {
            progressContainer.innerHTML = `
                <div class="progress-active">
                    <h4>Active Attack: ${AppState.activeAttack.type}</h4>
                    <p><strong>Target:</strong> ${AppState.activeAttack.target}</p>
                    <p><strong>Intensity:</strong> ${AppState.activeAttack.intensity}/10</p>
                    <p><strong>Progress:</strong> ${Math.round(progress)}%</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <p><strong>Detection Events:</strong> ${AppState.detections.length}</p>
                </div>
            `;
        }
        
        setTimeout(updateAttackProgress, 1000);
    } else {
        stopAttackSimulation();
    }
}

function simulateAttackEffects() {
    if (!AppState.activeAttack) return;
    
    // Affect target devices
    if (AppState.activeAttack.target !== 'all') {
        const targetDevice = AppState.devices.find(d => d.id === AppState.activeAttack.target);
        if (targetDevice && Math.random() < 0.6) {
            targetDevice.status = Math.random() < 0.3 ? 'compromised' : 'suspicious';
        }
    } else {
        // Affect random devices
        AppState.devices.forEach(device => {
            if (Math.random() < 0.2) {
                device.status = Math.random() < 0.1 ? 'compromised' : 'suspicious';
            }
        });
    }
    
    updateDeviceList();
}

function updateMitigationView() {
    updateMitigationRules();
    updateBlockedEntities();
}

function updateMitigationRules() {
    const rulesContainer = document.getElementById('mitigationRules');
    const activeRulesElement = document.getElementById('activeRules');
    
    if (!rulesContainer) return;
    
    rulesContainer.innerHTML = '';
    
    if (activeRulesElement) {
        activeRulesElement.textContent = AppState.mitigationRules.length;
    }
    
    if (AppState.mitigationRules.length === 0) {
        rulesContainer.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; margin: 20px 0;">No active mitigation rules</p>';
        return;
    }
    
    AppState.mitigationRules.slice(0, 10).forEach(rule => {
        const ruleElement = document.createElement('div');
        ruleElement.className = 'rule-item';
        
        ruleElement.innerHTML = `
            <div class="rule-name">${rule.name}</div>
            <div class="rule-details">
                <strong>Type:</strong> ${rule.type}<br>
                <strong>Target:</strong> ${rule.target}<br>
                <strong>Created:</strong> ${getTimeAgo(rule.timestamp)}
            </div>
        `;
        
        rulesContainer.appendChild(ruleElement);
    });
}

function updateBlockedEntities() {
    const blockedContainer = document.getElementById('blockedEntities');
    const blockedIPsElement = document.getElementById('blockedIPs');
    
    if (!blockedContainer) return;
    
    blockedContainer.innerHTML = '';
    
    if (blockedIPsElement) {
        blockedIPsElement.textContent = AppState.blockedEntities.length;
    }
    
    if (AppState.blockedEntities.length === 0) {
        blockedContainer.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; margin: 20px 0;">No blocked entities</p>';
        return;
    }
    
    AppState.blockedEntities.slice(0, 10).forEach(entity => {
        const entityElement = document.createElement('div');
        entityElement.className = 'blocked-item';
        
        entityElement.innerHTML = `
            <div class="blocked-entity">${entity.entity}</div>
            <div class="blocked-details">
                <strong>Type:</strong> ${entity.type}<br>
                <strong>Reason:</strong> ${entity.reason}<br>
                <strong>Blocked:</strong> ${getTimeAgo(entity.timestamp)}
            </div>
        `;
        
        blockedContainer.appendChild(entityElement);
    });
}

function updateLogsTable() {
    const tableBody = document.getElementById('logsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (AppState.logs.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center; color: var(--color-text-secondary);">No log entries</td>';
        tableBody.appendChild(row);
        return;
    }
    
    AppState.logs.forEach(log => {
        const row = document.createElement('tr');
        
        const severityClass = log.severity.toLowerCase().replace(' ', '-');
        
        row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${log.type}</td>
            <td>${log.source}</td>
            <td>${log.target}</td>
            <td><span class="severity-${severityClass.includes('high') || severityClass.includes('critical') ? 'high' : severityClass.includes('medium') ? 'medium' : 'low'}">${log.severity}</span></td>
            <td>${log.action}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Initialize WebSocket simulation when device data updates
wsSimulator.on('device_update', (devices) => {
    AppState.devices = devices;
    
    // Update 3D scene device colors
    if (deviceMeshes.length > 0) {
        deviceMeshes.forEach((mesh, index) => {
            if (devices[index]) {
                mesh.userData = devices[index];
                
                // Remove existing glow
                const existingGlow = mesh.children.find(child => child.material && child.material.color && child.material.color.getHex() === 0xff0000);
                if (existingGlow) {
                    mesh.remove(existingGlow);
                }
                
                // Add new glow if compromised
                if (devices[index].status === 'compromised') {
                    const glowGeometry = new THREE.SphereGeometry(2.5, 16, 16);
                    const glowMaterial = new THREE.MeshBasicMaterial({
                        color: 0xff0000,
                        transparent: true,
                        opacity: 0.3
                    });
                    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                    mesh.add(glow);
                }
            }
        });
    }
});

// Periodically update dashboard
setInterval(() => {
    if (AppState.isLoggedIn) {
        updateDashboardCounters();
        populateRecentAttacks();
        
        if (AppState.currentView === 'detection') {
            updateDetectionFeed();
        }
        
        if (AppState.currentView === 'mitigation') {
            updateMitigationView();
        }
        
        if (AppState.currentView === 'logs') {
            updateLogsTable();
        }
    }
}, 5000);

// Global function to force login (for testing)
window.testLogin = function() {
    console.log('Test login triggered');
    doLogin();
};