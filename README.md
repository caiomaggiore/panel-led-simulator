# Simulador CAVE - Documentação Técnica

## 📋 Visão Geral

O **Simulador CAVE** é uma aplicação web avançada para visualização e configuração de ambientes CAVE (Cave Automatic Virtual Environment) com painéis LED curvos. Desenvolvido com Three.js, oferece controle preciso sobre geometria, curvatura e texturas em tempo real.

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos
```
simulador-cave/
├── index.html              # Interface principal
├── script.js               # Core Three.js e lógica de geometria
├── style.css              # Estilos e layout responsivo
├── package.json           # Metadados e dependências (sugerido)
└── README.md              # Esta documentação
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
- **Synchronized Controls**: Sliders + inputs numéricos
- **Real-time Updates**: Atualização instantânea da geometria

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

## 🔧 Configuração e Uso

### Presets Disponíveis
- **CAVE (+45°)**: Configuração imersiva padrão
- **CAVE (+90°)**: Imersão máxima
- **Expansivo (-45°)**: Formato aberto médio  
- **Expansivo (-90°)**: Formato aberto máximo
- **Plano (0°)**: Painel reto sem curvas
- **Debug Curva (±15°)**: Teste com raio aumentado

### Fluxo de Desenvolvimento
1. Ajustar dimensões básicas
2. Configurar ângulos desejados
3. Afinar raio da curva
4. Aplicar texturas/cores
5. Usar debug para validar continuidade

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

---

## 🏆 Status: Produção ✅

Sistema completamente funcional com todas as funcionalidades implementadas e testadas. Geometria matematicamente correta e interface intuitiva.
