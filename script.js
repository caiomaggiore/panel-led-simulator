// script.js
// Variáveis globais
let scene, camera, renderer, controls;
let centerWall, floorMesh;
let textureLoader = new THREE.TextureLoader();
let centerTexture = null, floorTexture = null;

// Inicializar a cena Three.js
function init() {
    // Configurar cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1426);
    
    // Configurar câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    
    // Configurar renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('container').appendChild(renderer.domElement);
    
    // Adicionar controles de órbita
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Adicionar luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    
    // Criar geometria inicial com cores sólidas
    createGeometry();
    
    // Configurar controles de interface
    setupControls();
    
    // Iniciar animação
    animate();
    
    // Ajustar para redimensionamento da janela
    window.addEventListener('resize', onWindowResize);
}

// Carregar textura
function loadTexture(source, isFile = false) {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.textContent = 'Carregando imagem...';
    document.body.appendChild(loadingElement);
    
    let url;
    if (isFile) {
        url = URL.createObjectURL(source);
    } else {
        url = source;
    }
    
    textureLoader.load(
        url,
        function(texture) {
            document.body.removeChild(loadingElement);
            
            // Dispose texturas antigas
            if (centerTexture) centerTexture.dispose();
            if (floorTexture) floorTexture.dispose();
            
            // Criar texturas independentes para cada superfície
            centerTexture = texture.clone();
            floorTexture = texture.clone();
            
            // Configurar texturas
            [centerTexture, floorTexture].forEach(tex => {
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
            });
            
            // Mudar cor para branco ao carregar imagem
            document.getElementById('center-color').value = '#ffffff';
            document.getElementById('center-color-value').textContent = '#ffffff';
            document.getElementById('floor-color').value = '#ffffff';
            document.getElementById('floor-color-value').textContent = '#ffffff';
            
            createGeometry();
            if (isFile) URL.revokeObjectURL(url);
        },
        undefined,
        function(err) {
            document.body.removeChild(loadingElement);
            console.error('Erro ao carregar a imagem:', err);
            alert('Erro ao carregar a imagem. Verifique a URL ou o arquivo e tente novamente.');
        }
    );
}

