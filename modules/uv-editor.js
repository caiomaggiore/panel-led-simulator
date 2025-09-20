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
let uvDragStrength = 1.0; // Força do efeito de arrastar (ajustável)
let uvSmoothness = 1.0; // Suavização das curvas (0.0 = linear, 1.0 = suave)
// Apenas Mesh Tool (Adobe Illustrator style) - modo único
let uvTextureImage = null; // Imagem da textura para desenhar na grade
let uvShowTexture = true; // Mostrar textura na grade
let uvDistortedTexture = null; // Cache da textura distorcida
let uvSavedState = null; // Estado salvo dos pontos de controle
let uvDistortionResolution = 64; // Resolução fixa para distorção (64x64 para performance)

// FLUXO CORRETO DE TEXTURAS
let uvBaseTexture = null; // Imagem-base (original carregada)
let uvEditedTexture = null; // Imagem-editada (resultado do editor)
let uvLastAppliedState = null; // Último estado aplicado ao piso
let uvAutoApply = true; // Aplicação automática ao piso

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
    
    // Desenhar textura distorcida se disponível
    if (uvShowTexture && uvTextureImage && floorTexture) {
        drawDistortedTexture();
    }
    
    // Desenhar fundo com padrão de grade
    uvCtx.strokeStyle = uvShowTexture ? 'rgba(255, 255, 255, 0.3)' : '#2a3f5f';
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
            if (point) {
                if (x === 0) {
                    uvCtx.moveTo(point.x, point.y);
                } else {
                    uvCtx.lineTo(point.x, point.y);
                }
            }
        }
        uvCtx.stroke();
    }
    
    // Linhas verticais
    for (let x = 0; x <= uvGridResolution; x++) {
        uvCtx.beginPath();
        for (let y = 0; y <= uvGridResolution; y++) {
            const point = getControlPoint(x, y);
            if (point) {
                if (y === 0) {
                    uvCtx.moveTo(point.x, point.y);
                } else {
                    uvCtx.lineTo(point.x, point.y);
                }
            }
        }
        uvCtx.stroke();
    }
    
    // Desenhar pontos de controle
    uvControlPoints.forEach((point, index) => {
        if (!point) return; // Pular pontos undefined
        
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
            // Área pontilhada baseada na INTENSIDADE (não no raio)
            const intensity = uvInfluenceStrength || 0.5;
            
            // Cores baseadas na intensidade
            if (intensity <= 0.3) {
                uvCtx.strokeStyle = 'rgba(0, 255, 0, 0.4)'; // Verde = Fraco
            } else if (intensity <= 0.7) {
                uvCtx.strokeStyle = 'rgba(255, 165, 0, 0.4)'; // Laranja = Médio
            } else {
                uvCtx.strokeStyle = 'rgba(255, 0, 0, 0.4)'; // Vermelho = Forte
            }
            
            uvCtx.lineWidth = 2;
            uvCtx.setLineDash([5, 5]);
            
            // Raio baseado na intensidade (mais intenso = raio maior)
            const influencePixels = (intensity * 3) * (uvCanvas.width / uvGridResolution);
            uvCtx.beginPath();
            uvCtx.arc(point.x, point.y, influencePixels, 0, Math.PI * 2);
            uvCtx.stroke();
            
            uvCtx.setLineDash([]); // Reset linha tracejada
        }
    });
}

