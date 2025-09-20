# Changelog - Simulador CAVE

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.3.0] - 2024-12-19

### 🎨 Editor UV - MESH TOOL (Adobe Illustrator Style)
- **Mesh Tool Implementado**: Distorção por malha de pontos estilo Adobe Illustrator
- **Interpolação Global**: Todos os pontos influenciam a distorção baseado na distância
- **Curvas Orgânicas**: Distorção natural e suave sem segmentação
- **Modo Único**: Removido modo Photoshop, mantido apenas Mesh Tool

### 💾 Estado Persistente Completo
- **Salvamento Automático**: Estado salvo automaticamente quando pontos são movidos
- **Restauração Perfeita**: Pontos, textura e configurações preservados entre modos
- **Escala Proporcional**: Adaptação automática para diferentes tamanhos de canvas
- **Grade Completa**: Recriação de todos os pontos da grade durante restauração

### 🔧 Correções Críticas
- **Erro `undefined`**: Corrigido problema de pontos undefined na grade
- **Função `getControlPoint`**: Reescrita para cálculo direto por índice
- **Verificações de Segurança**: Adicionadas verificações para pontos inválidos
- **Timing de Renderização**: Delay para garantir processamento completo

### 🎯 FASE 2 - Preview em Tempo Real
- **PIP Funcional**: Preview 3D com distorção aplicada automaticamente
- **Aplicação Automática**: Textura editada aplicada ao piso em tempo real
- **Estado Persistente**: Configurações mantidas entre mudanças de modo
- **Fluxo de Texturas**: Textura-base → Editor → Textura-editada → Piso

### 📊 Performance
- **Otimização de Renderização**: Redução de chamadas desnecessárias
- **Debounce**: Controle de atualizações para melhor performance
- **Cache de Texturas**: Reutilização de texturas processadas

## [1.2.1] - 2024-12-19

### ✨ Editor UV - FASE 1 Completa
- **Modo de Trabalho**: Sistema de alternância Preview 3D ↔ Editor UV
- **Editor UV Fullscreen**: Interface dedicada para edição de distorção
- **PIP Preview 3D**: Preview 3D em Picture-in-Picture (300x180px)
- **Controles Organizados**: Área direita como centro oficial de controles

### 🎛️ Sistema de Influência Avançado
- **Hover Effects**: Pontos aumentam de tamanho ao passar o mouse
- **Sistema de Influência**: Pontos próximos se movem proporcionalmente
- **Controles de Intensidade**: Fraco, Médio (50% padrão), Forte
- **Raio Configurável**: 1 a 5 unidades de grade
- **Margem de Arrasto**: 20px além dos limites para melhor controle

### 🎨 Interface Aprimorada
- **Seletor de Modo**: Topo direito com ícones FontAwesome
- **Layout Responsivo**: PIP + Controles alinhados verticalmente
- **Área de Controles**: Lado direito dedicado para ambos os modos
- **Visual Harmonioso**: Todos os elementos perfeitamente espaçados

### 🔧 Funcionalidades
- **Grade Editável**: 2x2, 3x3, 5x5 com pontos arrastáveis
- **Reset Inteligente**: Volta à grade original
- **Preparado para FASE 2**: Base sólida para preview em tempo real

## [1.2.0] - 2024-12-19