// Criar geometria
function createGeometry() {
    if (centerWall) scene.remove(centerWall);
    if (floorMesh) scene.remove(floorMesh);
    
    // Obter parâmetros do painel
    const totalWidth = parseFloat(document.getElementById('center-width').value);
    const height = parseFloat(document.getElementById('center-height').value);
    const leftSectionWidth = parseFloat(document.getElementById('left-section-width').value) / 100;
    const rightSectionWidth = parseFloat(document.getElementById('right-section-width').value) / 100;
    const leftAngle = parseFloat(document.getElementById('left-angle').value) * Math.PI / 180;
    const rightAngle = parseFloat(document.getElementById('right-angle').value) * Math.PI / 180;
    const curveRadius = parseFloat(document.getElementById('curve-radius').value);
    
    // Calcular larguras das seções
    const leftWidth = totalWidth * leftSectionWidth;
    const rightWidth = totalWidth * rightSectionWidth;
    const centerWidth = totalWidth * (1 - leftSectionWidth - rightSectionWidth);
    
    // Obter cor selecionada
    const centerColor = document.getElementById('center-color').value;
    
    // Criar geometria única com múltiplos segmentos
    const widthSegments = 100; // Muitos segmentos para curva suave
    const heightSegments = 1;
    const geometry = new THREE.PlaneGeometry(totalWidth, height, widthSegments, heightSegments);
    
    // Acessar os vértices
    const vertices = geometry.attributes.position.array;
    
    // Calcular pontos de dobra
    const leftFoldPoint = leftWidth;
    const rightFoldPoint = totalWidth - rightWidth;
    
    // Deformar os vértices para criar dobras contínuas
    for (let i = 0; i < vertices.length; i += 3) {
        const originalX = vertices[i];
        const x = originalX + totalWidth / 2; // Converter para coordenada 0 a totalWidth
        const y = vertices[i + 1];
        let newX = originalX;
        let newZ = 0;
        
        // Calcular posição relativa às dobras
        const leftFoldStart = leftFoldPoint - curveRadius;
        const leftFoldEnd = leftFoldPoint + curveRadius;
        const rightFoldStart = rightFoldPoint - curveRadius;
        const rightFoldEnd = rightFoldPoint + curveRadius;
        
        if (x < leftFoldStart && leftWidth > 0 && leftAngle != 0) {
            // Seção esquerda totalmente dobrada
            const distFromStart = leftFoldStart - x;
            let baseX, baseZ;
            
            // Calcular posição base corretamente
            if (leftAngle > 0) {
                // Para ângulo positivo: a base está após a curva côncava
                baseX = -centerWidth/2 - curveRadius * Math.sin(leftAngle);
                baseZ = -curveRadius * (1 - Math.cos(leftAngle));
            } else {
                // Para ângulo negativo: a base está após a curva côncava, mas Z invertido
                baseX = -centerWidth/2 - curveRadius * Math.sin(Math.abs(leftAngle));
                baseZ = curveRadius * (1 - Math.cos(Math.abs(leftAngle)));
            }
            
            newX = baseX - distFromStart * Math.cos(leftAngle);
            newZ = baseZ + distFromStart * Math.sin(Math.abs(leftAngle)) * (leftAngle > 0 ? -1 : 1);
        } 
        else if (x >= leftFoldStart && x <= leftFoldEnd && leftWidth > 0 && leftAngle != 0 && curveRadius > 0) {
            // Zona de curva esquerda
            const t = (x - leftFoldStart) / (2 * curveRadius);
            const angle = Math.abs(leftAngle) * (1 - t);
            
            // Usar sempre a mesma fórmula, invertendo X e Z para ângulos negativos
            if (leftAngle > 0) {
                // Ângulo positivo - curva para dentro (côncava)
                newX = -centerWidth/2 - curveRadius * Math.sin(angle);
                newZ = -curveRadius * (1 - Math.cos(angle));
            } else {
                // Ângulo negativo - curva côncava para dentro, mas Z invertido
                newX = -centerWidth/2 - curveRadius * Math.sin(angle);
                newZ = curveRadius * (1 - Math.cos(angle));
            }
        }
        else if (x > rightFoldEnd && rightWidth > 0 && rightAngle != 0) {
            // Seção direita totalmente dobrada
            const distFromEnd = x - rightFoldEnd;
            let baseX, baseZ;
            
            // Calcular posição base corretamente
            if (rightAngle > 0) {
                // Para ângulo positivo: a base está após a curva côncava
                baseX = centerWidth/2 + curveRadius * Math.sin(rightAngle);
                baseZ = -curveRadius * (1 - Math.cos(rightAngle));
            } else {
                // Para ângulo negativo: a base está após a curva côncava, mas Z invertido
                baseX = centerWidth/2 + curveRadius * Math.sin(Math.abs(rightAngle));
                baseZ = curveRadius * (1 - Math.cos(Math.abs(rightAngle)));
            }
            
            newX = baseX + distFromEnd * Math.cos(rightAngle);
            newZ = baseZ + distFromEnd * Math.sin(Math.abs(rightAngle)) * (rightAngle > 0 ? -1 : 1);
        }
        else if (x >= rightFoldStart && x <= rightFoldEnd && rightWidth > 0 && rightAngle != 0 && curveRadius > 0) {
            // Zona de curva direita
            const t = (x - rightFoldStart) / (2 * curveRadius);
            const angle = Math.abs(rightAngle) * t;
            
            // Usar sempre a mesma fórmula, invertendo X e Z para ângulos negativos
            if (rightAngle > 0) {
                // Ângulo positivo - curva para dentro (côncava)
                newX = centerWidth/2 + curveRadius * Math.sin(angle);
                newZ = -curveRadius * (1 - Math.cos(angle));
            } else {
                // Ângulo negativo - curva côncava para dentro, mas Z invertido
                newX = centerWidth/2 + curveRadius * Math.sin(angle);
                newZ = curveRadius * (1 - Math.cos(angle));
            }
        }
        else {
            // Seção central plana
            newX = originalX;
            newZ = 0;
        }
        
        vertices[i] = newX;
        vertices[i + 2] = newZ;
    }
    
    // Atualizar geometria
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Criar material
    const centerMaterial = new THREE.MeshStandardMaterial({
        color: centerColor || '#333333',
        map: centerTexture,
        side: THREE.DoubleSide
    });
    
    // Criar mesh
    centerWall = new THREE.Mesh(geometry, centerMaterial);
    centerWall.position.y = height / 2;
    
    // Aplicar posição X, Y e Z do painel
    const centerPosX = parseFloat(document.getElementById('center-position-x').value);
    const centerPosY = parseFloat(document.getElementById('center-position-y').value);
    const centerPosZ = parseFloat(document.getElementById('center-position-z').value);
    centerWall.position.set(centerPosX, centerPosY, centerPosZ);
    
    scene.add(centerWall);
    
    // Criar piso
    const floorWidth = parseFloat(document.getElementById('floor-width').value);
    const floorDepth = parseFloat(document.getElementById('floor-depth').value);
    
    // Obter cor selecionada
    const floorColor = document.getElementById('floor-color').value;
    
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: floorColor || '#333333',
        map: floorTexture,
        side: THREE.DoubleSide
    });
    
    const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorDepth);
    floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    
    // Aplicar posição X, Y e Z do piso
    const floorPosX = parseFloat(document.getElementById('floor-position-x').value);
    const floorPosY = parseFloat(document.getElementById('floor-position-y').value);
    const floorPosZ = parseFloat(document.getElementById('floor-position-z').value);
    floorMesh.position.set(floorPosX, floorPosY, floorPosZ);
    scene.add(floorMesh);
    
    // Atualizar texturas independentemente
    if (centerTexture) {
        const centerOffsetX = parseFloat(document.getElementById('center-offset-x').value);
        const centerOffsetY = parseFloat(document.getElementById('center-offset-y').value);
        const centerScaleX = parseFloat(document.getElementById('center-scale-x').value);
        const centerScaleY = parseFloat(document.getElementById('center-scale-y').value);
        
        centerTexture.offset.set(centerOffsetX, centerOffsetY);
        centerTexture.repeat.set(centerScaleX, centerScaleY);
        centerTexture.needsUpdate = true;
    }
    
    if (floorTexture) {
        const floorOffsetX = parseFloat(document.getElementById('floor-offset-x').value);
        const floorOffsetY = parseFloat(document.getElementById('floor-offset-y').value);
        const floorScaleX = parseFloat(document.getElementById('floor-scale-x').value);
        const floorScaleY = parseFloat(document.getElementById('floor-scale-y').value);
        
        floorTexture.offset.set(floorOffsetX, floorOffsetY);
        floorTexture.repeat.set(floorScaleX, floorScaleY);
        floorTexture.needsUpdate = true;
    }
}

