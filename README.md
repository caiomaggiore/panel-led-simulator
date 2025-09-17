# Simulador CAVE

## 🎯 Visão Geral

**Simulador de Ambiente CAVE** para visualização e configuração de painéis LED curvos em tempo real. Desenvolvido com Three.js para simular ambientes imersivos realistas.

![GitHub](https://img.shields.io/github/license/caiomaggiore/panel-led-simulator)
![Version](https://img.shields.io/badge/version-1.2.1-blue)
![Three.js](https://img.shields.io/badge/Three.js-r128-green)

## 🚀 Início Rápido

### 1. Clone o repositório
```bash
git clone https://github.com/caiomaggiore/panel-led-simulator.git
cd panel-led-simulator
```

### 2. Execute localmente
```bash
# Opção 1: Servidor simples
npx http-server . -p 8080 -o

# Opção 2: Live reload (desenvolvimento)
npx live-server --port=8080 --open=index.html
```

### 3. Abra no navegador
```
http://localhost:8080
```

## ✨ Funcionalidades

### 🎮 Painéis Configuráveis
- **Painel Central**: Geometria curva com dobras suaves
- **Piso**: Base horizontal ajustável
- **Curvas Bidirecionais**: Ângulos positivos (CAVE) e negativos (expansivo)

### 🎛️ Controles Avançados
- **Posição**: Movimento XYZ independente
- **Dimensão**: Largura, altura, seções laterais, ângulos
- **Textura**: Cores, imagens, escala personalizada

### 🎨 Sistema de Presets
- **4 Presets Personalizáveis**: Salvamento via LocalStorage
- **Preset Padrão**: Configuração realista imutável (-90°)
- **Interface com Abas**: Presets, Salvamento e Ferramentas
- **Ícones FontAwesome**: Navegação visual intuitiva

## 🛠️ Ferramentas de Debug

- **Linhas de Visualização**: Pontos críticos da geometria
- **Continuidade**: Verificação matemática em tempo real
- **Console Logs**: Informações de desenvolvimento

## 📋 Casos de Uso

### 🏢 **Ambientes Profissionais**
- Simulação de instalações CAVE
- Planejamento de displays LED
- Visualização de projetos imersivos

### 🎨 **Aplicações Criativas**
- Instalações artísticas
- Configurações híbridas
- Prototipagem rápida

## 📚 Documentação

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Detalhes técnicos e algoritmos
- **[CHANGELOG.md](CHANGELOG.md)**: Histórico de versões
- **[manifest.json](manifest.json)**: Especificações completas

## 🔧 Requisitos

### Navegadores Suportados
- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

### Hardware Recomendado
- GPU dedicada
- 4GB RAM mínimo
- Processador multi-core

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Caio Maggiore**  
Maggiore AV - Projeto Accenture Cave Extension

---

⭐ **Se este projeto foi útil, considere dar uma estrela no GitHub!**