// Obter ponto de controle por coordenadas da grade
function getControlPoint(gridX, gridY) {
    // Calcular índice baseado na posição da grade
    const index = gridY * (uvGridResolution + 1) + gridX;
    return uvControlPoints[index] || null;
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
            
            // NOVA FUNCIONALIDADE: Aplicação automática durante edição
            onControlPointsChanged();
            
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

// Desenhar textura distorcida na grade usando interpolação avançada
function drawDistortedTexture() {
    if (!uvTextureImage || !uvCtx) return;
    
    // Usar resolução otimizada para preview
    const previewWidth = uvCanvas.width;
    const previewHeight = uvCanvas.height;
    
    // Criar ImageData para manipulação pixel por pixel
    const imageData = uvCtx.createImageData(previewWidth, previewHeight);
    const data = imageData.data;
    
    // Canvas temporário para acessar pixels da textura
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = uvTextureImage.width;
    tempCanvas.height = uvTextureImage.height;
    tempCtx.drawImage(uvTextureImage, 0, 0);
    const textureData = tempCtx.getImageData(0, 0, uvTextureImage.width, uvTextureImage.height).data;
    
    // Para cada pixel do preview - SEM SEGMENTAÇÃO
    for (let y = 0; y < previewHeight; y++) {
        for (let x = 0; x < previewWidth; x++) {
            // Normalizar coordenadas (0 a 1)
            const normalizedX = x / previewWidth;
            const normalizedY = y / previewHeight;
            
            // Usar a função que NÃO segmenta
            const sourcePos = calculateSourcePositionPixel(normalizedX, normalizedY);
            
            if (sourcePos) {
                // Mapear para coordenadas da textura original
                const srcX = sourcePos.x * uvTextureImage.width;
                const srcY = sourcePos.y * uvTextureImage.height;
                
                // Usar interpolação bilinear para amostragem suave
                const color = sampleTextureSmooth(textureData, uvTextureImage.width, uvTextureImage.height, srcX, srcY);
                
                if (color) {
                    const destIndex = (y * previewWidth + x) * 4;
                    data[destIndex] = color.r;
                    data[destIndex + 1] = color.g;
                    data[destIndex + 2] = color.b;
                    data[destIndex + 3] = 180; // 70% transparência
                }
            }
        }
    }
    
    // Desenhar o resultado
    uvCtx.putImageData(imageData, 0, 0);
}

// FUNÇÃO REMOVIDA: applyDistortionToUV causava segmentação
// Substituída por calculateSourcePositionPixel que não segmenta

// Amostragem de textura com interpolação bilinear
function sampleTextureWithInterpolation(textureData, width, height, u, v) {
    // Clampar coordenadas UV
    u = Math.max(0, Math.min(1, u));
    v = Math.max(0, Math.min(1, v));
    
    // Converter para coordenadas de pixel
    const x = u * (width - 1);
    const y = v * (height - 1);
    
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    
    // Pesos para interpolação
    const fx = x - x0;
    const fy = y - y0;
    
    // Obter pixels dos 4 cantos
    const getPixel = (px, py) => {
        const index = (py * width + px) * 4;
        return {
            r: textureData[index],
            g: textureData[index + 1],
            b: textureData[index + 2],
            a: textureData[index + 3]
        };
    };
    
    const p00 = getPixel(x0, y0);
    const p10 = getPixel(x1, y0);
    const p01 = getPixel(x0, y1);
    const p11 = getPixel(x1, y1);
    
    // Interpolação bilinear
    return {
        r: Math.round((1 - fx) * (1 - fy) * p00.r + fx * (1 - fy) * p10.r + (1 - fx) * fy * p01.r + fx * fy * p11.r),
        g: Math.round((1 - fx) * (1 - fy) * p00.g + fx * (1 - fy) * p10.g + (1 - fx) * fy * p01.g + fx * fy * p11.g),
        b: Math.round((1 - fx) * (1 - fy) * p00.b + fx * (1 - fy) * p10.b + (1 - fx) * fy * p01.b + fx * fy * p11.b),
        a: Math.round((1 - fx) * (1 - fy) * p00.a + fx * (1 - fy) * p10.a + (1 - fx) * fy * p01.a + fx * fy * p11.a)
    };
}

// Carregar textura para o editor (FLUXO CORRETO)
function loadTextureForEditor() {
    console.log('=== CARREGANDO TEXTURA PARA EDITOR ===');
    
    // Prioridade 1: Usar imagem-base salva (sempre a original)
    if (uvBaseTexture) {
        uvTextureImage = uvBaseTexture;
        console.log('✅ Imagem-base carregada no editor');
        generateAndApplyEditedTexture();
        return;
    }
    
    // Prioridade 2: Carregar do URL do campo de textura
    const floorTextureUrl = document.getElementById('floor-texture-url');
    if (floorTextureUrl && floorTextureUrl.value) {
        loadBaseTextureFromURL(floorTextureUrl.value);
        return;
    }
    
    // Prioridade 3: Tentar obter textura original do sistema
    if (typeof floorTexture !== 'undefined' && floorTexture && floorTexture.image) {
        // Se é CanvasTexture, não é a original
        if (floorTexture.constructor.name !== 'CanvasTexture') {
            uvBaseTexture = floorTexture.image;
            uvTextureImage = uvBaseTexture;
            console.log('✅ Textura original do sistema carregada');
            generateAndApplyEditedTexture();
            return;
        }
    }
    
    // Fallback: Carregar textura padrão
    loadFallbackTexture();
}

// Carregar imagem-base do URL
function loadBaseTextureFromURL(url) {
    console.log('🔄 Carregando imagem-base do URL:', url);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        // Definir como imagem-base
        uvBaseTexture = img;
        uvTextureImage = img;
        console.log('✅ Imagem-base carregada do URL');
        
        // Gerar e aplicar textura editada
        generateAndApplyEditedTexture();
    };
    img.onerror = function() {
        console.log('❌ Erro ao carregar do URL');
        loadFallbackTexture();
    };
    img.src = url;
}

// Gerar e aplicar textura editada automaticamente
function generateAndApplyEditedTexture() {
    if (!uvBaseTexture) return;
    
    // Desenhar grade com textura
    drawUVGrid();
    
    // Gerar textura editada
    const editedCanvas = document.createElement('canvas');
    const editedCtx = editedCanvas.getContext('2d');
    editedCanvas.width = 512;
    editedCanvas.height = 512;
    
    // Gerar textura distorcida
    generateDistortedTexture(editedCanvas, editedCtx);
    
    // Criar textura Three.js
    uvEditedTexture = new THREE.CanvasTexture(editedCanvas);
    uvEditedTexture.wrapS = THREE.RepeatWrapping;
    uvEditedTexture.wrapT = THREE.RepeatWrapping;
    
    // Aplicar automaticamente ao piso se habilitado
    if (uvAutoApply) {
        applyEditedTextureToFloor();
    }
    
    console.log('✅ Textura editada gerada e aplicada automaticamente');
}

// Aplicar textura editada ao piso
function applyEditedTextureToFloor() {
    if (!uvEditedTexture) return;
    
    try {
        // Substituir textura global do piso
        if (typeof window !== 'undefined') {
            window.floorTexture = uvEditedTexture;
        }
        
        // Tentar acessar variável global do módulo core
        if (typeof floorTexture !== 'undefined') {
            floorTexture = uvEditedTexture;
        }
        
        // Atualizar material do mesh diretamente
        if (typeof floorMesh !== 'undefined' && floorMesh && floorMesh.material) {
            floorMesh.material.map = uvEditedTexture;
            floorMesh.material.needsUpdate = true;
        }
        
        // Forçar atualização da geometria
        if (typeof createGeometry === 'function') {
            createGeometry();
        }
        
        // Salvar estado aplicado
        uvLastAppliedState = getCurrentUVState();
        
        console.log('✅ Textura editada aplicada ao piso automaticamente');
    } catch (error) {
        console.error('❌ Erro ao aplicar textura editada:', error);
    }
}

// Carregar textura do URL do campo
function loadTextureFromURL() {
    const floorTextureUrl = document.getElementById('floor-texture-url');
    if (floorTextureUrl && floorTextureUrl.value) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            uvTextureImage = img;
            console.log('Textura carregada via URL no editor');
            // Salvar como textura original
            if (uvSavedState) {
                uvSavedState.originalTexture = img;
            }
            drawUVGrid();
        };
        img.onerror = function() {
            console.log('Erro ao carregar textura via URL');
            loadFallbackTexture();
        };
        img.src = floorTextureUrl.value;
    } else {
        loadFallbackTexture();
    }
}

// Carregar textura de fallback
function loadFallbackTexture() {
    console.log('Carregando textura de fallback');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        uvTextureImage = img;
        console.log('Textura de fallback carregada no editor');
        drawUVGrid();
    };
    img.onerror = function() {
        console.log('Erro ao carregar textura de fallback');
        createProceduralTexture();
    };
    img.src = 'https://images.unsplash.com/photo-1544967882-6abaa4b2e38e?w=512&h=512&fit=crop';
}

// Criar textura procedural simples
function createProceduralTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Criar padrão de grade
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.strokeStyle = '#68d391';
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= 256; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
    }
    
    // Converter canvas para imagem
    const img = new Image();
    img.onload = function() {
        uvTextureImage = img;
        console.log('Textura procedural criada no editor');
        drawUVGrid();
    };
    img.src = canvas.toDataURL();
}

// Atualizar preview 3D (FASE 2)
function updateUVPreview() {
    // Atualizar textura no piso 3D com a distorção
    if (typeof createGeometry === 'function') {
        createGeometry();
    }
    
    // Atualizar PIP se estiver ativo
    updatePIPPreview();
}

// Atualizar PIP Preview 3D
function updatePIPPreview() {
    const pipContainer = document.getElementById('pip-3d-container');
    if (!pipContainer) return;
    
    // Criar uma versão miniatura do renderer 3D
    if (!window.pipRenderer) {
        // Inicializar renderer PIP
        window.pipRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        window.pipRenderer.setSize(300, 150);
        window.pipRenderer.setClearColor(0x0c1426);
        
        // Criar câmera para o PIP
        window.pipCamera = new THREE.PerspectiveCamera(75, 300/150, 0.1, 1000);
        window.pipCamera.position.set(0, 2, 5);
        
        // Adicionar ao container PIP
        pipContainer.innerHTML = '';
        pipContainer.appendChild(window.pipRenderer.domElement);
        
        // Animar PIP
        function animatePIP() {
            if (window.pipRenderer && window.pipCamera && scene) {
                window.pipRenderer.render(scene, window.pipCamera);
            }
            requestAnimationFrame(animatePIP);
        }
        animatePIP();
    }
}

// Aplicar distorção ao piso (BOTÃO MANUAL - AGORA APENAS CONFIRMA)
function applyDistortionToFloor() {
    if (!uvBaseTexture) {
        alert('Carregue uma textura no piso primeiro!');
        return;
    }
    
    // Gerar e aplicar textura editada
    generateAndApplyEditedTexture();
    
    // Marcar como aplicado
    uvLastAppliedState = getCurrentUVState();
    
    alert('✅ Distorção aplicada ao piso com sucesso!');
    console.log('🎯 Estado aplicado manualmente');
}

// Obter estado atual dos pontos de controle
function getCurrentUVState() {
    return {
        controlPoints: uvControlPoints.map(point => ({
            x: point.x,
            y: point.y,
            originalX: point.originalX,
            originalY: point.originalY
        })),
        gridResolution: uvGridResolution,
        timestamp: Date.now()
    };
}