// Configurar controles de interface
function setupControls() {
    // Evento para carregar imagem
    document.getElementById('load-btn').addEventListener('click', () => {
        const imageUrl = document.getElementById('image-url').value;
        if (imageUrl) {
            loadTexture(imageUrl);
        } else {
            alert('Por favor, insira uma URL de imagem.');
        }
    });
    
    // Evento para carregar arquivo local
    document.getElementById('image-file').addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            document.getElementById('file-name').textContent = file.name;
            loadTexture(file, true);
        }
    });
    
    // Eventos para as abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });
    
    // Eventos para sub-abas
    document.querySelectorAll('.sub-tab').forEach(subTab => {
        subTab.addEventListener('click', () => {
            const parentTab = subTab.closest('.tab-content');
            const subTabName = subTab.dataset.subtab;
            
            // Remover active de todas as sub-abas e conteúdos do mesmo grupo
            parentTab.querySelectorAll('.sub-tab').forEach(st => st.classList.remove('active'));
            parentTab.querySelectorAll('.sub-tab-content').forEach(sc => sc.classList.remove('active'));
            
            // Adicionar active na sub-aba e conteúdo selecionados
            subTab.classList.add('active');
            document.getElementById(subTabName).classList.add('active');
        });
    });
    
    // Eventos para controles deslizantes
    const sliders = [
        'center-width', 'center-height',
        'center-position-x', 'center-position-y', 'center-position-z',
        'center-offset-x', 'center-offset-y',
        'center-scale-x', 'center-scale-y',
        'left-section-width', 'right-section-width',
        'left-angle', 'right-angle', 'curve-radius',
        'floor-width', 'floor-depth',
        'floor-position-x', 'floor-position-y', 'floor-position-z',
        'floor-offset-x', 'floor-offset-y',
        'floor-scale-x', 'floor-scale-y'
    ];
    
    sliders.forEach(id => {
        const slider = document.getElementById(id);
        const number = document.getElementById(`${id}-number`);
        const value = document.getElementById(`${id}-value`);
        
        if (slider && number && value) {
            slider.addEventListener('input', () => {
                number.value = slider.value;
                // Adicionar formatação apropriada
                if (id.includes('-angle')) {
                    value.textContent = slider.value + '°';
                } else if (id.includes('section-width')) {
                    value.textContent = slider.value + '%';
                } else {
                value.textContent = slider.value;
                }
                createGeometry();
            });
            
            number.addEventListener('input', () => {
                slider.value = number.value;
                // Adicionar formatação apropriada
                if (id.includes('-angle')) {
                    value.textContent = number.value + '°';
                } else if (id.includes('section-width')) {
                    value.textContent = number.value + '%';
                } else {
                value.textContent = number.value;
                }
                createGeometry();
            });
        }
    });
    
    // Eventos para controles de cor
    ['center-color', 'floor-color'].forEach(id => {
        const colorInput = document.getElementById(id);
        const colorValue = document.getElementById(`${id}-value`);
        
        if (colorInput && colorValue) {
            colorInput.addEventListener('input', () => {
                colorValue.textContent = colorInput.value;
                createGeometry();
            });
        }
    });
}

