# Arquitetura e Documentação Técnica - Simulador CAVE

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos
```
simulador-cave/
├── index.html              # Interface principal (HTML puro)
├── modules/                # 📦 Sistema modular
│   ├── core.js            # ⚡ Core 3D (Three.js, geometria, texturas)
│   ├── ui-controls.js     # 🎛️ Controles de interface e eventos
│   ├── presets.js         # 💾 Sistema de presets e configurações
│   └── debug-tools.js     # 🔧 Ferramentas de debug e visualização
├── style.css              # 🎨 Estilos e layout responsivo
├── package.json           # Metadados npm v1.2.0
├── manifest.json          # Especificações técnicas v1.2.0
├── README.md              # Documentação do usuário
├── ARCHITECTURE.md        # Esta documentação técnica
├── MODULES.md             # Documentação da estrutura modular
├── CHANGELOG.md           # Histórico de versões
└── .gitignore             # Arquivos ignorados pelo Git
```

### Componentes Principais

#### 1. **Renderização 3D (Three.js)**
- **Scene**: Ambiente 3D principal
- **Camera**: PerspectiveCamera com controles orbitais
- **Renderer**: WebGLRenderer com antialiasing
- **Lighting**: AmbientLight + DirectionalLight

#### 2. **Geometria Procedural**
- **PlaneGeometry**: Base (100x10 segmentos para suavidade)
- **Vertex Deformation**: Manipulação matemática direta
- **Continuous Surface**: Painel único sem quebras

#### 3. **Interface de Usuário**
- **Tab System**: Organização por categoria (Posição/Dimensão/Textura)
- **Preset System**: 4 presets personalizáveis + preset padrão
- **Preset Tabs**: Interface com abas (Presets/Salvamento/Ferramentas)
- **Synchronized Controls**: Sliders + inputs numéricos
- **Real-time Updates**: Atualização instantânea da geometria
- **LocalStorage**: Persistência de configurações

## 🔬 Pontos Críticos Técnicos

### 1. **Algoritmo de Deformação de Vértices**

#### Problema Resolvido
Criar curvas suaves e contínuas que conectem perfeitamente as seções plana, curva e dobrada.

#### Solução Implementada
```javascript
// Divisão em 5 zonas geométricas:
// 1. Seção esquerda dobrada
// 2. Zona de curva esquerda  
// 3. Seção central plana
// 4. Zona de curva direita
// 5. Seção direita dobrada

const leftFoldStart = leftFoldPoint - curveRadius;
const leftFoldEnd = leftFoldPoint + curveRadius;
const rightFoldStart = rightFoldPoint - curveRadius;
const rightFoldEnd = rightFoldPoint + curveRadius;
```

#### Matemática das Curvas
```javascript
// Para ângulos positivos (CAVE tradicional)
if (leftAngle > 0) {
    const angle = Math.abs(leftAngle) * (1 - t);
    newX = -centerWidth/2 - curveRadius * Math.sin(angle);
    newZ = -curveRadius * (1 - Math.cos(angle));
}
// Para ângulos negativos (expansivo) - APENAS Z invertido
else {
    const angle = Math.abs(leftAngle) * (1 - t);
    newX = -centerWidth/2 - curveRadius * Math.sin(angle);
    newZ = curveRadius * (1 - Math.cos(angle)); // Z positivo
}
```

### 2. **Sistema de Coordenadas**

#### Mapeamento Espacial
- **X**: Largura (-totalWidth/2 a +totalWidth/2)
- **Y**: Altura (-height/2 a +height/2) 
- **Z**: Profundidade (negativo = para trás, positivo = para frente)

#### Pontos de Referência
- **Centro**: (0, 0, 0)
- **Dobras**: Calculadas dinamicamente baseadas em largura e raio
- **Transições**: Suavizadas por funções trigonométricas

### 3. **Continuidade Geométrica**

#### Desafio Principal
Garantir que não haja descontinuidades entre:
- Seção plana → Zona de curva
- Zona de curva → Seção dobrada

#### Solução C0 (Continuidade de Posição)
```javascript
// Posição base calculada para conectar perfeitamente
if (leftAngle > 0) {
    baseX = -centerWidth/2 - curveRadius * Math.sin(leftAngle);
    baseZ = -curveRadius * (1 - Math.cos(leftAngle));
} else {
    baseX = -centerWidth/2 - curveRadius * Math.sin(Math.abs(leftAngle));
    baseZ = curveRadius * (1 - Math.cos(Math.abs(leftAngle)));
}
```