### 🏗️ Refatoração Arquitetural
- **Modularização Completa**: Sistema totalmente reorganizado em módulos
- **Estrutura modules/**: Todos os scripts organizados em pasta dedicada
- **Separação de Responsabilidades**: Core 3D, UI, Presets e Debug isolados

### ✨ Adicionado
- **modules/core.js**: Sistema 3D principal (Three.js, geometria, texturas)
- **modules/ui-controls.js**: Gerenciamento de interface e eventos
- **modules/presets.js**: Sistema de configurações e salvamento
- **modules/debug-tools.js**: Ferramentas de visualização e debug
- **MODULES.md**: Documentação da arquitetura modular

### 🔧 Modificado
- **Estrutura de Arquivos**: Migração para sistema modular
- **Carregamento**: Ordem de importação otimizada
- **Manutenibilidade**: Código organizado por funcionalidade

### 🚫 Removido
- **script.js**: Arquivo monolítico substituído por módulos

### 🎯 Benefícios
- **Escalabilidade**: Fácil adição de novas funcionalidades
- **Manutenção**: Debugging e modificações mais eficientes
- **Colaboração**: Desenvolvimento paralelo em módulos diferentes
- **Reutilização**: Componentes independentes e reutilizáveis

## [1.1.0] - 2024-12-19

### ✨ Adicionado
- **Sistema de Presets Avançado**: 4 presets personalizáveis com salvamento
- **Interface com Abas**: Organização em presets, salvamento e ferramentas
- **Ícones FontAwesome**: Navegação visual com ícones modernos
- **Preset Padrão Realista**: Configuração CAVE (-90°) como padrão
- **LocalStorage**: Persistência de configurações entre sessões
- **Confirmação de Salvamento**: Modal de segurança antes de sobrescrever

### 🔧 Modificado
- **Layout do Painel**: Altura fixa (250px) e largura (240px)
- **Altura dos Botões**: Padronização em 40px para todos
- **Organização do Código**: Scripts movidos do HTML para JS
- **Menu de Controles**: Scroll automático quando necessário
- **Scrollbar Personalizada**: Estilo harmonizado com o tema

### 🚫 Removido
- **Presets de Teste**: Removidos presets genéricos temporários
- **Carregamento Automático**: Removida injeção automática de URLs de textura
- **Scripts Inline**: Todo JavaScript centralizado em script.js

### 🐛 Corrigido
- **Overflow do Menu**: Scroll funcional em telas pequenas
- **Continuidade das Curvas**: Ângulos negativos funcionando perfeitamente
- **Reset Padrão**: Funciona sem quebrar o carregamento de texturas

## [1.0.0] - 2024-12-19

### 🎉 Lançamento Inicial
- Primeira versão estável do Simulador CAVE
- Sistema completo de geometria curva funcional

### ✨ Funcionalidades Adicionadas
- **Painel Central Curvo**: Geometria procedural com dobras suaves
- **Sistema de Controles**: Interface tabbed (Posição/Dimensão/Textura)
- **Curvas Bidirecionais**: Suporte para ângulos positivos e negativos
- **Texturas Dinâmicas**: Carregamento via URL e arquivo local
- **Debug Avançado**: Linhas de visualização e marcadores
- **Presets**: Configurações predefinidas (CAVE, Expansivo, Plano)

### 🔧 Componentes Técnicos
- **Renderização**: Three.js WebGL com OrbitControls
- **Geometria**: PlaneGeometry com deformação de vértices
- **Continuidade**: Matemática C0 para transições suaves
- **Performance**: Reutilização de geometria e updates otimizados

### 📐 Algoritmos Implementados
- **Deformação de Vértices**: Transformação matemática precisa
- **Curvas Trigonométricas**: sin/cos para suavidade natural
- **Progressão Paramétrica**: Controle t para transições
- **Mapeamento UV**: Preservação de texturas contínuas

### 🐛 Correções de Bugs
- **v0.1**: Curvas separadas → Geometria contínua única
- **v0.2**: Raio invertido → Direção matemática correta  
- **v0.3**: Ângulos negativos → Lógica de espelhamento
- **v0.4**: Curva convexa → Curva côncava consistente
- **v0.5**: Progressão de ângulo → Parâmetros corretos
- **v1.0**: Direção X → Curvatura sempre para dentro

### 📋 Pontos Críticos Resolvidos
1. **Continuidade Geométrica**: Conexões perfeitas entre seções
2. **Direção de Curva**: Côncava para dentro em ambos os casos
3. **Ângulos Negativos**: Z invertido mantendo X consistente
4. **Transições Suaves**: Raio de curvatura parametrizável
5. **Performance**: Updates eficientes sem recriação

### 🎯 Casos de Uso Validados
- ✅ CAVE Tradicional (+45° a +90°)
- ✅ Formato Expansivo (-45° a -90°)
- ✅ Configurações Híbridas (assimétrica)
- ✅ Texturas Contínuas
- ✅ Debug e Visualização

### 🔮 Roadmap Futuro
- [ ] Painéis laterais (terceira dimensão)
- [ ] Múltiplas texturas simultâneas
- [ ] Animações de transição
- [ ] Export de configurações
- [ ] Suporte VR/AR
- [ ] API de integração
- [ ] Testes automatizados

---

## Formato
Este changelog segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

### Tipos de Mudanças
- `Adicionado` para novas funcionalidades
- `Modificado` para mudanças em funcionalidades existentes  
- `Descontinuado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades
