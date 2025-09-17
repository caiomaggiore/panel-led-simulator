// modules/uv-editor.js
// Editor de Distorção UV - FASE 1: Base do sistema

// Variáveis globais do editor UV
let uvCanvas, uvCtx;
let uvGridResolution = 5;
let uvControlPoints = [];
let uvPreviewActive = false;
let uvDragging = false;
let uvDragIndex = -1;
let uvHoverIndex = -1;
let uvInfluenceMode = true;
let uvInfluenceRadius = 2; // Raio de influência em unidades de grade
let uvInfluenceStrength = 0.50; // 50% de influência padrão

// Inicializar o editor UV
function initializeUVEditor() {
    uvCanvas = document.getElementById('uv-editor-canvas');
    if (!uvCanvas) return;
    
    uvCtx = uvCanvas.getContext('2d');
    
    // Configurar canvas
    uvCanvas.width = 280;
    uvCanvas.height = 200;
    
    // Inicializar grade de controle
    resetUVGrid();
    
    // Adicionar event listeners
    setupUVEventListeners();
    
    // Desenhar grade inicial
    drawUVGrid();
}

// Reset da grade UV para posição inicial
function resetUVGrid() {
    uvControlPoints = [];
    
    // Criar grade regular de pontos de controle
    for (let y = 0; y <= uvGridResolution; y++) {
        for (let x = 0; x <= uvGridResolution; x++) {
            uvControlPoints.push({
                x: (x / uvGridResolution) * uvCanvas.width,
                y: (y / uvGridResolution) * uvCanvas.height,
                originalX: (x / uvGridResolution) * uvCanvas.width,
                originalY: (y / uvGridResolution) * uvCanvas.height,
                gridX: x,
                gridY: y
            });
        }
    }
    
    if (uvCtx) {
        drawUVGrid();
    }
}

// Atualizar resolução da grade
function updateGridResolution() {
    const select = document.getElementById('uv-grid-resolution');
    uvGridResolution = parseInt(select.value);
    resetUVGrid();
}

// Desenhar grade no canvas
function drawUVGrid() {
    if (!uvCtx) return;
    
    // Limpar canvas
    uvCtx.clearRect(0, 0, uvCanvas.width, uvCanvas.height);
    
    // Desenhar fundo com padrão de grade
    uvCtx.strokeStyle = '#2a3f5f';
    uvCtx.lineWidth = 1;
    
    // Linhas horizontais de referência
    for (let i = 0; i <= 10; i++) {
        const y = (i / 10) * uvCanvas.height;
        uvCtx.beginPath();
        uvCtx.moveTo(0, y);
        uvCtx.lineTo(uvCanvas.width, y);
        uvCtx.stroke();
    }
    
    // Linhas verticais de referência
    for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * uvCanvas.width;
        uvCtx.beginPath();
        uvCtx.moveTo(x, 0);
        uvCtx.lineTo(x, uvCanvas.height);
        uvCtx.stroke();
    }
    
    // Desenhar linhas da grade de controle
    uvCtx.strokeStyle = '#6eb4ff';
    uvCtx.lineWidth = 2;
    
    // Linhas horizontais
    for (let y = 0; y <= uvGridResolution; y++) {
        uvCtx.beginPath();
        for (let x = 0; x <= uvGridResolution; x++) {
            const point = getControlPoint(x, y);
            if (x === 0) {
                uvCtx.moveTo(point.x, point.y);
            } else {
                uvCtx.lineTo(point.x, point.y);
            }
        }
        uvCtx.stroke();
    }
    
    // Linhas verticais
    for (let x = 0; x <= uvGridResolution; x++) {
        uvCtx.beginPath();
        for (let y = 0; y <= uvGridResolution; y++) {
            const point = getControlPoint(x, y);
            if (y === 0) {
                uvCtx.moveTo(point.x, point.y);
            } else {
                uvCtx.lineTo(point.x, point.y);
            }
        }
        uvCtx.stroke();
    }
    
    // Desenhar pontos de controle
    uvControlPoints.forEach((point, index) => {
        // Tamanho do ponto baseado no estado
        let radius = 4;
        let fillColor = '#ff6b6b';
        let strokeColor = '#ffffff';
        
        if (index === uvHoverIndex) {
            // Ponto em hover - maior e mais brilhante
            radius = 6;
            fillColor = '#ff8a8a';
            strokeColor = '#ffff00';
        }
        
        if (index === uvDragIndex) {
            // Ponto sendo arrastado - ainda maior
            radius = 8;
            fillColor = '#ff4444';
            strokeColor = '#ffff00';
        }
        
        uvCtx.fillStyle = fillColor;
        uvCtx.strokeStyle = strokeColor;
        uvCtx.lineWidth = 2;
        
        uvCtx.beginPath();
        uvCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        uvCtx.fill();
        uvCtx.stroke();
        
        // Desenhar área de influência se estiver arrastando
        if (uvInfluenceMode && index === uvDragIndex) {
            uvCtx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            uvCtx.lineWidth = 1;
            uvCtx.setLineDash([5, 5]);
            
            const influencePixels = uvInfluenceRadius * (uvCanvas.width / uvGridResolution);
            uvCtx.beginPath();
            uvCtx.arc(point.x, point.y, influencePixels, 0, Math.PI * 2);
            uvCtx.stroke();
            
            uvCtx.setLineDash([]); // Reset linha tracejada
        }
    });
}