### 4. **Progressão Paramétrica**

#### Parâmetro t
- **t = 0**: Início da zona de curva
- **t = 1**: Fim da zona de curva
- **Esquerda**: `angle = |leftAngle| * (1 - t)` (diminui)
- **Direita**: `angle = |rightAngle| * t` (aumenta)

#### Justificativa Matemática
A progressão assimétrica garante que ambas as curvas terminem em ângulo 0 (plano), criando transições naturais.

## 🎛️ Sistema de Controles

### Hierarquia de Dependências
```
Largura Total → Seções Laterais (%) → Pontos de Dobra
     ↓                ↓                      ↓
Ângulos → Raio da Curva → Geometria Final
```

### Validações e Limites
- **Ângulos**: -90° ≤ θ ≤ +90°
- **Seções Laterais**: 0% ≤ w ≤ 50% (cada lado)
- **Raio da Curva**: 0 ≤ r ≤ 2
- **Restrição**: leftWidth + rightWidth ≤ 100%

## 🎨 Sistema de Materiais

### Shader Pipeline
```javascript
const material = new THREE.MeshStandardMaterial({
    color: userColor || '#444444',
    map: loadedTexture,
    side: THREE.DoubleSide  // Visível dos dois lados
});
```

### Mapeamento UV
- **Preservação**: UVs originais mantidos durante deformação
- **Continuidade**: Textura única em toda a superfície
- **Escala**: Controles independentes para X e Y

## 🛠️ Ferramentas de Debug

### Sistema de Linhas de Referência
```javascript
// Código de cores para visualização:
// 🔴 Vermelho: Início da zona de curva
// 🟢 Verde: Fim da zona de curva  
// 🟡 Amarelo: Posição base da seção dobrada
// 🔵 Azul: Centro do painel
// ⚪ Branco: Linha de continuidade
// 🟣 Rosa: Pontos de dobra exatos
// 🔷 Ciano: Extremos das seções
```

### Validação de Continuidade
```javascript
// Linha branca horizontal mostra continuidade matemática
for (let i = 0; i <= numPoints; i++) {
    const x = -totalWidth/2 + totalWidth * (i / numPoints);
    const z = calculateZAtPosition(x); // Mesma lógica da geometria
    points.push(new THREE.Vector3(x, 0, z));
}
```

## 🚀 Otimizações Implementadas

### Performance
- **Geometry Reuse**: Reutilização da mesma geometria base
- **Vertex Update**: Apenas `needsUpdate = true` ao invés de recriar
- **Event Throttling**: Controles sincronizados sem spam

### Memória
- **Single Geometry**: Um PlaneGeometry para todo o painel
- **Debug Cleanup**: Remoção automática de linhas antigas
- **Texture Management**: Carregamento sob demanda

## 📐 Fórmulas Matemáticas Chave

### Posição de Dobra
```
leftFoldPoint = leftSectionWidth
rightFoldPoint = leftSectionWidth + centerWidth
```

### Zona de Curva
```
leftFoldStart = leftFoldPoint - curveRadius
leftFoldEnd = leftFoldPoint + curveRadius
```

### Transformação de Vértices
```
angle(t) = |θ| * progression(t)
newX = centerX ± curveRadius * sin(angle)
newZ = ±curveRadius * (1 - cos(angle))
```

### Seção Dobrada
```
newX = baseX + distance * cos(θ)
newZ = baseZ + distance * sin(|θ|) * direction
```

## 🐛 Troubleshooting

### Problemas Comuns
- **Descontinuidades**: Verificar se raio > 0 quando ângulo ≠ 0
- **Texturas distorcidas**: Ajustar escala X/Y independentemente  
- **Performance**: Reduzir segmentos se necessário (atual: 100x10)

### Debug Steps
1. Ativar "Mostrar/Ocultar Linhas"
2. Verificar alinhamento das linhas coloridas
3. Observar continuidade da linha branca
4. Ajustar parâmetros gradualmente

## 🔧 Configuração de Desenvolvimento

### Dependências
```bash
npm install three@^0.158.0
npm install --save-dev http-server live-server
```

### Scripts de Desenvolvimento
```bash
npm start    # Servidor HTTP simples
npm run dev  # Servidor com live reload
```

### Estrutura de Debugging
- Console logs comentados para performance
- Sistema de linhas visuais toggleable
- Validação matemática em tempo real

---

## 🏆 Status Técnico: Produção ✅

Sistema completamente funcional com todas as funcionalidades implementadas e testadas. Geometria matematicamente correta e arquitetura bem estruturada.
