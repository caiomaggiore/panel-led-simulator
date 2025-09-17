// script-core.js
// Core do Sistema 3D - Funcionalidades principais de renderização e geometria

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
    
    // Configurar controles de interface (função externa)
    setupControls();
    
    // Iniciar animação
    animate();
    
    // Ajustar para redimensionamento da janela
    window.addEventListener('resize', onWindowResize);
}

// Carregar textura
function loadTexture(source, isFile = false) {
    const loadingElement = document.createElement('div');
    loadingElement.textContent = 'Carregando textura...';
    loadingElement.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:10px;z-index:9999;';
    document.body.appendChild(loadingElement);

    textureLoader.load(
        isFile ? URL.createObjectURL(source) : source,
        (texture) => {
            centerTexture = texture;
            centerTexture.wrapS = THREE.RepeatWrapping;
            centerTexture.wrapT = THREE.RepeatWrapping;
            
            // Definir cor como branco quando textura é carregada
            document.getElementById('center-color').value = '#ffffff';
            
            createGeometry();
            document.body.removeChild(loadingElement);
        },
        undefined,
        (error) => {
            console.error('Erro ao carregar textura:', error);
            document.body.removeChild(loadingElement);
            alert('Erro ao carregar a imagem. Verifique a URL ou o arquivo.');
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
    
    // Deformar os vértices para criar dobras contínuas (lógica do script.js original)
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
            
            // Calcular posição base corretamente (do script.js original)
            if (leftAngle > 0) {
                baseX = -centerWidth/2 - curveRadius * Math.sin(leftAngle);
                baseZ = -curveRadius * (1 - Math.cos(leftAngle));
            } else {
                baseX = -centerWidth/2 - curveRadius * Math.sin(Math.abs(leftAngle));
                baseZ = curveRadius * (1 - Math.cos(Math.abs(leftAngle)));
            }
            
            newX = baseX - distFromStart * Math.cos(leftAngle);
            newZ = baseZ + distFromStart * Math.sin(Math.abs(leftAngle)) * (leftAngle > 0 ? -1 : 1);
        } 
        else if (x >= leftFoldStart && x <= leftFoldEnd && leftWidth > 0 && leftAngle != 0 && curveRadius > 0) {
            // Zona de curva esquerda (lógica corrigida do script.js original)
            const t = (x - leftFoldStart) / (2 * curveRadius);
            const angle = Math.abs(leftAngle) * (1 - t);
            
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
            
            if (rightAngle > 0) {
                baseX = centerWidth/2 + curveRadius * Math.sin(rightAngle);
                baseZ = -curveRadius * (1 - Math.cos(rightAngle));
            } else {
                baseX = centerWidth/2 + curveRadius * Math.sin(Math.abs(rightAngle));
                baseZ = curveRadius * (1 - Math.cos(Math.abs(rightAngle)));
            }
            
            newX = baseX + distFromEnd * Math.cos(rightAngle);
            newZ = baseZ + distFromEnd * Math.sin(Math.abs(rightAngle)) * (rightAngle > 0 ? -1 : 1);
        }
        else if (x >= rightFoldStart && x <= rightFoldEnd && rightWidth > 0 && rightAngle != 0 && curveRadius > 0) {
            // Zona de curva direita (lógica corrigida do script.js original)
            const t = (x - rightFoldStart) / (2 * curveRadius);
            const angle = Math.abs(rightAngle) * t;
            
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
    
    // Aplicar offset e escala da textura do painel central
    if (centerTexture) {
        const offsetX = parseFloat(document.getElementById('center-offset-x').value);
        const offsetY = parseFloat(document.getElementById('center-offset-y').value);
        const scaleX = parseFloat(document.getElementById('center-scale-x').value);
        const scaleY = parseFloat(document.getElementById('center-scale-y').value);
        
        centerTexture.offset.set(offsetX, offsetY);
        centerTexture.repeat.set(scaleX, scaleY);
        centerTexture.needsUpdate = true;
    }
    
    // Aplicar offset e escala da textura do piso
    if (floorTexture) {
        const offsetX = parseFloat(document.getElementById('floor-offset-x').value);
        const offsetY = parseFloat(document.getElementById('floor-offset-y').value);
        const scaleX = parseFloat(document.getElementById('floor-scale-x').value);
        const scaleY = parseFloat(document.getElementById('floor-scale-y').value);
        
        floorTexture.offset.set(offsetX, offsetY);
        floorTexture.repeat.set(scaleX, scaleY);
        floorTexture.needsUpdate = true;
    }
}

// Funções de carregamento de textura
function loadCenterTexture() {
    const url = document.getElementById('center-texture-url').value;
    if (!url) {
        alert('Por favor, insira uma URL de imagem.');
        return;
    }
    
    const loadingElement = document.createElement('div');
    loadingElement.textContent = 'Carregando textura do painel...';
    loadingElement.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:10px;z-index:9999;';
    document.body.appendChild(loadingElement);

    textureLoader.load(
        url,
        (texture) => {
            centerTexture = texture;
            centerTexture.wrapS = THREE.RepeatWrapping;
            centerTexture.wrapT = THREE.RepeatWrapping;
            
            // Definir cor como branco quando textura é carregada
            document.getElementById('center-color').value = '#ffffff';
            
            createGeometry();
            document.body.removeChild(loadingElement);
        },
        undefined,
        (error) => {
            console.error('Erro ao carregar textura:', error);
            document.body.removeChild(loadingElement);
            alert('Erro ao carregar a imagem. Verifique a URL.');
        }
    );
}

function loadFloorTexture() {
    const url = document.getElementById('floor-texture-url').value;
    if (!url) {
        alert('Por favor, insira uma URL de imagem.');
        return;
    }
    
    const loadingElement = document.createElement('div');
    loadingElement.textContent = 'Carregando textura do piso...';
    loadingElement.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:10px;z-index:9999;';
    document.body.appendChild(loadingElement);

    textureLoader.load(
        url,
        (texture) => {
            floorTexture = texture;
            floorTexture.wrapS = THREE.RepeatWrapping;
            floorTexture.wrapT = THREE.RepeatWrapping;
            
            // Definir cor como branco quando textura é carregada
            document.getElementById('floor-color').value = '#ffffff';
            
            createGeometry();
            document.body.removeChild(loadingElement);
        },
        undefined,
        (error) => {
            console.error('Erro ao carregar textura:', error);
            document.body.removeChild(loadingElement);
            alert('Erro ao carregar a imagem. Verifique a URL.');
        }
    );
}

// Carregar textura (função original do script.js)
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
            document.getElementById('floor-color').value = '#ffffff';
            
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

// Inicializar a aplicação
window.addEventListener('DOMContentLoaded', function() {
    init();
    
    // Inicializar módulos externos
    if (typeof initializePresets === 'function') {
        initializePresets();
    }
});