// Obter ponto de controle por coordenadas da grade
function getControlPoint(gridX, gridY) {
    return uvControlPoints.find(point => 
        point.gridX === gridX && point.gridY === gridY
    );
}

// Configurar event listeners do canvas
function setupUVEventListeners() {
    if (!uvCanvas) return;
    
    // Mouse down - iniciar drag
    uvCanvas.addEventListener('mousedown', (e) => {
        const rect = uvCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Encontrar ponto mais próximo
        let closestIndex = -1;
        let closestDistance = Infinity;
        
        uvControlPoints.forEach((point, index) => {
            const distance = Math.sqrt(
                Math.pow(mouseX - point.x, 2) + 
                Math.pow(mouseY - point.y, 2)
            );
            
            if (distance < 10 && distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });
        
        if (closestIndex !== -1) {
            uvDragging = true;
            uvDragIndex = closestIndex;
            uvCanvas.style.cursor = 'grabbing';
        }
    });
    
    // Mouse move - arrastar ponto ou detectar hover
    uvCanvas.addEventListener('mousemove', (e) => {
        const rect = uvCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (uvDragging && uvDragIndex !== -1) {
            // Modo de arrasto ativo
            const draggedPoint = uvControlPoints[uvDragIndex];
            
            // Calcular delta do movimento (sem limitação para detecção)
            const deltaX = mouseX - draggedPoint.x;
            const deltaY = mouseY - draggedPoint.y;
            
            // Aplicar movimento com limitação apenas na posição final
            const newX = draggedPoint.x + deltaX;
            const newY = draggedPoint.y + deltaY;
            
            // Limitar posição do ponto dentro do canvas
            const clampedX = Math.max(0, Math.min(uvCanvas.width, newX));
            const clampedY = Math.max(0, Math.min(uvCanvas.height, newY));
            
            // Atualizar posição do ponto principal
            draggedPoint.x = clampedX;
            draggedPoint.y = clampedY;
            
            // Aplicar influência nos pontos próximos
            if (uvInfluenceMode) {
                applyInfluenceToNearbyPoints(uvDragIndex, deltaX, deltaY);
            }
            
            // Redesenhar grade
            drawUVGrid();
            
            // Atualizar preview (se ativo)
            if (uvPreviewActive) {
                updateUVPreview();
            }
        } else {
            // Modo de detecção de hover (apenas dentro do canvas)
            detectHoverPoint(mouseX, mouseY);
        }
    });
    
    // Mouse up - finalizar drag (global para permitir soltar fora do canvas)
    document.addEventListener('mouseup', () => {
        if (uvDragging) {
            uvDragging = false;
            uvDragIndex = -1;
            if (uvCanvas) uvCanvas.style.cursor = 'crosshair';
        }
    });
    
    // Mouse move global para continuar arrasto fora do canvas
    document.addEventListener('mousemove', (e) => {
        if (!uvDragging || uvDragIndex === -1 || !uvCanvas) return;
        
        const rect = uvCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const draggedPoint = uvControlPoints[uvDragIndex];
        
        // Limitar mouse a 20px além dos limites do canvas
        const margin = 20;
        const limitedMouseX = Math.max(-margin, Math.min(uvCanvas.width + margin, mouseX));
        const limitedMouseY = Math.max(-margin, Math.min(uvCanvas.height + margin, mouseY));
        
        // Calcular delta do movimento
        const deltaX = limitedMouseX - draggedPoint.x;
        const deltaY = limitedMouseY - draggedPoint.y;
        
        // Aplicar movimento com limitação apenas na posição final
        const newX = draggedPoint.x + deltaX;
        const newY = draggedPoint.y + deltaY;
        
        // Limitar posição do ponto dentro do canvas
        const clampedX = Math.max(0, Math.min(uvCanvas.width, newX));
        const clampedY = Math.max(0, Math.min(uvCanvas.height, newY));
        
        // Atualizar posição do ponto principal
        draggedPoint.x = clampedX;
        draggedPoint.y = clampedY;
        
        // Aplicar influência nos pontos próximos (usando delta original)
        if (uvInfluenceMode) {
            applyInfluenceToNearbyPoints(uvDragIndex, deltaX, deltaY);
        }
        
        // Redesenhar grade
        drawUVGrid();
        
        // Atualizar preview (se ativo)
        if (uvPreviewActive) {
            updateUVPreview();
        }
    });
    
    // Mouse leave - apenas remover hover, manter drag ativo
    uvCanvas.addEventListener('mouseleave', () => {
        if (!uvDragging) {
            uvHoverIndex = -1;
            uvCanvas.style.cursor = 'crosshair';
            drawUVGrid(); // Redesenhar para remover hover
        }
    });
}

// Detectar hover sobre pontos
function detectHoverPoint(mouseX, mouseY) {
    let newHoverIndex = -1;
    let closestDistance = Infinity;
    
    uvControlPoints.forEach((point, index) => {
        const distance = Math.sqrt(
            Math.pow(mouseX - point.x, 2) + 
            Math.pow(mouseY - point.y, 2)
        );
        
        if (distance < 12 && distance < closestDistance) {
            closestDistance = distance;
            newHoverIndex = index;
        }
    });
    
    // Atualizar hover apenas se mudou
    if (newHoverIndex !== uvHoverIndex) {
        uvHoverIndex = newHoverIndex;
        uvCanvas.style.cursor = uvHoverIndex !== -1 ? 'grab' : 'crosshair';
        drawUVGrid();
    }
}

// Aplicar influência nos pontos próximos
function applyInfluenceToNearbyPoints(dragIndex, deltaX, deltaY) {
    const draggedPoint = uvControlPoints[dragIndex];
    
    uvControlPoints.forEach((point, index) => {
        if (index === dragIndex) return; // Pular o próprio ponto
        
        // Calcular distância em unidades de grade
        const gridDistance = Math.sqrt(
            Math.pow(point.gridX - draggedPoint.gridX, 2) + 
            Math.pow(point.gridY - draggedPoint.gridY, 2)
        );
        
        // Aplicar influência se estiver dentro do raio
        if (gridDistance <= uvInfluenceRadius) {
            // Calcular força de influência (decresce com a distância)
            const influence = (1 - (gridDistance / uvInfluenceRadius)) * uvInfluenceStrength;
            
            // Aplicar movimento proporcional
            const influenceX = deltaX * influence;
            const influenceY = deltaY * influence;
            
            // Atualizar posição com limites
            point.x = Math.max(0, Math.min(uvCanvas.width, point.x + influenceX));
            point.y = Math.max(0, Math.min(uvCanvas.height, point.y + influenceY));
        }
    });
}

// Atualizar preview 3D (placeholder para FASE 2)
function updateUVPreview() {
    // TODO: Implementar na FASE 2
    console.log('Preview UV atualizado - implementar na FASE 2');
}

// Aplicar distorção ao piso (placeholder para FASE 2)
function applyDistortionToFloor() {
    // TODO: Implementar na FASE 2
    alert('Aplicar distorção ao piso - implementar na FASE 2');
}

// Toggle modo de influência
function toggleInfluenceMode() {
    uvInfluenceMode = !uvInfluenceMode;
    const btnText = document.getElementById('influence-btn-text');
    const btn = document.querySelector('[onclick="toggleInfluenceMode()"]');
    
    if (uvInfluenceMode) {
        btnText.textContent = 'Influência ON';
        btn.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
    } else {
        btnText.textContent = 'Influência OFF';
        btn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    }
}

// Atualizar raio de influência
function updateInfluenceRadius() {
    const select = document.getElementById('uv-influence-radius');
    uvInfluenceRadius = parseInt(select.value);
}

// Atualizar intensidade de influência
function updateInfluenceStrength() {
    const select = document.getElementById('uv-influence-strength');
    uvInfluenceStrength = parseFloat(select.value);
}

// Toggle preview 3D
function toggleUVPreview() {
    uvPreviewActive = !uvPreviewActive;
    const previewDiv = document.getElementById('uv-preview-3d');
    
    if (uvPreviewActive) {
        previewDiv.style.background = '#0f1929';
        previewDiv.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6eb4ff; font-size: 12px;">Preview ATIVO</div>';
        updateUVPreview();
    } else {
        previewDiv.style.background = '#1a2332';
        previewDiv.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #88ccff; font-size: 12px;">Preview em Tempo Real</div>';
    }
}

// Função para alternar modo de trabalho
function setWorkMode(mode) {
    const preview3D = document.getElementById('container');
    const uvEditor = document.getElementById('uv-editor-fullscreen');
    const controls = document.getElementById('controls');
    const presets = document.getElementById('presets');
    
    // Remover classe active dos botões
    document.querySelectorAll('.work-mode-btn').forEach(btn => btn.classList.remove('active'));
    
    if (mode === 'preview3d') {
        // Modo Preview 3D
        preview3D.style.display = 'block';
        uvEditor.classList.remove('active');
        controls.style.display = 'block';
        presets.style.display = 'block';
        
        // Ativar botão
        document.querySelector('[onclick="setWorkMode(\'preview3d\')"]').classList.add('active');
        
    } else if (mode === 'uv-editor') {
        // Modo Editor UV
        preview3D.style.display = 'none';
        uvEditor.classList.add('active');
        controls.style.display = 'none';
        presets.style.display = 'none';
        
        // Ativar botão
        document.querySelector('[onclick="setWorkMode(\'uv-editor\')"]').classList.add('active');
        
        // Inicializar editor se ainda não foi
        if (!uvCanvas) {
            setTimeout(initializeUVEditor, 100);
        }
        
        // Configurar canvas para tela cheia
        setTimeout(() => {
            if (uvCanvas) {
                const workspace = document.querySelector('.uv-editor-workspace');
                if (workspace) {
                    const rect = workspace.getBoundingClientRect();
                    uvCanvas.width = Math.min(800, rect.width - 40);
                    uvCanvas.height = Math.min(600, rect.height - 40);
                    resetUVGrid();
                }
            }
        }, 150);
    }
}

// Toggle PIP (preparado para FASE 2)
function togglePIP() {
    // TODO: Implementar expansão/contração do PIP na FASE 2
    alert('Toggle PIP - implementar na FASE 2');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que outros módulos carregaram
    setTimeout(() => {
        // Inicializar no modo Preview 3D
        setWorkMode('preview3d');
    }, 600);
});
