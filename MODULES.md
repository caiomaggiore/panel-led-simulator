# Estrutura Modular - Simulador CAVE

## 📁 Organização dos Módulos

### 🎯 **Arquitetura Modular**
O sistema foi reorganizado para facilitar manutenção e futuras expansões. Cada módulo tem responsabilidades específicas e bem definidas.

```
simulador-cave/
├── index.html              # Interface HTML pura
├── script-core.js          # ⚡ Core 3D (Three.js, geometria, renderização)
├── modules/
│   ├── ui-controls.js      # 🎛️ Controles de interface e eventos
│   ├── presets.js          # 💾 Sistema de presets e configurações
│   └── debug-tools.js      # 🔧 Ferramentas de debug e visualização
├── style.css              # 🎨 Estilos e layout
└── [outros arquivos...]
```

## 🔧 Módulos Detalhados

### ⚡ **script-core.js** - Sistema Principal
**Responsabilidade**: Core 3D e funcionalidades essenciais

#### Funções Principais:
- `init()` - Inicialização da cena Three.js
- `createGeometry()` - Criação e deformação de geometria
- `loadCenterTexture()` / `loadFloorTexture()` - Carregamento de texturas
- `animate()` - Loop de renderização
- `onWindowResize()` - Responsividade

#### Variáveis Globais:
- `scene`, `camera`, `renderer`, `controls`
- `centerWall`, `floorMesh`
- `textureLoader`, `centerTexture`, `floorTexture`

### 🎛️ **modules/ui-controls.js** - Controles de Interface
**Responsabilidade**: Gerenciamento de eventos e sincronização de controles

#### Funções Principais:
- `setupControls()` - Configuração de todos os event listeners
- `setSliderValue()` - Utilitário para definir valores de sliders

#### Funcionalidades:
- Sincronização slider ↔ input numérico
- Eventos de abas e sub-abas
- Formatação de valores (°, %)
- Eventos de cor

### 💾 **modules/presets.js** - Sistema de Presets
**Responsabilidade**: Gerenciamento de configurações salvas

#### Funções Principais:
- `applyPreset()` - Aplicar preset por nome
- `applyConfiguration()` - Aplicar configuração completa
- `getCurrentConfiguration()` - Capturar estado atual
- `saveCurrentPreset()` - Salvar no localStorage
- `showPresetTab()` - Navegação entre abas de preset
- `initializePresets()` - Inicialização do sistema

#### Dados:
- `defaultConfig` - Configuração padrão imutável
- LocalStorage para persistência

### 🔧 **modules/debug-tools.js** - Ferramentas de Debug
**Responsabilidade**: Visualização e análise de geometria

#### Funções Principais:
- `addDebugLines()` - Criar linhas de visualização
- `toggleDebugLines()` - Alternar visibilidade do debug

#### Funcionalidades:
- Linhas coloridas nos pontos críticos
- Esferas marcadoras
- Linha de continuidade horizontal
- Sistema de limpeza automática

## 🔄 Fluxo de Inicialização

```javascript
1. DOM Content Loaded
2. init() - Core 3D
3. setupControls() - UI Controls
4. initializePresets() - Presets
5. animate() - Loop de renderização
```

## 🎯 Vantagens da Modularização

### ✅ **Manutenibilidade**
- Código organizado por responsabilidade
- Fácil localização de funcionalidades
- Debugging mais eficiente

### ✅ **Escalabilidade**
- Novos módulos podem ser adicionados facilmente
- Funcionalidades independentes
- Reutilização de código

### ✅ **Colaboração**
- Desenvolvedores podem trabalhar em módulos específicos
- Menor risco de conflitos
- Testes isolados

### ✅ **Performance**
- Carregamento otimizado
- Funções específicas por contexto
- Menor acoplamento

## 🚀 Adicionando Novos Módulos

### Estrutura Recomendada:
```javascript
// modules/nova-funcionalidade.js

// Comentário descritivo da responsabilidade
// Funcionalidade específica - Descrição detalhada

// Variáveis locais do módulo
let moduleVariable = null;

// Função principal
function mainFunction() {
    // Implementação
}

// Função de inicialização (se necessário)
function initializeModule() {
    // Setup do módulo
}

// Exportar funções se necessário
```

### Regras de Desenvolvimento:
1. **Não duplicar código** existente nos outros módulos
2. **Usar funções do core** quando necessário
3. **Manter responsabilidades bem definidas**
4. **Documentar funcionalidades novas**
5. **Testar isoladamente** antes de integrar

## 📋 Dependências Entre Módulos

```
script-core.js (base)
    ↓
ui-controls.js (depende do core)
    ↓
presets.js (depende de ui-controls)
    ↓
debug-tools.js (depende do core)
```

### Ordem de Carregamento:
1. **script-core.js** - Base obrigatória
2. **ui-controls.js** - Controles de interface
3. **presets.js** - Sistema de configurações
4. **debug-tools.js** - Ferramentas auxiliares

---

## 🏆 Status: Modularização Completa ✅

Sistema completamente modularizado com responsabilidades bem definidas e estrutura preparada para futuras expansões.