// Verificar se há mudanças não aplicadas
function hasUnappliedChanges() {
    if (!uvLastAppliedState) return true;
    
    const currentState = getCurrentUVState();
    
    // Comparar pontos de controle
    if (currentState.controlPoints.length !== uvLastAppliedState.controlPoints.length) {
        return true;
    }
    
    for (let i = 0; i < currentState.controlPoints.length; i++) {
        const current = currentState.controlPoints[i];
        const applied = uvLastAppliedState.controlPoints[i];
        
        if (Math.abs(current.x - applied.x) > 0.1 || Math.abs(current.y - applied.y) > 0.1) {
            return true;
        }
    }
    
    return false;
}

// Aplicar mudanças automaticamente durante edição
function onControlPointsChanged() {
    // Salvar estado automaticamente quando pontos são alterados
    saveUVState();
    
    // Regenerar textura editada automaticamente
    if (uvAutoApply && uvBaseTexture) {
        // Debounce para evitar muitas atualizações
        clearTimeout(window.uvUpdateTimeout);
        window.uvUpdateTimeout = setTimeout(() => {
            generateAndApplyEditedTexture();
        }, 100);
    }
}

// Gerar textura distorcida - DISTORÇÃO PIXEL POR PIXEL (SEM SEGMENTAÇÃO)
function generateDistortedTexture(canvas, ctx) {
    if (!uvBaseTexture) return;
    
    console.log('🎨 Gerando textura distorcida (pixel por pixel)...');
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // SOLUÇÃO REAL: Distorção pixel por pixel sem segmentação
    // Criar ImageData para manipulação direta
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;
    
    // Canvas temporário para acessar pixels da textura original
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = uvBaseTexture.width;
    tempCanvas.height = uvBaseTexture.height;
    tempCtx.drawImage(uvBaseTexture, 0, 0);
    const textureData = tempCtx.getImageData(0, 0, uvBaseTexture.width, uvBaseTexture.height).data;
    
    // Para cada pixel da imagem final
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            // Normalizar coordenadas (0 a 1)
            const normalizedX = x / canvas.width;
            const normalizedY = y / canvas.height;
            
            // Calcular posição na textura original usando distorção contínua
            const sourcePos = calculateSourcePositionPixel(normalizedX, normalizedY);
            
            if (sourcePos) {
                // Mapear para coordenadas da textura original
                const srcX = sourcePos.x * uvBaseTexture.width;
                const srcY = sourcePos.y * uvBaseTexture.height;
                
                // Usar interpolação bilinear para amostragem suave
                const color = sampleTextureSmooth(textureData, uvBaseTexture.width, uvBaseTexture.height, srcX, srcY);
                
                if (color) {
                    const destIndex = (y * canvas.width + x) * 4;
                    data[destIndex] = color.r;
                    data[destIndex + 1] = color.g;
                    data[destIndex + 2] = color.b;
                    data[destIndex + 3] = 255;
                }
            }
        }
    }
    
    // Aplicar o resultado
    ctx.putImageData(imageData, 0, 0);
    console.log('✅ Textura distorcida gerada com sucesso');
}

// Função para interpolação suave (curva natural) - Mesh Tool Style
function smoothInterpolate(t) {
    // Função de suavização para curvas mais naturais
    // uvSmoothness: 0.0 = linear, 1.0 = suave máximo
    const smoothness = uvSmoothness || 1.0;
    
    if (smoothness <= 0) {
        return t; // Linear
    } else if (smoothness >= 1) {
        // Curva mais suave para Mesh Tool
        return t * t * t * (t * (t * 6 - 15) + 10); // Perlin noise style
    } else {
        // Interpolação entre linear e curva suave
        const linear = t;
        const smooth = t * t * t * (t * (t * 6 - 15) + 10);
        return linear + (smooth - linear) * smoothness;
    }
}

// Função para interpolação global (Mesh Tool approach)
function globalMeshInterpolation(normalizedX, normalizedY) {
    const canvasWidth = uvCanvas ? uvCanvas.width : 800;
    const canvasHeight = uvCanvas ? uvCanvas.height : 600;
    
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    
    // Considerar todos os pontos de controle com peso baseado na distância
    for (let i = 0; i < uvControlPoints.length; i++) {
        const point = uvControlPoints[i];
        const originalX = point.originalX / canvasWidth;
        const originalY = point.originalY / canvasHeight;
        
        // Calcular distância euclidiana
        const dx = normalizedX - originalX;
        const dy = normalizedY - originalY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.001) {
            // Se estamos muito próximos de um ponto, usar diretamente
            return {
                x: (point.x - point.originalX) / canvasWidth,
                y: (point.y - point.originalY) / canvasHeight
            };
        }
        
        // Peso baseado na distância (inverso quadrático)
        const weight = 1 / (distance * distance);
        totalWeight += weight;
        
        // Calcular deslocamento do ponto
        const displacementX = (point.x - point.originalX) / canvasWidth;
        const displacementY = (point.y - point.originalY) / canvasHeight;
        
        weightedX += displacementX * weight;
        weightedY += displacementY * weight;
    }
    
    if (totalWeight > 0) {
        return {
            x: weightedX / totalWeight,
            y: weightedY / totalWeight
        };
    }
    
    return { x: 0, y: 0 };
}

