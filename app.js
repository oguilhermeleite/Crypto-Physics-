// ═══════════════════════════════════════════════════════════
// CRYPTOPHYSICS PORTFOLIO ANALYZER - TETRIS EDITION
// Sistema de Visualização com Blocos que se Encaixam
// ═══════════════════════════════════════════════════════════

class CryptoTetrisEngine {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('tetrisCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Grid configuration
        this.cellSize = 20; // Tamanho de cada célula do grid
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.grid = [];

        // Portfolio data
        this.portfolio = [];
        this.blocks = [];
        this.prices = {};

        // Animation state
        this.fallingBlock = null;
        this.animationFrame = null;

        // Selected block for modal
        this.selectedBlock = null;

        // Initialize
        this.init();
    }

    // ═══════════════════════════════════════════════════════════
    // INICIALIZAÇÃO
    // ═══════════════════════════════════════════════════════════

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadPrices();
        this.loadSavedPortfolio();
        this.startRenderLoop();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.canvas.width = width;
        this.canvas.height = height;

        // Calculate grid dimensions (70% of canvas width for play area)
        const playWidth = Math.floor(width * 0.7);
        this.gridWidth = Math.floor(playWidth / this.cellSize);
        this.gridHeight = Math.floor(height / this.cellSize);

        // Initialize empty grid
        this.grid = Array(this.gridHeight).fill(null).map(() =>
            Array(this.gridWidth).fill(null)
        );