// Função para adicionar linhas de debug
let debugLines = [];

function addDebugLines() {
    // Remover linhas anteriores
    debugLines.forEach(line => scene.remove(line));
    debugLines = [];
    
    if (!centerWall || !centerWall.geometry) return;
    
    const geometry = centerWall.geometry;
    const vertices = geometry.attributes.position.array;
    const widthSegments = 100;
    const heightSegments = 10;
    
    // Material para linhas de debug
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    
    // Adicionar linhas verticais nos pontos críticos
    const centerWidth = parseFloat(document.getElementById('center-width').value);
    const leftWidth = parseFloat(document.getElementById('left-section-width').value);
    const rightWidth = parseFloat(document.getElementById('right-section-width').value);
    const height = parseFloat(document.getElementById('center-height').value);
    const curveRadius = parseFloat(document.getElementById('curve-radius').value);
    const leftAngle = parseFloat(document.getElementById('left-angle').value) * Math.PI / 180;
    const rightAngle = parseFloat(document.getElementById('right-angle').value) * Math.PI / 180;
    
    const totalWidth = centerWidth + (centerWidth * leftWidth / 100) + (centerWidth * rightWidth / 100);
    
    // Calcular posições dos pontos de dobra
    const leftSectionWidth = centerWidth * leftWidth / 100;
    const rightSectionWidth = centerWidth * rightWidth / 100;
    const leftFoldPoint = leftSectionWidth;
    const rightFoldPoint = leftSectionWidth + centerWidth;
    
    // Função auxiliar para criar linha vertical
    function createVerticalLine(x, z, color = 0xffffff) {
        const points = [];
        points.push(new THREE.Vector3(x, -height/2, z));
        points.push(new THREE.Vector3(x, height/2, z));
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: color, linewidth: 3 }));
        
        // Aplicar a mesma posição do centerWall
        line.position.copy(centerWall.position);
        
        scene.add(line);
        debugLines.push(line);
    }
    
    // Adicionar linhas nas posições críticas
    if (leftWidth > 0 && leftAngle != 0) {
        // Calcular posições base para seção esquerda
        let baseX, baseZ;
        if (leftAngle > 0) {
            baseX = -centerWidth/2 - curveRadius * Math.sin(leftAngle);
            baseZ = -curveRadius * (1 - Math.cos(leftAngle));
        } else {
            baseX = -centerWidth/2 - curveRadius * Math.sin(Math.abs(leftAngle));
            baseZ = curveRadius * (1 - Math.cos(Math.abs(leftAngle)));
        }
        
        // Início da curva esquerda (vermelho)
        createVerticalLine(-totalWidth/2 + leftFoldPoint - curveRadius, 0, 0xff0000);
        // Fim da curva esquerda (verde)
        createVerticalLine(-totalWidth/2 + leftFoldPoint + curveRadius, 0, 0x00ff00);
        // Posição base da seção dobrada (amarelo)
        createVerticalLine(baseX, baseZ, 0xffff00);
        
        // Direção da seção dobrada (ciano) - ponto mais distante
        const farX = baseX - leftSectionWidth * Math.cos(leftAngle);
        const farZ = baseZ + leftSectionWidth * Math.sin(Math.abs(leftAngle)) * (leftAngle > 0 ? -1 : 1);
        createVerticalLine(farX, farZ, 0x00ffff);
    }
    
    if (rightWidth > 0 && rightAngle != 0) {
        // Calcular posições base para seção direita
        let baseX, baseZ;
        if (rightAngle > 0) {
            baseX = centerWidth/2 + curveRadius * Math.sin(rightAngle);
            baseZ = -curveRadius * (1 - Math.cos(rightAngle));
        } else {
            baseX = centerWidth/2 + curveRadius * Math.sin(Math.abs(rightAngle));
            baseZ = curveRadius * (1 - Math.cos(Math.abs(rightAngle)));
        }
        
        // Início da curva direita (vermelho)
        createVerticalLine(-totalWidth/2 + rightFoldPoint - curveRadius, 0, 0xff0000);
        // Fim da curva direita (verde)
        createVerticalLine(-totalWidth/2 + rightFoldPoint + curveRadius, 0, 0x00ff00);
        // Posição base da seção dobrada (amarelo)
        createVerticalLine(baseX, baseZ, 0xffff00);
        
        // Direção da seção dobrada (ciano) - ponto mais distante
        const farX = baseX + rightSectionWidth * Math.cos(rightAngle);
        const farZ = baseZ + rightSectionWidth * Math.sin(Math.abs(rightAngle)) * (rightAngle > 0 ? -1 : 1);
        createVerticalLine(farX, farZ, 0x00ffff);
    }
    
    // Linha central (azul)
    createVerticalLine(0, 0, 0x0000ff);
    
    // Linhas de pontos de dobra exatos (rosa)
    if (leftWidth > 0) {
        createVerticalLine(-totalWidth/2 + leftFoldPoint, 0, 0xff00ff);
    }
    if (rightWidth > 0) {
        createVerticalLine(-totalWidth/2 + rightFoldPoint, 0, 0xff00ff);
    }
    
    // Adicionar uma linha horizontal no meio da altura para visualizar a continuidade
    const points = [];
    const numPoints = 100;
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const x = -totalWidth/2 + totalWidth * t;
        
        // Calcular Z baseado na posição X (mesma lógica do createGeometry)
        let z = 0;
        const leftFoldStart = leftFoldPoint - curveRadius;
        const leftFoldEnd = leftFoldPoint + curveRadius;
        const rightFoldStart = rightFoldPoint - curveRadius;
        const rightFoldEnd = rightFoldPoint + curveRadius;
        
        if (x < leftFoldStart && leftWidth > 0 && leftAngle != 0) {
            // Seção esquerda
            const distFromStart = leftFoldStart - x;
            let baseX, baseZ;
            if (leftAngle > 0) {
                baseX = -centerWidth/2 - curveRadius * Math.sin(leftAngle);
                baseZ = -curveRadius * (1 - Math.cos(leftAngle));
            } else {
                baseX = -centerWidth/2 - curveRadius * Math.sin(Math.abs(leftAngle));
                baseZ = curveRadius * (1 - Math.cos(Math.abs(leftAngle)));
            }
            z = baseZ + distFromStart * Math.sin(Math.abs(leftAngle)) * (leftAngle > 0 ? -1 : 1);
        }
        else if (x >= leftFoldStart && x <= leftFoldEnd && leftWidth > 0 && leftAngle != 0 && curveRadius > 0) {
            // Curva esquerda
            const localT = (x - leftFoldStart) / (2 * curveRadius);
            const angle = Math.abs(leftAngle) * (1 - localT);
            if (leftAngle > 0) {
                z = -curveRadius * (1 - Math.cos(angle));
            } else {
                z = curveRadius * (1 - Math.cos(angle));
            }
        }
        else if (x > rightFoldEnd && rightWidth > 0 && rightAngle != 0) {
            // Seção direita
            const distFromEnd = x - rightFoldEnd;
            let baseX, baseZ;
            if (rightAngle > 0) {
                baseX = centerWidth/2 + curveRadius * Math.sin(rightAngle);
                baseZ = -curveRadius * (1 - Math.cos(rightAngle));
            } else {
                baseX = centerWidth/2 + curveRadius * Math.sin(Math.abs(rightAngle));
                baseZ = curveRadius * (1 - Math.cos(Math.abs(rightAngle)));
            }
            z = baseZ + distFromEnd * Math.sin(Math.abs(rightAngle)) * (rightAngle > 0 ? -1 : 1);
        }
        else if (x >= rightFoldStart && x <= rightFoldEnd && rightWidth > 0 && rightAngle != 0 && curveRadius > 0) {
            // Curva direita
            const localT = (x - rightFoldStart) / (2 * curveRadius);
            const angle = Math.abs(rightAngle) * localT;
            if (rightAngle > 0) {
                z = -curveRadius * (1 - Math.cos(angle));
            } else {
                z = curveRadius * (1 - Math.cos(angle));
            }
        }
        
        points.push(new THREE.Vector3(x, 0, z));
    }
    
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
    line.position.copy(centerWall.position);
    scene.add(line);
    debugLines.push(line);
    
    // Adicionar esferas nos pontos críticos para melhor visualização
    const sphereGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    
    // Adicionar marcadores em intervalos regulares na curva para visualizar melhor
    const markerGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x8888ff });
    
    // Esfera no início da curva esquerda
    if (leftWidth > 0 && leftAngle != 0) {
        const leftStartX = -totalWidth/2 + leftFoldPoint - curveRadius;
        const leftStartMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const leftStartSphere = new THREE.Mesh(sphereGeometry, leftStartMaterial);
        leftStartSphere.position.set(leftStartX, 0, 0);
        leftStartSphere.position.add(centerWall.position);
        scene.add(leftStartSphere);
        debugLines.push(leftStartSphere);
        
        // Esfera no fim da curva esquerda
        const leftEndX = -totalWidth/2 + leftFoldPoint + curveRadius;
        const leftEndZ = 0; // No fim da curva, sempre volta a Z = 0
        const leftEndMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const leftEndSphere = new THREE.Mesh(sphereGeometry, leftEndMaterial);
        leftEndSphere.position.set(leftEndX, 0, leftEndZ);
        leftEndSphere.position.add(centerWall.position);
        scene.add(leftEndSphere);
        debugLines.push(leftEndSphere);
        
        // Esfera na base da seção dobrada
        const leftBaseMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const leftBaseSphere = new THREE.Mesh(sphereGeometry, leftBaseMaterial);
        leftBaseSphere.position.set(baseX, 0, baseZ);
        leftBaseSphere.position.add(centerWall.position);
        scene.add(leftBaseSphere);
        debugLines.push(leftBaseSphere);
        
        // Adicionar linha mostrando a direção no fim da curva
        const curveEndPoints = [];
        const curveEndX = -totalWidth/2 + leftFoldPoint + curveRadius;
        const curveEndZ = 0; // No fim da curva, sempre volta a Z = 0
        
        // Log para debug (comentado - remover se não for mais necessário)
        // console.log(`Left curve - End X: ${curveEndX}, Base X: ${baseX}, Angle: ${leftAngle * 180 / Math.PI}°`);
        // console.log(`Left curve - End Z: ${curveEndZ}, Base Z: ${baseZ}`);
        
        curveEndPoints.push(new THREE.Vector3(curveEndX, 0, curveEndZ));
        curveEndPoints.push(new THREE.Vector3(curveEndX - 0.5 * Math.cos(leftAngle), 0, curveEndZ + 0.5 * Math.sin(Math.abs(leftAngle)) * (leftAngle > 0 ? -1 : 1)));
        
        const curveEndGeometry = new THREE.BufferGeometry().setFromPoints(curveEndPoints);
        const curveEndLine = new THREE.Line(curveEndGeometry, new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 }));
        curveEndLine.position.copy(centerWall.position);
        scene.add(curveEndLine);
        debugLines.push(curveEndLine);
    }
}

// Animação
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Ajuste de redimensionamento
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== SISTEMA DE PRESETS =====

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

function setSliderValue(id, value) {
    const slider = document.getElementById(id);
    const numberInput = document.getElementById(id + '-number');
    const valueDisplay = document.getElementById(id + '-value');
    
    if (slider) {
        slider.value = value;
        if (numberInput) numberInput.value = value;
        if (valueDisplay) {
            // Formatação especial para alguns valores
            if (id.includes('angle')) {
                valueDisplay.textContent = value + '°';
            } else if (id.includes('section-width')) {
                valueDisplay.textContent = value + '%';
            } else {
                valueDisplay.textContent = value;
            }
        }
    }
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

// Variável global para controle de debug
let debugVisible = false;

function toggleDebugLines() {
    debugVisible = !debugVisible;
    if (debugVisible) {
        addDebugLines();
    } else {
        debugLines.forEach(line => scene.remove(line));
        debugLines = [];
    }
}

// Inicializar a aplicação
window.addEventListener('DOMContentLoaded', function() {
    init();
    
    // Aplicar Cave Padrão após inicialização
    setTimeout(() => {
        applyPreset('cavePadrao');
    }, 500);
});