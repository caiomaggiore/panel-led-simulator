// modules/debug-tools.js
// Ferramentas de Debug - Visualização de geometria e continuidade

// Array global para armazenar linhas de debug
let debugLines = [];
let debugVisible = false;

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
            baseX = -centerWidth/2 + curveRadius * Math.sin(Math.abs(leftAngle));
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
            baseX = centerWidth/2 - curveRadius * Math.sin(Math.abs(rightAngle));
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
                baseX = -centerWidth/2 + curveRadius * Math.sin(Math.abs(leftAngle));
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
                baseX = centerWidth/2 - curveRadius * Math.sin(Math.abs(rightAngle));
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

function toggleDebugLines() {
    debugVisible = !debugVisible;
    if (debugVisible) {
        addDebugLines();
    } else {
        debugLines.forEach(line => scene.remove(line));
        debugLines = [];
    }
}