// Função para interpolação de curva de Bézier quadrática
function bezierInterpolate(p0, p1, p2, t) {
    const u = 1 - t;
    return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

// Calcular posição na textura original - MESH TOOL (Adobe Illustrator)
function calculateSourcePositionPixel(normalizedX, normalizedY) {
    // MODO MESH TOOL (Adobe Illustrator) - ÚNICO MODO
    const displacement = globalMeshInterpolation(normalizedX, normalizedY);
    const intensityMultiplier = uvDragStrength || 1.0;
    
    return {
        x: Math.max(0, Math.min(1, normalizedX - displacement.x * intensityMultiplier)),
        y: Math.max(0, Math.min(1, normalizedY - displacement.y * intensityMultiplier))
    };
}

// Calcular posição distorcida baseada nos pontos de controle
function calculateDistortedPosition(normalizedX, normalizedY) {
    // Converter para coordenadas do canvas
    const canvasX = normalizedX * (uvCanvas ? uvCanvas.width : 800);
    const canvasY = normalizedY * (uvCanvas ? uvCanvas.height : 600);
    
    // Calcular influência de todos os pontos de controle
    let totalWeight = 0;
    let displacementX = 0;
    let displacementY = 0;
    
    for (let y = 0; y < uvGridResolution; y++) {
        for (let x = 0; x < uvGridResolution; x++) {
            const point = getControlPoint(x, y);
            if (!point) continue;
            
            // Posição original do ponto na grade
            const gridX = x / (uvGridResolution - 1) * (uvCanvas ? uvCanvas.width : 800);
            const gridY = y / (uvGridResolution - 1) * (uvCanvas ? uvCanvas.height : 600);
            
            // Distância do pixel atual ao ponto de controle
            const distance = Math.sqrt(
                Math.pow(canvasX - gridX, 2) + 
                Math.pow(canvasY - gridY, 2)
            );
            
            // Raio de influência MUITO MENOR para controle preciso
            const influenceRadius = Math.min(
                (uvCanvas ? uvCanvas.width : 800) / (uvGridResolution - 1) * 0.3, // Reduzido para 0.3 (área muito menor)
                (uvCanvas ? uvCanvas.height : 600) / (uvGridResolution - 1) * 0.3
            );
            
            if (distance < influenceRadius) {
                // Peso mais intenso baseado na distância
                const normalizedDistance = distance / influenceRadius;
                const weight = Math.pow(1 - normalizedDistance, 2); // Mantido em 2 para intensidade
                
                // Deslocamento do ponto com FORÇA MUITO MAIOR
                const pointDisplacementX = (point.x - point.originalX) * 3.0; // Multiplicador aumentado para 3x
                const pointDisplacementY = (point.y - point.originalY) * 3.0; // Multiplicador aumentado para 3x
                
                // Aplicar peso
                displacementX += pointDisplacementX * weight;
                displacementY += pointDisplacementY * weight;
                totalWeight += weight;
            }
        }
    }
    
    // Normalizar
    if (totalWeight > 0) {
        displacementX /= totalWeight;
        displacementY /= totalWeight;
    }
    
    // Retornar posição final
    return {
        x: canvasX + displacementX,
        y: canvasY + displacementY
    };
}



// Amostragem suave com interpolação bilinear
function sampleTextureSmooth(textureData, width, height, x, y) {
    // Clampar coordenadas
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
    
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    
    const fx = x - x0;
    const fy = y - y0;
    
    // Obter pixels dos 4 cantos
    const getPixel = (px, py) => {
        const index = (py * width + px) * 4;
        return {
            r: textureData[index],
            g: textureData[index + 1],
            b: textureData[index + 2],
            a: textureData[index + 3]
        };
    };
    
    const p00 = getPixel(x0, y0);
    const p10 = getPixel(x1, y0);
    const p01 = getPixel(x0, y1);
    const p11 = getPixel(x1, y1);
    
    // Interpolação bilinear
    return {
        r: Math.round((1 - fx) * (1 - fy) * p00.r + fx * (1 - fy) * p10.r + (1 - fx) * fy * p01.r + fx * fy * p11.r),
        g: Math.round((1 - fx) * (1 - fy) * p00.g + fx * (1 - fy) * p10.g + (1 - fx) * fy * p01.g + fx * fy * p11.g),
        b: Math.round((1 - fx) * (1 - fy) * p00.b + fx * (1 - fy) * p10.b + (1 - fx) * fy * p01.b + fx * fy * p11.b),
        a: Math.round((1 - fx) * (1 - fy) * p00.a + fx * (1 - fy) * p10.a + (1 - fx) * fy * p01.a + fx * fy * p11.a)
    };
}

// Interpolar distorção baseada nos pontos de controle da grade
// FUNÇÃO REMOVIDA: interpolateDistortion causava segmentação
// Substituída por calculateSourcePositionPixel que não segmenta

// Desenhar triângulo distorcido usando transformação de canvas
function drawDistortedTriangle(ctx, sx1, sy1, sx2, sy2, sx3, sy3, dx1, dy1, dx2, dy2, dx3, dy3) {
    // Salvar estado do contexto
    ctx.save();
    
    // Criar path do triângulo de destino
    ctx.beginPath();
    ctx.moveTo(dx1, dy1);
    ctx.lineTo(dx2, dy2);
    ctx.lineTo(dx3, dy3);
    ctx.closePath();
    ctx.clip();
    
    // Calcular matriz de transformação para mapear triângulo de origem para destino
    // Usar transformação afim aproximada
    const deltaX1 = dx1 - dx3;
    const deltaY1 = dy1 - dy3;
    const deltaX2 = dx2 - dx3;
    const deltaY2 = dy2 - dy3;
    
    const srcDeltaX1 = sx1 - sx3;
    const srcDeltaY1 = sy1 - sy3;
    const srcDeltaX2 = sx2 - sx3;
    const srcDeltaY2 = sy2 - sy3;
    
    // Calcular determinante para verificar se a transformação é válida
    const det = srcDeltaX1 * srcDeltaY2 - srcDeltaX2 * srcDeltaY1;
    
    if (Math.abs(det) > 0.001) {
        // Matriz de transformação
        const a = (deltaX1 * srcDeltaY2 - deltaX2 * srcDeltaY1) / det;
        const b = (deltaX2 * srcDeltaX1 - deltaX1 * srcDeltaX2) / det;
        const c = (deltaY1 * srcDeltaY2 - deltaY2 * srcDeltaY1) / det;
        const d = (deltaY2 * srcDeltaX1 - deltaY1 * srcDeltaX2) / det;
        const e = dx3 - (a * sx3 + b * sy3);
        const f = dy3 - (c * sx3 + d * sy3);
        
        // Aplicar transformação
        ctx.transform(a, c, b, d, e, f);
        
        // Desenhar a imagem
        ctx.drawImage(uvBaseTexture, 0, 0);
    }
    
    // Restaurar estado do contexto
    ctx.restore();
}

// Encontrar posição distorcida baseada na grade de controle
// FUNÇÃO REMOVIDA: getDistortedPosition causava segmentação
// Substituída por calculateSourcePositionPixel que não segmenta

// Calcular dados de distorção para aplicar no 3D
function calculateDistortionData() {
    const distortionMap = [];
    
    for (let y = 0; y <= uvGridResolution; y++) {
        for (let x = 0; x <= uvGridResolution; x++) {
            const point = getControlPoint(x, y);
            if (point) {
                // Normalizar coordenadas (0 a 1)
                const normalizedX = point.x / uvCanvas.width;
                const normalizedY = point.y / uvCanvas.height;
                const originalX = point.originalX / uvCanvas.width;
                const originalY = point.originalY / uvCanvas.height;
                
                distortionMap.push({
                    gridX: x,
                    gridY: y,
                    currentUV: { x: normalizedX, y: normalizedY },
                    originalUV: { x: originalX, y: originalY },
                    displacement: { 
                        x: normalizedX - originalX, 
                        y: normalizedY - originalY 
                    }
                });
            }
        }
    }
    
    return {
        resolution: uvGridResolution,
        points: distortionMap,
        timestamp: Date.now()
    };
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

function updateDragStrength() {
    const input = document.getElementById('uv-drag-strength');
    uvDragStrength = parseFloat(input.value);
    console.log('Força do arrasto:', uvDragStrength);
}

function updateSmoothness() {
    const input = document.getElementById('uv-smoothness');
    uvSmoothness = parseFloat(input.value);
    console.log('Suavização das curvas:', uvSmoothness);
}

// Função removida: toggleMeshMode - agora usa apenas Mesh Tool

// Toggle visualização de textura na grade
function toggleUVTexture() {
    uvShowTexture = !uvShowTexture;
    const btnText = document.getElementById('texture-btn-text');
    const btn = document.querySelector('[onclick="toggleUVTexture()"]');
    
    if (uvShowTexture) {
        btnText.textContent = 'Textura ON';
        btn.style.background = 'linear-gradient(135deg, #27ae60, #229954)';
        // Tentar carregar textura se não estiver carregada
        if (!uvTextureImage) {
            loadTextureForEditor();
        }
    } else {
        btnText.textContent = 'Textura OFF';
        btn.style.background = 'linear-gradient(135deg, #6c757d, #5a6268)';
    }
    
    drawUVGrid();
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
        // Salvar estado atual do editor UV
        saveUVState();
        
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
            setTimeout(() => {
                initializeUVEditor();
                // Restaurar estado salvo após inicializar
                setTimeout(restoreUVState, 50);
            }, 100);
        } else {
            // Restaurar estado salvo
            restoreUVState();
        }
        
        // Configurar canvas para tela cheia
        setTimeout(() => {
            if (uvCanvas) {
                const workspace = document.querySelector('.uv-editor-workspace');
                if (workspace) {
                    const rect = workspace.getBoundingClientRect();
                    uvCanvas.width = Math.min(800, rect.width - 40);
                    uvCanvas.height = Math.min(600, rect.height - 40);
                    
                    // Se temos estado salvo, não resetar a grade
                    if (!uvSavedState) {
                        resetUVGrid();
                    }
                    
                    // Carregar textura para o editor
                    loadTextureForEditor();
                    
                    // Inicializar PIP Preview
                    setTimeout(updatePIPPreview, 200);
                }
            }
        }, 150);
    }
}

