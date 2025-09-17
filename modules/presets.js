// modules/presets.js
// Sistema de Presets - Gerenciamento de configurações salvas

// Configuração do preset padrão (imutável)
const defaultConfig = {
    // Painel Central
    centerPosition: { x: 0, y: 1.5, z: -1.5 },
    centerDimension: { width: 10, height: 3, leftSection: 28, rightSection: 28, leftAngle: -90, rightAngle: -90, curveRadius: 0.5 },
    centerTexture: { 
        color: '#ffffff', 
        offsetX: 0, 
        offsetY: 0.15, 
        scaleX: 1, 
        scaleY: 0.6
    },
    // Piso
    floorPosition: { x: 0, y: 0, z: 0 },
    floorDimension: { width: 5.5, depth: 3 },
    floorTexture: { 
        color: '#ffffff', 
        offsetX: 0.16, 
        offsetY: 0, 
        scaleX: 0.7, 
        scaleY: 0.1
    }
};

function applyPreset(presetName) {
    if (presetName === 'preset1' || presetName === 'preset2' || presetName === 'preset3' || presetName === 'preset4') {
        // Carregar preset personalizado do localStorage
        const savedPreset = localStorage.getItem(presetName);
        if (savedPreset) {
            const config = JSON.parse(savedPreset);
            applyConfiguration(config);
        } else {
            alert(`${presetName.toUpperCase()} ainda não foi salvo. Configure os parâmetros e clique em 'Salvar'.`);
        }
        return;
    }
    
    // Aplicar preset padrão
    if (presetName === 'cavePadrao') {
        applyConfiguration(defaultConfig);
    }
}

function applyConfiguration(config) {
    // Aplicar configurações do painel central
    if (config.centerPosition) {
        setSliderValue('center-position-x', config.centerPosition.x);
        setSliderValue('center-position-y', config.centerPosition.y);
        setSliderValue('center-position-z', config.centerPosition.z);
    }
    
    if (config.centerDimension) {
        setSliderValue('center-width', config.centerDimension.width);
        setSliderValue('center-height', config.centerDimension.height);
        setSliderValue('left-section-width', config.centerDimension.leftSection);
        setSliderValue('right-section-width', config.centerDimension.rightSection);
        setSliderValue('left-angle', config.centerDimension.leftAngle);
        setSliderValue('right-angle', config.centerDimension.rightAngle);
        setSliderValue('curve-radius', config.centerDimension.curveRadius);
    }
    
    if (config.centerTexture) {
        document.getElementById('center-color').value = config.centerTexture.color;
        setSliderValue('center-offset-x', config.centerTexture.offsetX);
        setSliderValue('center-offset-y', config.centerTexture.offsetY);
        setSliderValue('center-scale-x', config.centerTexture.scaleX);
        setSliderValue('center-scale-y', config.centerTexture.scaleY);
    }
    
    // Aplicar configurações do piso
    if (config.floorPosition) {
        setSliderValue('floor-position-x', config.floorPosition.x);
        setSliderValue('floor-position-y', config.floorPosition.y);
        setSliderValue('floor-position-z', config.floorPosition.z);
    }
    
    if (config.floorDimension) {
        setSliderValue('floor-width', config.floorDimension.width);
        setSliderValue('floor-depth', config.floorDimension.depth);
    }
    
    if (config.floorTexture) {
        document.getElementById('floor-color').value = config.floorTexture.color;
        setSliderValue('floor-offset-x', config.floorTexture.offsetX);
        setSliderValue('floor-offset-y', config.floorTexture.offsetY);
        setSliderValue('floor-scale-x', config.floorTexture.scaleX);
        setSliderValue('floor-scale-y', config.floorTexture.scaleY);
    }
    
    createGeometry();
}

function getCurrentConfiguration() {
    return {
        centerPosition: {
            x: parseFloat(document.getElementById('center-position-x').value),
            y: parseFloat(document.getElementById('center-position-y').value),
            z: parseFloat(document.getElementById('center-position-z').value)
        },
        centerDimension: {
            width: parseFloat(document.getElementById('center-width').value),
            height: parseFloat(document.getElementById('center-height').value),
            leftSection: parseFloat(document.getElementById('left-section-width').value),
            rightSection: parseFloat(document.getElementById('right-section-width').value),
            leftAngle: parseFloat(document.getElementById('left-angle').value),
            rightAngle: parseFloat(document.getElementById('right-angle').value),
            curveRadius: parseFloat(document.getElementById('curve-radius').value)
        },
        centerTexture: {
            color: document.getElementById('center-color').value,
            offsetX: parseFloat(document.getElementById('center-offset-x').value),
            offsetY: parseFloat(document.getElementById('center-offset-y').value),
            scaleX: parseFloat(document.getElementById('center-scale-x').value),
            scaleY: parseFloat(document.getElementById('center-scale-y').value)
        },
        floorPosition: {
            x: parseFloat(document.getElementById('floor-position-x').value),
            y: parseFloat(document.getElementById('floor-position-y').value),
            z: parseFloat(document.getElementById('floor-position-z').value)
        },
        floorDimension: {
            width: parseFloat(document.getElementById('floor-width').value),
            depth: parseFloat(document.getElementById('floor-depth').value)
        },
        floorTexture: {
            color: document.getElementById('floor-color').value,
            offsetX: parseFloat(document.getElementById('floor-offset-x').value),
            offsetY: parseFloat(document.getElementById('floor-offset-y').value),
            scaleX: parseFloat(document.getElementById('floor-scale-x').value),
            scaleY: parseFloat(document.getElementById('floor-scale-y').value)
        }
    };
}

function saveCurrentPreset() {
    const selectedPreset = document.getElementById('presetSelect').value;
    const presetName = selectedPreset.toUpperCase();
    
    if (confirm(`Tem certeza que deseja sobrescrever ${presetName}?\n\nEsta ação irá substituir a configuração salva anterior.`)) {
        const currentConfig = getCurrentConfiguration();
        localStorage.setItem(selectedPreset, JSON.stringify(currentConfig));
        alert(`${presetName} salvo com sucesso!`);
    }
}

// Função para alternar entre abas dos presets
function showPresetTab(tabName) {
    // Remover classe active de todas as abas e conteúdos
    document.querySelectorAll('.preset-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.preset-tab-content').forEach(content => content.classList.remove('active'));
    
    // Adicionar classe active na aba e conteúdo selecionados
    document.querySelector(`[onclick="showPresetTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`preset-tab-${tabName}`).classList.add('active');
}

// Inicializar sistema de presets
function initializePresets() {
    // Aplicar Cave Padrão após inicialização
    setTimeout(() => {
        applyPreset('cavePadrao');
    }, 500);
}
