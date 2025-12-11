# ⚛️ CryptoPhysics Portfolio Analyzer

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Matter.js](https://img.shields.io/badge/Matter.js-0.19.0-green)
![Status](https://img.shields.io/badge/status-active-success)

**Visualize seu portfólio cripto através da física 2D interativa!**

Uma ferramenta revolucionária onde cada criptomoeda é representada por objetos físicos com propriedades que refletem suas características reais: volatilidade, estabilidade e risco.

---

## 🎯 Conceito

CryptoPhysics transforma dados abstratos de investimento em experiências visuais tangíveis:

- **Bitcoin** = Rocha pesada e estável 🟧
- **Ethereum** = Tijolo sólido e confiável 🟦
- **Solana** = Pentágono ágil e responsivo 🟩
- **Memecoins** = Nuvem caótica de partículas 🌸

## 🚀 Funcionalidades

### ✨ Física Realista
- **Massa** proporcional à capitalização de mercado
- **Fricção** baseada em estabilidade histórica
- **Restituição (bounce)** reflete volatilidade
- **Formas geométricas** representam categorias

### 📊 Métricas em Tempo Real
- Valor total do portfólio (USD)
- Análise de risco (Baixo/Médio/Alto)
- Taxa de diversificação (%)
- Contador de ativos

### 🎮 Interatividade
- **Arrastar & Soltar**: Movimente seus ativos
- **Duplo Clique**: Veja detalhes completos
- **Stress Test**: Simule turbulência de mercado
- **Controle de Gravidade**: Ative/desative física gravitacional
- **Pausar/Retomar**: Congele a simulação

### 💾 Persistência
- Salvar portfólio no LocalStorage
- Carregar automaticamente na próxima visita
- Limpar tudo com confirmação

---

## 🛠️ Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Matter.js** | 0.19.0 | Engine de física 2D |
| **Chart.js** | 4.4.0 | Gráficos (preparado para futuras features) |
| **CoinGecko API** | v3 | Preços em tempo real |
| **LocalStorage** | - | Persistência do portfólio |
| **Vanilla JS** | ES6+ | Lógica da aplicação |

---

## 📐 Arquitetura dos Ativos

### 🟧 Bitcoin (BTC) - "A Rocha"
```javascript
Forma: Quadrado 80x80px
Massa: 100 (muito pesado)
Fricção: 0.9 (alta estabilidade)
Restituição: 0.1 (quase não quica)
Cor: #F7931A (Laranja neon)
```

### 🟦 Ethereum (ETH) - "O Tijolo"
```javascript
Forma: Retângulo 70x70px
Massa: 80
Fricção: 0.8
Restituição: 0.2
Cor: #627EEA (Azul neon)
```

### 🟩 Solana (SOL) - "O Pentágono"
```javascript
Forma: Pentágono regular 60px
Massa: 50
Fricção: 0.5
Restituição: 0.4
Cor: #14F195 (Verde neon)
```

### 🟨 Binance Coin (BNB) - "O Diamante"
```javascript
Forma: Losango 65px
Massa: 60
Fricção: 0.7
Restituição: 0.3
Cor: #F3BA2F (Amarelo neon)
```

### 🔵 Cardano (ADA) - "O Hexágono"
```javascript
Forma: Hexágono 55px
Massa: 40
Fricção: 0.6
Restituição: 0.35
Cor: #0033AD (Azul escuro)
```

### 🌸 Memecoin (DOGE/SHIB) - "Nuvem Caótica"
```javascript
Forma: 10-20 círculos pequenos (15px cada)
Massa: 5 por círculo
Fricção: 0.1 (escorrega muito!)
Restituição: 0.95 (super saltitante!)
Cor: #C2A633 (Doge) / #FF1493 (Shib)
```

---

## 🎨 Design System

### Paleta Neon Cyberpunk
```css
--neon-blue: #00d9ff
--neon-pink: #ff006e
--neon-purple: #8338ec
--neon-green: #14F195
--neon-orange: #F7931A

--bg-dark: #0a0e27
--bg-darker: #050816
--bg-card: #1a1f3a
```

### Animações
- Brilho pulsante nos botões
- Transições suaves (0.3s ease)
- Efeito de hover com destaque neon
- Modal com slide-in animado

---

## 🚀 Como Usar

### 1. Instalação Local
```bash
# Clone ou baixe os arquivos
cd CryptoPhysics

# Abra com servidor local (HTTPS recomendado para APIs)
python -m http.server 8000
# ou
npx http-server -p 8000

# Acesse no navegador
http://localhost:8000
```

### 2. Adicionar Ativos
1. Selecione a criptomoeda no dropdown
2. Insira a quantidade (ex: 0.5 BTC)
3. Clique em "➕ Adicionar ao Portfólio"
4. Observe o ativo aparecer com física realista!

### 3. Interagir
- **Arrastar**: Clique e segure qualquer ativo
- **Detalhes**: Duplo clique em um ativo
- **Stress Test**: Botão "🌊 Stress Test" aplica forças aleatórias
- **Gravidade**: Botão "🌍" alterna entre com/sem gravidade

### 4. Salvar Progresso
- Clique em "💾 Salvar Carteira"
- Dados ficam no LocalStorage
- Carrega automaticamente na próxima visita

---

## 📊 API de Preços

### CoinGecko Public API
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Parâmetros**: IDs das moedas, USD, mudança 24h
- **Rate Limit**: ~50 chamadas/minuto (modo público)
- **Cache**: Atualização automática a cada 60 segundos

### Fallback
Se a API falhar, usa preços de backup hardcoded para garantir funcionamento offline.

---

## 🎯 Métricas Calculadas

### Valor Total
```javascript
Σ (quantidade × preço_atual)
```

### Nível de Risco
```javascript
risco_médio = Σ(|mudança_24h| × valor) / valor_total

< 2% = Baixo (verde)
2-4% = Médio (laranja)
> 4% = Alto (rosa)
```

### Diversificação
```javascript
diversificação = (criptos_únicas / 7) × 100%
```

---

## 🔮 Roadmap Futuro

### Fase 2 - Análise Avançada
- [ ] Gráficos históricos com Chart.js
- [ ] Comparação de portfolios
- [ ] Heat map de correlação entre ativos
- [ ] Exportar PDF com relatório

### Fase 3 - Social & Gamificação
- [ ] Compartilhar portfólio via link
- [ ] Competições de diversificação
- [ ] Achievements por estratégias
- [ ] Integração com exchanges (via API)

### Fase 4 - AI & Predição
- [ ] Sugestões de rebalanceamento
- [ ] Alertas de volatilidade
- [ ] Simulador de cenários (bull/bear market)

---

## 🐛 Problemas Conhecidos

1. **Text Rendering**: Matter.js não renderiza texto nativamente - versão futura usará canvas overlay
2. **Performance**: +50 objetos simultâneos pode diminuir FPS em dispositivos antigos
3. **Mobile**: Touch events funcionam, mas melhor experiência em desktop

---

## 📜 Licença

MIT License - Use livremente, com atribuição!

---

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças grandes:
1. Abra uma issue primeiro
2. Fork o projeto
3. Crie sua feature branch
4. Commit suas mudanças
5. Push para a branch
6. Abra um Pull Request

---

## 📞 Suporte

**Problemas com a API?** Verifique o console do navegador
**Física estranha?** Tente "🎯 Resetar Posições"
**Não salva?** Verifique se LocalStorage está habilitado

---

## 🌟 Créditos

- **Matter.js** - Brm (https://brm.io/matter-js/)
- **CoinGecko** - API de preços gratuita
- **Design Inspiration** - Cyberpunk 2077, Tron, Matrix

---

**Desenvolvido com ⚛️ por Claude Code**
*Onde física encontra finanças!*
