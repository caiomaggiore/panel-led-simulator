// modules/ui-controls.js
// Sistema de Controles de Interface - Gerenciamento de sliders, abas e eventos

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

// Configurar controles de interface
function setupControls() {
    // Eventos para carregar texturas do painel central
    const centerLoadBtn = document.getElementById('center-load-btn');
    if (centerLoadBtn) {
        centerLoadBtn.addEventListener('click', loadCenterTexture);
    }
    
    // Eventos para carregar texturas do piso
    const floorLoadBtn = document.getElementById('floor-load-btn');
    if (floorLoadBtn) {
        floorLoadBtn.addEventListener('click', loadFloorTexture);
    }
    
    // Evento para carregar imagem (botão principal)
    const loadBtn = document.getElementById('load-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            const imageUrl = document.getElementById('image-url').value;
            if (imageUrl) {
                loadTexture(imageUrl);
            } else {
                alert('Por favor, insira uma URL de imagem.');
            }
        });
    }
    
    // Evento para carregar arquivo local
    const imageFile = document.getElementById('image-file');
    if (imageFile) {
        imageFile.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const fileName = document.getElementById('file-name');
                if (fileName) fileName.textContent = file.name;
                loadTexture(file, true);
            }
        });
    }
    
    // Eventos para as abas principais
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
        'center-width', 'center-height', 'center-position-x', 'center-position-y', 'center-position-z',
        'left-section-width', 'right-section-width', 'left-angle', 'right-angle', 'curve-radius',
        'center-offset-x', 'center-offset-y', 'center-scale-x', 'center-scale-y',
        'floor-width', 'floor-depth', 'floor-position-x', 'floor-position-y', 'floor-position-z',
        'floor-offset-x', 'floor-offset-y', 'floor-scale-x', 'floor-scale-y'
    ];

    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        const numberInput = document.getElementById(sliderId + '-number');
        const valueDisplay = document.getElementById(sliderId + '-value');

        if (slider && numberInput && valueDisplay) {
            // Sincronizar slider com input numérico
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                numberInput.value = value;
                
                // Formatação especial para alguns valores
                if (sliderId.includes('angle')) {
                    valueDisplay.textContent = value + '°';
                } else if (sliderId.includes('section-width')) {
                    valueDisplay.textContent = value + '%';
                } else {
                    valueDisplay.textContent = value;
                }
                
                createGeometry();
            });

            // Sincronizar input numérico com slider
            numberInput.addEventListener('input', (e) => {
                const value = e.target.value;
                slider.value = value;
                
                // Formatação especial para alguns valores
                if (sliderId.includes('angle')) {
                    valueDisplay.textContent = value + '°';
                } else if (sliderId.includes('section-width')) {
                    valueDisplay.textContent = value + '%';
                } else {
                    valueDisplay.textContent = value;
                }
                
                createGeometry();
            });
        }
    });

    // Eventos para inputs de cor
    const centerColorInput = document.getElementById('center-color');
    const floorColorInput = document.getElementById('floor-color');

    if (centerColorInput) {
        centerColorInput.addEventListener('change', createGeometry);
    }
    
    if (floorColorInput) {
        floorColorInput.addEventListener('change', createGeometry);
    }
}