// Salvar estado dos pontos de controle (APRIMORADO)
function saveUVState() {
    // Capturar valores atuais dos controles UI para garantir consistência
    const currentStrength = document.getElementById('uv-influence-strength')?.value || uvInfluenceStrength;
    const currentRadius = document.getElementById('uv-influence-radius')?.value || uvInfluenceRadius;
    const currentResolution = document.getElementById('uv-grid-resolution')?.value || uvGridResolution;
    
    if (uvControlPoints && uvControlPoints.length > 0) {
        uvSavedState = {
            controlPoints: uvControlPoints.map(point => ({
                x: point.x,
                y: point.y,
                originalX: point.originalX,
                originalY: point.originalY
            })),
            gridResolution: parseInt(currentResolution),
            influenceMode: uvInfluenceMode,
            influenceRadius: parseInt(currentRadius),
            influenceStrength: parseFloat(currentStrength),
            dragStrength: uvDragStrength,
            smoothness: uvSmoothness,
            showTexture: uvShowTexture,
            originalTexture: uvBaseTexture || uvTextureImage, // Salvar textura base
            canvasWidth: uvCanvas ? uvCanvas.width : 800,
            canvasHeight: uvCanvas ? uvCanvas.height : 600,
            timestamp: Date.now(),
            // Valores de backup para garantir persistência
            backupValues: {
                strength: currentStrength,
                radius: currentRadius,
                resolution: currentResolution
            }
        };
        
        console.log('💾 Estado UV salvo:', {
            pontos: uvSavedState.controlPoints.length,
            textura: uvSavedState.originalTexture ? 'sim' : 'não',
            canvas: `${uvSavedState.canvasWidth}x${uvSavedState.canvasHeight}`,
            intensidade: uvSavedState.influenceStrength,
            raio: uvSavedState.influenceRadius,
            resolucao: uvSavedState.gridResolution,
            timestamp: new Date(uvSavedState.timestamp).toLocaleTimeString()
        });
    }
}

