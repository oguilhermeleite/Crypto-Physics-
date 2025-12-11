// ═══════════════════════════════════════════════════════════
// CRYPTOPHYSICS PORTFOLIO ANALYZER
// Engine de Física 2D para Visualização de Portfólio Cripto
// ═══════════════════════════════════════════════════════════

class CryptoPhysicsEngine {
    constructor() {
        // Matter.js modules
        this.Engine = Matter.Engine;
        this.Render = Matter.Render;
        this.Runner = Matter.Runner;
        this.Bodies = Matter.Bodies;
        this.Composite = Matter.Composite;
        this.Mouse = Matter.Mouse;
        this.MouseConstraint = Matter.MouseConstraint;
        this.Events = Matter.Events;
        this.Body = Matter.Body;
        this.Vector = Matter.Vector;

        // Engine setup
        this.engine = this.Engine.create();
        this.world = this.engine.world;
        this.runner = null;

        // Canvas setup
        this.canvasContainer = document.getElementById('physicsCanvas');
        this.render = null;

        // Portfolio data
        this.portfolio = [];
        this.prices = {};
        this.isPaused = false;
        this.hasGravity = true;

        // Selected asset for modal
        this.selectedAsset = null;

        // Initialize
        this.init();
    }

    // ═══════════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════

    init() {
        this.setupCanvas();
        this.setupPhysicsWorld();
        this.setupControls();
        this.setupEventListeners();
        this.loadPrices();
        this.loadSavedPortfolio();
        this.startEngine();
    }

    setupCanvas() {
        const width = this.canvasContainer.clientWidth;
        const height = this.canvasContainer.clientHeight;

        this.render = this.Render.create({
            element: this.canvasContainer,
            engine: this.engine,
            options: {
                width: width,
                height: height,
                wireframes: false,
                background: '#050816',
                pixelRatio: window.devicePixelRatio
            }
        });

        this.Render.run(this.render);
    }

    setupPhysicsWorld() {
        const width = this.canvasContainer.clientWidth;
        const height = this.canvasContainer.clientHeight;

        // Gravidade
        this.engine.world.gravity.y = 1;

        // Paredes
        const wallOptions = {
            isStatic: true,
            render: {
                fillStyle: 'rgba(0, 217, 255, 0.2)',
                strokeStyle: '#00d9ff',
                lineWidth: 2
            }
        };

        const ground = this.Bodies.rectangle(width / 2, height - 10, width, 20, wallOptions);
        const leftWall = this.Bodies.rectangle(10, height / 2, 20, height, wallOptions);
        const rightWall = this.Bodies.rectangle(width - 10, height / 2, 20, height, wallOptions);
        const ceiling = this.Bodies.rectangle(width / 2, 10, width, 20, wallOptions);

        this.Composite.add(this.world, [ground, leftWall, rightWall, ceiling]);

        // Zona Segura (visual reference)
        this.createSafeZone();
    }

    createSafeZone() {
        const width = this.canvasContainer.clientWidth;
        const height = this.canvasContainer.clientHeight;

        const safeZone = this.Bodies.rectangle(
            width / 2,
            height / 2 - 50,
            width - 200,
            height - 300,
            {
                isStatic: true,
                isSensor: true,
                render: {
                    fillStyle: 'rgba(20, 241, 149, 0.03)',
                    strokeStyle: '#14F195',
                    lineWidth: 2,
                    opacity: 0.5
                },
                label: 'safeZone'
            }
        );

        this.Composite.add(this.world, safeZone);
    }