        this.offsetX = (width - (this.gridWidth * this.cellSize)) / 2;
        this.offsetY = 20;
    }

    // ═══════════════════════════════════════════════════════════
    // DEFINIÇÃO DE FORMAS (TETRIS SHAPES)
    // ═══════════════════════════════════════════════════════════

    getShapeDefinition(crypto, quantity) {
        // Quantidade afeta o número de blocos (mais quantidade = mais blocos)
        const multiplier = Math.ceil(quantity);

        switch (crypto) {
            case 'bitcoin':
                // Quadrado 4x4 laranja
                return {
                    shape: [
                        [1, 1, 1, 1],
                        [1, 1, 1, 1],
                        [1, 1, 1, 1],
                        [1, 1, 1, 1]
                    ],
                    color: '#F7931A',
                    borderColor: '#ff9500',
                    label: '₿',
                    count: Math.min(multiplier, 3) // Máximo 3 blocos BTC
                };

            case 'ethereum':
                // Retângulo 4x3 azul
                return {
                    shape: [
                        [1, 1, 1, 1],
                        [1, 1, 1, 1],
                        [1, 1, 1, 1]
                    ],
                    color: '#627EEA',
                    borderColor: '#3c3c3d',
                    label: 'Ξ',
                    count: Math.min(multiplier, 4)
                };

            case 'solana':
                // L-Shape 3x3 verde
                return {
                    shape: [
                        [1, 0, 0],
                        [1, 0, 0],
                        [1, 1, 1]
                    ],
                    color: '#14F195',
                    borderColor: '#00ff88',
                    label: '◎',
                    count: Math.min(multiplier, 5)
                };

            case 'cardano':
                // T-Shape 3x2 azul escuro
                return {
                    shape: [
                        [1, 1, 1],
                        [0, 1, 0]
                    ],
                    color: '#0033AD',
                    borderColor: '#3399ff',
                    label: '₳',
                    count: Math.min(multiplier, 5)
                };

            case 'dogecoin':
            case 'shiba-inu':
                // Cubinhos 1x1 rosa (4-6 blocos)
                const cubeCount = Math.min(4 + Math.floor(quantity * 2), 10);
                return {
                    shape: [[1]],
                    color: crypto === 'dogecoin' ? '#C2A633' : '#FF1493',
                    borderColor: crypto === 'dogecoin' ? '#FFD700' : '#ff69b4',
                    label: '🐕',
                    count: cubeCount
                };

            default:
                return {
                    shape: [[1, 1], [1, 1]],
                    color: '#00d9ff',
                    borderColor: '#0099cc',
                    label: '?',
                    count: 1
                };
        }
    }

    // ═══════════════════════════════════════════════════════════
    // ADICIONAR BLOCOS AO PORTFÓLIO
    // ═══════════════════════════════════════════════════════════

    addAsset(crypto, quantity) {
        const definition = this.getShapeDefinition(crypto, quantity);

        for (let i = 0; i < definition.count; i++) {
            const block = {
                id: Date.now() + i,
                crypto: crypto,
                quantity: quantity / definition.count,
                shape: definition.shape,
                color: definition.color,
                borderColor: definition.borderColor,
                label: definition.label,
                x: Math.floor(this.gridWidth / 2) - Math.floor(definition.shape[0].length / 2),
                y: -definition.shape.length,
                placed: false
            };

            this.blocks.push(block);
            this.portfolio.push({
                crypto: crypto,
                quantity: quantity / definition.count,
                block: block,
                timestamp: Date.now() + i
            });

            // Animar queda com delay
            setTimeout(() => {
                this.dropBlock(block);
            }, i * 600);
        }

        this.updateMetrics();
    }

    // ═══════════════════════════════════════════════════════════
    // SISTEMA DE QUEDA E ENCAIXE
    // ═══════════════════════════════════════════════════════════

    dropBlock(block) {
        this.fallingBlock = block;

        const dropInterval = setInterval(() => {
            if (!this.canMove(block, 0, 1)) {
                // Chegou no chão ou em outro bloco
                this.placeBlock(block);
                this.fallingBlock = null;
                this.createPlaceEffect(block);
                clearInterval(dropInterval);
            } else {
                block.y++;
            }
        }, 100); // Velocidade de queda: 100ms por célula
    }

    canMove(block, dx, dy) {
        const newX = block.x + dx;
        const newY = block.y + dy;

        for (let row = 0; row < block.shape.length; row++) {
            for (let col = 0; col < block.shape[row].length; col++) {
                if (block.shape[row][col]) {
                    const gridX = newX + col;
                    const gridY = newY + row;

                    // Check boundaries
                    if (gridX < 0 || gridX >= this.gridWidth || gridY >= this.gridHeight) {
                        return false;
                    }

                    // Check collision with placed blocks
                    if (gridY >= 0 && this.grid[gridY] && this.grid[gridY][gridX]) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    placeBlock(block) {
        block.placed = true;

        // Add to grid
        for (let row = 0; row < block.shape.length; row++) {
            for (let col = 0; col < block.shape[row].length; col++) {
                if (block.shape[row][col]) {
                    const gridY = block.y + row;
                    const gridX = block.x + col;

                    if (gridY >= 0 && gridY < this.gridHeight && gridX >= 0 && gridX < this.gridWidth) {
                        this.grid[gridY][gridX] = block;
                    }
                }
            }
        }

        this.updateMetrics();
    }

    // ═══════════════════════════════════════════════════════════
    // REORGANIZAR BLOCOS (OTIMIZAÇÃO)
    // ═══════════════════════════════════════════════════════════

    reorganizeBlocks() {
        // Clear grid
        this.grid = Array(this.gridHeight).fill(null).map(() =>
            Array(this.gridWidth).fill(null)
        );

        // Reset all blocks
        this.blocks.forEach(block => {
            block.placed = false;
            block.y = -block.shape.length;
        });

        // Re-place all blocks optimally
        this.blocks.forEach((block, index) => {
            setTimeout(() => {
                this.findOptimalPosition(block);
                this.placeBlock(block);
                this.createPlaceEffect(block);
            }, index * 200);
        });
    }

    findOptimalPosition(block) {
        // Try to find best X position (centered or filling gaps)
        for (let x = 0; x <= this.gridWidth - block.shape[0].length; x++) {
            block.x = x;

            // Drop from top
            for (let y = 0; y < this.gridHeight; y++) {
                block.y = y;
                if (!this.canMove(block, 0, 1)) {
                    return; // Found position
                }
            }
        }

        // Fallback: center
        block.x = Math.floor(this.gridWidth / 2) - Math.floor(block.shape[0].length / 2);
        block.y = 0;
    }

    // ═══════════════════════════════════════════════════════════
    // EFEITOS VISUAIS
    // ═══════════════════════════════════════════════════════════

    createPlaceEffect(block) {
        // Particle effect quando bloco encaixa
        const centerX = (block.x + block.shape[0].length / 2) * this.cellSize + this.offsetX;
        const centerY = (block.y + block.shape.length / 2) * this.cellSize + this.offsetY;

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.createParticle(centerX, centerY, block.color);
            }, i * 20);
        }
    }

    createParticle(x, y, color) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        let px = x;
        let py = y;
        let vx = Math.cos(angle) * speed;
        let vy = Math.sin(angle) * speed;
        let life = 30;

        const animateParticle = () => {
            if (life-- <= 0) return;

            this.ctx.save();
            this.ctx.globalAlpha = life / 30;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            px += vx;
            py += vy;
            vy += 0.2; // Gravity

            requestAnimationFrame(animateParticle);
        };

        animateParticle();
    }

    // ═══════════════════════════════════════════════════════════
    // RENDERIZAÇÃO
    // ═══════════════════════════════════════════════════════════

    startRenderLoop() {
        const render = () => {
            this.clear();
            this.drawGrid();
            this.drawBlocks();
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
    }

    clear() {
        this.ctx.fillStyle = '#050816';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.gridWidth; x++) {
            const px = x * this.cellSize + this.offsetX;
            this.ctx.beginPath();
            this.ctx.moveTo(px, this.offsetY);
            this.ctx.lineTo(px, this.gridHeight * this.cellSize + this.offsetY);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.gridHeight; y++) {
            const py = y * this.cellSize + this.offsetY;
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, py);
            this.ctx.lineTo(this.gridWidth * this.cellSize + this.offsetX, py);
            this.ctx.stroke();
        }
    }

    drawBlocks() {
        this.blocks.forEach(block => {
            if (block.y >= -block.shape.length) { // Only draw visible blocks
                this.drawBlock(block);
            }
        });
    }

    drawBlock(block) {
        for (let row = 0; row < block.shape.length; row++) {
            for (let col = 0; col < block.shape[row].length; col++) {
                if (block.shape[row][col]) {
                    const x = (block.x + col) * this.cellSize + this.offsetX;
                    const y = (block.y + row) * this.cellSize + this.offsetY;

                    // Draw cell with glow
                    this.ctx.save();

                    // Glow effect
                    this.ctx.shadowColor = block.color;
                    this.ctx.shadowBlur = 15;

                    // Fill
                    this.ctx.fillStyle = block.color;
                    this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

                    // Border
                    this.ctx.strokeStyle = block.borderColor;
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

                    this.ctx.restore();

                    // Draw label on center cell
                    if (row === Math.floor(block.shape.length / 2) &&
                        col === Math.floor(block.shape[row].length / 2)) {
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.font = 'bold 12px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(block.label, x + this.cellSize / 2, y + this.cellSize / 2);
                    }
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // INTERAÇÃO COM CLIQUE
    // ═══════════════════════════════════════════════════════════

    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Convert to grid coordinates
        const gridX = Math.floor((mouseX - this.offsetX) / this.cellSize);
        const gridY = Math.floor((mouseY - this.offsetY) / this.cellSize);

        if (gridY >= 0 && gridY < this.gridHeight && gridX >= 0 && gridX < this.gridWidth) {
            const block = this.grid[gridY][gridX];
            if (block) {
                this.openAssetModal(block);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MODAL DE DETALHES
    // ═══════════════════════════════════════════════════════════

    openAssetModal(block) {
        this.selectedBlock = block;
        const { crypto, quantity } = block;
        const price = this.prices[crypto]?.usd || 0;
        const change24h = this.prices[crypto]?.usd_24h_change || 0;
        const value = price * quantity;

        const modal = document.getElementById('assetModal');
        const title = document.getElementById('modalTitle');
        const bodyContent = document.getElementById('modalBody');

        const cryptoNames = {
            bitcoin: '₿ Bitcoin',
            ethereum: 'Ξ Ethereum',
            solana: '◎ Solana',
            cardano: '₳ Cardano',
            dogecoin: '🐕 Dogecoin',
            'shiba-inu': '🐕 Shiba Inu'
        };

        title.textContent = cryptoNames[crypto] || crypto;

        const absChange = Math.abs(change24h);
        let volatilityClass = 'Baixa';
        let volatilityColor = '#14F195';
        if (absChange > 5) {
            volatilityClass = 'Extrema';
            volatilityColor = '#FF1493';
        } else if (absChange > 2) {
            volatilityClass = 'Alta';
            volatilityColor = '#ff9500';
        } else if (absChange > 1) {
            volatilityClass = 'Média';
            volatilityColor = '#00d9ff';
        }

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
                <span class="detail-label">Volatilidade:</span>
                <span class="detail-value" style="color: ${volatilityColor}">
                    ${volatilityClass} (${absChange.toFixed(2)}%)
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Valor Total:</span>
                <span class="detail-value">$${value.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Posição Grid:</span>
                <span class="detail-value">X:${block.x} Y:${block.y}</span>
            </div>
        `;

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('assetModal').classList.remove('active');
        this.selectedBlock = null;
    }

    removeAsset(block) {
        // Remove from blocks array
        this.blocks = this.blocks.filter(b => b.id !== block.id);

        // Remove from portfolio
        this.portfolio = this.portfolio.filter(p => p.block.id !== block.id);

        // Remove from grid
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x]?.id === block.id) {
                    this.grid[y][x] = null;
                }
            }
        }

        // Reorganize remaining blocks
        setTimeout(() => {
            this.reorganizeBlocks();
        }, 300);

        this.updateMetrics();
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTRICAS E PREÇOS
    // ═══════════════════════════════════════════════════════════

    updateMetrics() {
        // Count unique assets
        const uniqueAssets = new Set(this.portfolio.map(p => p.crypto));
        document.getElementById('assetCount').textContent = uniqueAssets.size;

        // Calculate total value
        let totalValue = 0;
        this.portfolio.forEach(p => {
            const price = this.prices[p.crypto]?.usd || 0;
            totalValue += price * p.quantity;
        });
        document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;

        // Calculate stack height
        let maxHeight = 0;
        for (let y = 0; y < this.gridHeight; y++) {
            if (this.grid[y].some(cell => cell !== null)) {
                maxHeight = this.gridHeight - y;
                break;
            }
        }
        document.getElementById('stackHeight').textContent = maxHeight;

        // Block count
        document.getElementById('blockCount').textContent = `Blocos: ${this.blocks.length}`;

        // Diversification (max 6 types: BTC, ETH, SOL, ADA, DOGE, SHIB)
        const diversification = Math.min((uniqueAssets.size / 6) * 100, 100);
        document.getElementById('diversification').textContent = `${diversification.toFixed(0)}%`;
        document.getElementById('diversificationBar').style.width = `${diversification}%`;

        // Risk calculation
        let totalRisk = 0;
        let totalWeight = 0;

        this.portfolio.forEach(p => {
            const price = this.prices[p.crypto]?.usd || 0;
            const change = Math.abs(this.prices[p.crypto]?.usd_24h_change || 0);
            const weight = price * p.quantity;
            totalRisk += change * weight;
            totalWeight += weight;
        });

        const avgRisk = totalWeight > 0 ? totalRisk / totalWeight : 0;
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

    async loadPrices() {
        try {
            const ids = 'bitcoin,ethereum,solana,cardano,dogecoin,shiba-inu';
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
            );
            this.prices = await response.json();
            this.updateMetrics();
        } catch (error) {
            console.error('Erro ao carregar preços:', error);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PERSISTÊNCIA
    // ═══════════════════════════════════════════════════════════

    savePortfolio() {
        const data = {
            portfolio: this.portfolio.map(p => ({
                crypto: p.crypto,
                quantity: p.quantity,
                timestamp: p.timestamp
            })),
            timestamp: Date.now()
        };
        localStorage.setItem('cryptoTetrisPortfolio', JSON.stringify(data));
        alert('💾 Carteira salva com sucesso!');
    }

    loadSavedPortfolio() {
        const saved = localStorage.getItem('cryptoTetrisPortfolio');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Group by crypto and sum quantities
                const grouped = {};
                data.portfolio.forEach(p => {
                    if (!grouped[p.crypto]) {
                        grouped[p.crypto] = 0;
                    }
                    grouped[p.crypto] += p.quantity;
                });

                // Add with delays
                Object.entries(grouped).forEach(([crypto, quantity], index) => {
                    setTimeout(() => {
                        this.addAsset(crypto, quantity);
                    }, index * 1000);
                });
            } catch (error) {
                console.error('Erro ao carregar portfólio:', error);
            }
        }
    }

    clearPortfolio() {
        this.blocks = [];
        this.portfolio = [];
        this.grid = Array(this.gridHeight).fill(null).map(() =>
            Array(this.gridWidth).fill(null)
        );
        this.updateMetrics();
        localStorage.removeItem('cryptoTetrisPortfolio');
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
                this.addAsset(crypto, quantity);
                e.target.reset();
            }
        });

        // Canvas click
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });

        // How It Works Modal
        document.getElementById('howItWorksBtn').addEventListener('click', () => {
            document.getElementById('howItWorksModal').classList.add('active');
        });

        document.getElementById('closeHowItWorks').addEventListener('click', () => {
            document.getElementById('howItWorksModal').classList.remove('active');
        });

        document.getElementById('howItWorksModal').addEventListener('click', (e) => {
            if (e.target.id === 'howItWorksModal') {
                document.getElementById('howItWorksModal').classList.remove('active');
            }
        });

        // Reorganize
        document.getElementById('reorganizeBtn').addEventListener('click', () => {
            this.reorganizeBlocks();
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
            if (this.selectedBlock) {
                this.removeAsset(this.selectedBlock);
                this.closeModal();
            }
        });

        // Mobile Menu Toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileOverlay');

        const toggleMobileMenu = () => {
            sidebar.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');

            if (sidebar.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        };

        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
        mobileOverlay.addEventListener('click', toggleMobileMenu);

        sidebar.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && e.target.classList.contains('btn')) {
                setTimeout(() => {
                    if (sidebar.classList.contains('active')) {
                        toggleMobileMenu();
                    }
                }, 300);
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();

            if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                mobileOverlay.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
    window.cryptoTetris = new CryptoTetrisEngine();

    // Refresh prices every 60 seconds
    setInterval(() => {
        window.cryptoTetris.loadPrices();
    }, 60000);
});