// Restaurar estado dos pontos de controle (CORRIGIDO)
function restoreUVState() {
    if (uvSavedState && uvSavedState.controlPoints && uvCanvas) {
        console.log('🔄 Restaurando estado UV:', uvSavedState.controlPoints.length, 'pontos');
        
        // Restaurar pontos de controle com escala proporcional ao canvas atual
        const canvasWidth = uvCanvas.width;
        const canvasHeight = uvCanvas.height;
        
        // Limpar pontos existentes
        uvControlPoints = [];
        
        // Limpar array e recriar todos os pontos
        uvControlPoints = [];
        
        // Recriar grade completa baseada na resolução salva
        const savedResolution = uvSavedState.gridResolution || 5;
        const pointsPerRow = savedResolution + 1;
        const totalPoints = pointsPerRow * pointsPerRow;
        
        // Primeiro, recriar todos os pontos da grade
        for (let i = 0; i < totalPoints; i++) {
            const gridY = Math.floor(i / pointsPerRow);
            const gridX = i % pointsPerRow;
            
            // Calcular posição original na grade
            const originalX = (gridX / savedResolution) * canvasWidth;
            const originalY = (gridY / savedResolution) * canvasHeight;
            
            // Procurar ponto salvo correspondente
            const savedPoint = uvSavedState.controlPoints[i];
            
            let x, y;
            if (savedPoint) {
                // Calcular posição relativa original
                const relativeX = savedPoint.originalX / uvSavedState.canvasWidth;
                const relativeY = savedPoint.originalY / uvSavedState.canvasHeight;
                
                // Calcular nova posição original baseada no canvas atual
                const newOriginalX = relativeX * canvasWidth;
                const newOriginalY = relativeY * canvasHeight;
                
                // Calcular deslocamento relativo (proporcional)
                const relativeOffsetX = (savedPoint.x - savedPoint.originalX) / uvSavedState.canvasWidth;
                const relativeOffsetY = (savedPoint.y - savedPoint.originalY) / uvSavedState.canvasHeight;
                
                // Aplicar deslocamento proporcional à nova posição
                x = newOriginalX + (relativeOffsetX * canvasWidth);
                y = newOriginalY + (relativeOffsetY * canvasHeight);
            } else {
                // Ponto não encontrado, usar posição original
                x = originalX;
                y = originalY;
            }
            
            uvControlPoints.push({
                x: x,
                y: y,
                originalX: originalX,
                originalY: originalY
            });
        }
        
        // Restaurar configurações com valores de backup
        uvGridResolution = uvSavedState.gridResolution || uvSavedState.backupValues?.resolution || 5;
        uvInfluenceMode = uvSavedState.influenceMode !== undefined ? uvSavedState.influenceMode : true;
        uvInfluenceRadius = uvSavedState.influenceRadius || uvSavedState.backupValues?.radius || 2;
        uvInfluenceStrength = uvSavedState.influenceStrength || uvSavedState.backupValues?.strength || 0.50;
        uvDragStrength = uvSavedState.dragStrength || 1.0;
        uvSmoothness = uvSavedState.smoothness || 1.0;
        uvShowTexture = uvSavedState.showTexture !== undefined ? uvSavedState.showTexture : true;
        
        console.log('🔧 Configurações restauradas:', {
            resolution: uvGridResolution,
            radius: uvInfluenceRadius,
            strength: uvInfluenceStrength,
            mode: uvInfluenceMode,
            texture: uvShowTexture
        });
        
        // Restaurar textura base se disponível
        if (uvSavedState.originalTexture) {
            uvBaseTexture = uvSavedState.originalTexture;
            uvTextureImage = uvBaseTexture;
            console.log('✅ Textura base restaurada');
        }
        
        // Atualizar UI
        updateUIControls();
        
        // Redesenhar grade com delay para garantir que tudo seja processado
        setTimeout(() => {
            console.log('🎨 Redesenhando grade com', uvControlPoints.length, 'pontos');
            drawUVGrid();
            
            // Gerar textura editada se temos textura base
            if (uvBaseTexture) {
                generateAndApplyEditedTexture();
            }
        }, 100);
        
        console.log('✅ Estado UV completamente restaurado');
    } else if (uvCanvas) {
        // Se não há estado salvo, inicializar grade padrão
        console.log('📝 Inicializando grade padrão');
        resetUVGrid();
        loadTextureForEditor();
    }
}