    setupControls() {
        // Mouse interaction
        const mouse = this.Mouse.create(this.render.canvas);
        const mouseConstraint = this.MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: true,
                    strokeStyle: '#00d9ff',
                    lineWidth: 2
                }
            }
        });

        this.Composite.add(this.world, mouseConstraint);

        // Keep the mouse in sync with rendering
        this.render.mouse = mouse;

        // Double click para abrir modal
        this.Events.on(mouseConstraint, 'mousedown', (event) => {
            const clickedBody = event.source.body;
            if (clickedBody && clickedBody.label !== 'safeZone' && !clickedBody.isStatic) {
                const now = Date.now();
                if (clickedBody.lastClick && (now - clickedBody.lastClick) < 300) {
                    this.openAssetModal(clickedBody);
                }
                clickedBody.lastClick = now;
            }
        });

        // Highlight on hover
        this.Events.on(mouseConstraint, 'mousemove', (event) => {
            const hoveredBody = event.source.body;
            this.Composite.allBodies(this.world).forEach(body => {
                if (body.render && !body.isStatic && body.label !== 'safeZone') {
                    if (body === hoveredBody) {
                        body.render.lineWidth = 3;
                    } else {
                        body.render.lineWidth = 2;
                    }
                }
            });
        });
    }

    startEngine() {
        this.runner = this.Runner.create();
        this.Runner.run(this.runner, this.engine);
    }

    // ═══════════════════════════════════════════════════════════
    // CRIAÇÃO DE ATIVOS CRYPTO COM PROPRIEDADES FÍSICAS
    // ═══════════════════════════════════════════════════════════

    createCryptoAsset(crypto, quantity) {
        const width = this.canvasContainer.clientWidth;
        const spawnX = width / 2 + (Math.random() - 0.5) * 200;
        const spawnY = 100;

        let bodies = [];

        switch (crypto) {
            case 'bitcoin':
                bodies = this.createBitcoin(spawnX, spawnY, quantity);
                break;
            case 'ethereum':
                bodies = this.createEthereum(spawnX, spawnY, quantity);
                break;
            case 'solana':
                bodies = this.createSolana(spawnX, spawnY, quantity);
                break;
            case 'binancecoin':
                bodies = this.createBinanceCoin(spawnX, spawnY, quantity);
                break;
            case 'cardano':
                bodies = this.createCardano(spawnX, spawnY, quantity);
                break;
            case 'dogecoin':
            case 'shiba-inu':
                bodies = this.createMemecoin(spawnX, spawnY, quantity, crypto);
                break;
        }

        bodies.forEach(body => {
            this.Composite.add(this.world, body);
            this.portfolio.push({
                crypto: crypto,
                quantity: quantity,
                body: body,
                timestamp: Date.now()
            });
        });

        this.updateMetrics();
        return bodies;
    }

    // BITCOIN - "A Rocha" 🟧
    createBitcoin(x, y, quantity) {
        const size = Math.min(80 + quantity * 5, 120);
        const body = this.Bodies.rectangle(x, y, size, size, {
            density: 0.1,
            friction: 0.9,
            restitution: 0.1,
            render: {
                fillStyle: '#F7931A',
                strokeStyle: '#ff9500',
                lineWidth: 2
            },
            label: 'bitcoin',
            cryptoData: { type: 'bitcoin', quantity: quantity }
        });

        // Add text label
        body.render.sprite = {
            texture: this.createTextTexture('₿', '#FFFFFF', size),
            xScale: 1,
            yScale: 1
        };

        return [body];
    }

    // ETHEREUM - "O Tijolo" 🟦
    createEthereum(x, y, quantity) {
        const size = Math.min(70 + quantity * 3, 100);
        const body = this.Bodies.rectangle(x, y, size, size, {
            density: 0.08,
            friction: 0.8,
            restitution: 0.2,
            render: {
                fillStyle: '#627EEA',
                strokeStyle: '#7c9ff5',
                lineWidth: 2
            },
            label: 'ethereum',
            cryptoData: { type: 'ethereum', quantity: quantity }
        });

        body.render.sprite = {
            texture: this.createTextTexture('Ξ', '#FFFFFF', size),
            xScale: 1,
            yScale: 1
        };

        return [body];
    }

    // SOLANA - "O Pentágono" 🟩
    createSolana(x, y, quantity) {
        const size = Math.min(60 + quantity * 2, 90);
        const sides = 5;
        const body = this.Bodies.polygon(x, y, sides, size / 2, {
            density: 0.05,
            friction: 0.5,
            restitution: 0.4,
            render: {
                fillStyle: '#14F195',
                strokeStyle: '#00ff88',
                lineWidth: 2
            },
            label: 'solana',
            cryptoData: { type: 'solana', quantity: quantity }
        });

        body.render.sprite = {
            texture: this.createTextTexture('◎', '#000000', size),
            xScale: 1,
            yScale: 1
        };

        return [body];
    }

    // BINANCE COIN - "O Diamante" 🟨
    createBinanceCoin(x, y, quantity) {
        const size = Math.min(65 + quantity * 3, 95);
        const body = this.Bodies.polygon(x, y, 4, size / 2, {
            density: 0.06,
            friction: 0.7,
            restitution: 0.3,
            angle: Math.PI / 4,
            render: {
                fillStyle: '#F3BA2F',
                strokeStyle: '#ffd700',
                lineWidth: 2
            },
            label: 'binancecoin',
            cryptoData: { type: 'binancecoin', quantity: quantity }
        });

        body.render.sprite = {
            texture: this.createTextTexture('◆', '#000000', size),
            xScale: 1,
            yScale: 1
        };

        return [body];
    }

    // CARDANO - "O Hexágono" 🔵
    createCardano(x, y, quantity) {
        const size = Math.min(55 + quantity * 2, 85);
        const body = this.Bodies.polygon(x, y, 6, size / 2, {
            density: 0.04,
            friction: 0.6,
            restitution: 0.35,
            render: {
                fillStyle: '#0033AD',
                strokeStyle: '#3399ff',
                lineWidth: 2
            },
            label: 'cardano',
            cryptoData: { type: 'cardano', quantity: quantity }
        });

        body.render.sprite = {
            texture: this.createTextTexture('₳', '#FFFFFF', size),
            xScale: 1,
            yScale: 1
        };

        return [body];
    }

    // MEMECOIN - "Nuvem Caótica" 🌸
    createMemecoin(x, y, quantity, type) {
        const bodies = [];
        const count = Math.min(Math.floor(quantity * 10), 20);

        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            const size = 12 + Math.random() * 8;

            const body = this.Bodies.circle(x + offsetX, y + offsetY, size, {
                density: 0.005,
                friction: 0.1,
                restitution: 0.95,
                render: {
                    fillStyle: type === 'dogecoin' ? '#C2A633' : '#FF1493',
                    strokeStyle: type === 'dogecoin' ? '#FFD700' : '#ff69b4',
                    lineWidth: 2
                },
                label: type,
                cryptoData: { type: type, quantity: quantity / count }
            });

            if (i === 0) {
                body.render.sprite = {
                    texture: this.createTextTexture('🐕', '#FFFFFF', size * 2),
                    xScale: 1,
                    yScale: 1
                };
            }

            bodies.push(body);
        }

        return bodies;
    }

    // Helper: Create text texture (simplified - in production use canvas)
    createTextTexture(text, color, size) {
        // Matter.js doesn't natively support text rendering well
        // This is a placeholder - in production, you'd create a canvas texture
        return null;
    }

    // ═══════════════════════════════════════════════════════════
    // API DE PREÇOS (CoinGecko)
    // ═══════════════════════════════════════════════════════════

    async loadPrices() {
        try {
            const ids = 'bitcoin,ethereum,solana,binancecoin,cardano,dogecoin,shiba-inu';
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
            );
            const data = await response.json();
            this.prices = data;
            this.updateMetrics();
        } catch (error) {
            console.error('Erro ao carregar preços:', error);
            // Fallback prices
            this.prices = {
                bitcoin: { usd: 45000, usd_24h_change: 2.5 },
                ethereum: { usd: 2500, usd_24h_change: 3.1 },
                solana: { usd: 100, usd_24h_change: -1.2 },
                binancecoin: { usd: 300, usd_24h_change: 1.8 },
                cardano: { usd: 0.5, usd_24h_change: 0.5 },
                dogecoin: { usd: 0.08, usd_24h_change: -2.1 },
                'shiba-inu': { usd: 0.000009, usd_24h_change: 5.3 }
            };
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTRICAS DO PORTFÓLIO
    // ═══════════════════════════════════════════════════════════

    updateMetrics() {
        let totalValue = 0;
        let riskScore = 0;
        const cryptoCounts = {};

        this.portfolio.forEach(asset => {
            const price = this.prices[asset.crypto]?.usd || 0;
            const value = price * asset.quantity;
            totalValue += value;

            // Risk scoring
            const volatility = Math.abs(this.prices[asset.crypto]?.usd_24h_change || 0);
            riskScore += volatility * value;

            // Count unique cryptos
            cryptoCounts[asset.crypto] = (cryptoCounts[asset.crypto] || 0) + 1;
        });

        const uniqueCryptos = Object.keys(cryptoCounts).length;
        const diversification = Math.min((uniqueCryptos / 7) * 100, 100);

        // Update UI
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('assetCount').textContent = this.portfolio.length;
        document.getElementById('diversification').textContent = `${diversification.toFixed(0)}%`;

        // Risk level
        const avgRisk = totalValue > 0 ? riskScore / totalValue : 0;
        const riskElement = document.getElementById('riskLevel');

        if (avgRisk < 2) {
            riskElement.textContent = 'Baixo';
            riskElement.className = 'metric-value risk-indicator risk-low';
        } else if (avgRisk < 4) {
            riskElement.textContent = 'Médio';
            riskElement.className = 'metric-value risk-indicator risk-medium';
        } else {
            riskElement.textContent = 'Alto';
            riskElement.className = 'metric-value risk-indicator risk-high';
        }
    }

    // ═══════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════

    setupEventListeners() {
        // Add Asset Form
        document.getElementById('addAssetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const crypto = document.getElementById('assetSelect').value;
            const quantity = parseFloat(document.getElementById('quantityInput').value);

            if (crypto && quantity > 0) {
                this.createCryptoAsset(crypto, quantity);
                e.target.reset();
            }
        });

        // Stress Test
        document.getElementById('stressTestBtn').addEventListener('click', () => {
            this.stressTest();
        });

        // Reset Positions
        document.getElementById('resetZoneBtn').addEventListener('click', () => {
            this.resetPositions();
        });

        // Save Portfolio
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.savePortfolio();
        });

        // Clear All
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todo o portfólio?')) {
                this.clearPortfolio();
            }
        });

        // Pause/Resume
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        // Toggle Gravity
        document.getElementById('gravityBtn').addEventListener('click', () => {
            this.toggleGravity();
        });

        // Modal Close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('assetModal').addEventListener('click', (e) => {
            if (e.target.id === 'assetModal') {
                this.closeModal();
            }
        });

        // Remove Asset from Modal
        document.getElementById('removeAssetBtn').addEventListener('click', () => {
            if (this.selectedAsset) {
                this.removeAsset(this.selectedAsset);
                this.closeModal();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    // ═══════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════

    stressTest() {
        // Apply random forces to all bodies
        this.Composite.allBodies(this.world).forEach(body => {
            if (!body.isStatic) {
                const forceMagnitude = 0.05 * body.mass;
                this.Body.applyForce(body, body.position, {
                    x: (Math.random() - 0.5) * forceMagnitude,
                    y: (Math.random() - 0.5) * forceMagnitude
                });
            }
        });
    }

    resetPositions() {
        const width = this.canvasContainer.clientWidth;
        const height = this.canvasContainer.clientHeight;

        this.Composite.allBodies(this.world).forEach(body => {
            if (!body.isStatic && body.label !== 'safeZone') {
                this.Body.setPosition(body, {
                    x: width / 2 + (Math.random() - 0.5) * 200,
                    y: height / 2
                });
                this.Body.setVelocity(body, { x: 0, y: 0 });
                this.Body.setAngularVelocity(body, 0);
            }
        });
    }

    savePortfolio() {
        const portfolioData = this.portfolio.map(asset => ({
            crypto: asset.crypto,
            quantity: asset.quantity,
            timestamp: asset.timestamp
        }));

        localStorage.setItem('cryptoPhysicsPortfolio', JSON.stringify(portfolioData));
        alert('💾 Portfólio salvo com sucesso!');
    }

    loadSavedPortfolio() {
        const saved = localStorage.getItem('cryptoPhysicsPortfolio');
        if (saved) {
            try {
                const portfolioData = JSON.parse(saved);
                portfolioData.forEach(asset => {
                    setTimeout(() => {
                        this.createCryptoAsset(asset.crypto, asset.quantity);
                    }, 100);
                });
            } catch (error) {
                console.error('Erro ao carregar portfólio salvo:', error);
            }
        }
    }

    clearPortfolio() {
        this.Composite.allBodies(this.world).forEach(body => {
            if (!body.isStatic && body.label !== 'safeZone') {
                this.Composite.remove(this.world, body);
            }
        });
        this.portfolio = [];
        this.updateMetrics();
        localStorage.removeItem('cryptoPhysicsPortfolio');
    }

    removeAsset(body) {
        this.Composite.remove(this.world, body);
        this.portfolio = this.portfolio.filter(asset => asset.body !== body);
        this.updateMetrics();
    }

    togglePause() {
        const btn = document.getElementById('pauseBtn');
        if (this.isPaused) {
            this.Runner.run(this.runner, this.engine);
            btn.textContent = '⏸️';
            this.isPaused = false;
        } else {
            this.Runner.stop(this.runner);
            btn.textContent = '▶️';
            this.isPaused = true;
        }
    }

    toggleGravity() {
        this.hasGravity = !this.hasGravity;
        this.engine.world.gravity.y = this.hasGravity ? 1 : 0;
        document.getElementById('gravityBtn').textContent = this.hasGravity ? '🌍' : '🚀';
    }

    // ═══════════════════════════════════════════════════════════
    // MODAL
    // ═══════════════════════════════════════════════════════════

    openAssetModal(body) {
        if (!body.cryptoData) return;

        this.selectedAsset = body;
        const { type, quantity } = body.cryptoData;
        const price = this.prices[type]?.usd || 0;
        const change24h = this.prices[type]?.usd_24h_change || 0;
        const value = price * quantity;

        const modal = document.getElementById('assetModal');
        const title = document.getElementById('modalTitle');
        const bodyContent = document.getElementById('modalBody');

        const cryptoNames = {
            bitcoin: '₿ Bitcoin',
            ethereum: 'Ξ Ethereum',
            solana: '◎ Solana',
            binancecoin: '◆ Binance Coin',
            cardano: '₳ Cardano',
            dogecoin: '🐕 Dogecoin',
            'shiba-inu': '🐕 Shiba Inu'
        };

        title.textContent = cryptoNames[type] || type;

        bodyContent.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Quantidade:</span>
                <span class="detail-value">${quantity.toFixed(6)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Preço Atual:</span>
                <span class="detail-value">$${price.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Mudança 24h:</span>
                <span class="detail-value" style="color: ${change24h >= 0 ? '#14F195' : '#FF1493'}">
                    ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Valor Total:</span>
                <span class="detail-value">$${value.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Velocidade:</span>
                <span class="detail-value">${this.Vector.magnitude(body.velocity).toFixed(2)} px/s</span>
            </div>
        `;

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('assetModal').classList.remove('active');
        this.selectedAsset = null;
    }

    // ═══════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════

    handleResize() {
        const width = this.canvasContainer.clientWidth;
        const height = this.canvasContainer.clientHeight;

        this.render.canvas.width = width;
        this.render.canvas.height = height;
        this.render.options.width = width;
        this.render.options.height = height;

        this.Render.lookAt(this.render, {
            min: { x: 0, y: 0 },
            max: { x: width, y: height }
        });
    }
}

// ═══════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
    window.cryptoPhysics = new CryptoPhysicsEngine();

    // Refresh prices every 60 seconds
    setInterval(() => {
        window.cryptoPhysics.loadPrices();
    }, 60000);
});