// Atualizar controles da UI (CORRIGIDO)
function updateUIControls() {
    console.log('🔄 Atualizando controles UI:', {
        resolution: uvGridResolution,
        radius: uvInfluenceRadius,
        strength: uvInfluenceStrength,
        influenceMode: uvInfluenceMode,
        showTexture: uvShowTexture
    });
    
    const resolutionSelect = document.getElementById('uv-grid-resolution');
    if (resolutionSelect) {
        resolutionSelect.value = uvGridResolution;
        console.log('✅ Resolução definida para:', uvGridResolution);
    }
    
    const radiusSelect = document.getElementById('uv-influence-radius');
    if (radiusSelect) {
        radiusSelect.value = uvInfluenceRadius;
        console.log('✅ Raio definido para:', uvInfluenceRadius);
    }
    
    const strengthSelect = document.getElementById('uv-influence-strength');
    if (strengthSelect) {
        strengthSelect.value = uvInfluenceStrength;
        console.log('✅ Intensidade definida para:', uvInfluenceStrength);
    }
    
    const dragStrengthInput = document.getElementById('uv-drag-strength');
    if (dragStrengthInput) {
        dragStrengthInput.value = uvDragStrength;
    }
    
    const smoothnessInput = document.getElementById('uv-smoothness');
    if (smoothnessInput) {
        smoothnessInput.value = uvSmoothness;
        console.log('✅ Suavização definida para:', uvSmoothness);
    }
    
    
    // Atualizar botões de estado
    const influenceBtn = document.getElementById('influence-btn-text');
    if (influenceBtn) {
        influenceBtn.textContent = uvInfluenceMode ? 'Influência ON' : 'Influência OFF';
        console.log('✅ Botão influência:', influenceBtn.textContent);
    }
    
    const textureBtn = document.getElementById('texture-btn-text');
    if (textureBtn) {
        textureBtn.textContent = uvShowTexture ? 'Textura ON' : 'Textura OFF';
        console.log('✅ Botão textura:', textureBtn.textContent);
    }
    
    // Verificar se todos os valores foram definidos corretamente
    setTimeout(() => {
        const finalStrength = document.getElementById('uv-influence-strength')?.value;
        if (!finalStrength || finalStrength === '') {
            console.warn('⚠️ Intensidade ainda está vazia, forçando valor padrão');
            document.getElementById('uv-influence-strength').value = uvInfluenceStrength;
        }
    }, 100);
}

// Toggle PIP (FASE 2 - CORRIGIDO)
function togglePIP() {
    const pipPreview = document.getElementById('pip-preview');
    const pipBtn = document.querySelector('.pip-btn i');
    
    // Verificar estado atual baseado na classe CSS ou atributo
    const isExpanded = pipPreview.classList.contains('expanded');
    
    if (isExpanded) {
        // Voltar ao tamanho normal
        pipPreview.classList.remove('expanded');
        pipPreview.style.width = '300px';
        pipPreview.style.height = '180px';
        pipBtn.className = 'fas fa-expand';
        
        // Redimensionar renderer
        if (window.pipRenderer) {
            window.pipRenderer.setSize(300, 150);
        }
        
        console.log('PIP contraído para tamanho normal');
    } else {
        // Expandir PIP
        pipPreview.classList.add('expanded');
        pipPreview.style.width = '600px';
        pipPreview.style.height = '360px';
        pipBtn.className = 'fas fa-compress';
        
        // Redimensionar renderer
        if (window.pipRenderer) {
            window.pipRenderer.setSize(600, 330);
        }
        
        console.log('PIP expandido');
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que outros módulos carregaram
    setTimeout(() => {
        // Inicializar no modo Preview 3D
        setWorkMode('preview3d');
    }, 600);
});
