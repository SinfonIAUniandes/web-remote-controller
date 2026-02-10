/**
 * animaciones.js
 * Componente que permite ejecutar animaciones del robot Pepper.
 * Carga las animaciones disponibles desde un archivo de texto.
 */
import RosManager from '../services/RosManager.js';
const AnimacionesComponent = (function() {
    let containerId = null;
    let animationTopic = null;
    let animations = {};

    /**
     * Inicializa el componente
     */
    function init(elementId) {
        containerId = elementId;
        render();
        loadAnimations();
        createAnimationTopic();
    }

    /**
     * Renderiza el HTML del componente
     */
    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <label style="display: block; margin-bottom: 10px;">
                <strong>Categoría:</strong>
                <select 
                    id="animation-category" 
                    onchange="AnimacionesComponent.onCategoryChange()"
                    style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                >
                    <option value="">Seleccione una categoría</option>
                </select>
            </label>
            
            <div id="subcategory-container" style="display: none;">
                <label style="display: block; margin-bottom: 10px;">
                    <strong>Subcategoría:</strong>
                    <select 
                        id="animation-subcategory" 
                        onchange="AnimacionesComponent.onSubcategoryChange()"
                        style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                    >
                        <option value="">Seleccione una subcategoría</option>
                        {Object.keys(animations[selectedCategory] || {}).map(subcategory => (
                            <option key={subcategory} value={subcategory}>{subcategory === "_no_subcategory" ? "Sin subcategoría" : subcategory}</option>
                        ))}
                    </select>
                </label>
            </div>
            
            <label style="display: block; margin-bottom: 10px;">
                <strong>Animación:</strong>
                <select 
                    id="animation-name"
                    style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                >
                    <option value="">Seleccione una animación</option>
                </select>
            </label>
            
            <button 
                class="btn-primary" 
                onclick="AnimacionesComponent.executeAnimation()" 
                style="width: 100%; padding: 12px;"
            >
                    Ejecutar Animación
            </button>
        `;
    }

    /**
     * Carga las animaciones desde el documento
     */
    function loadAnimations() {
        // Usar el texto del documento de animaciones
        const animationsText = `BodyTalk/Listening/Listening_1
BodyTalk/Listening/Listening_2
BodyTalk/Speaking/BodyTalk_1
BodyTalk/Speaking/BodyTalk_2
Emotions/Negative/Angry_1
Emotions/Negative/Sad_1
Emotions/Positive/Happy_1
Emotions/Positive/Excited_1
Gestures/Hey_1
Gestures/Yes_1
Gestures/No_1
Waiting/Think_1`;

        parseAnimations(animationsText);
        populateCategories();
    }

    /**
     * Parsea el texto de animaciones
     */
    function parseAnimations(text) {
        const lines = text.split('\n');
        
        lines.forEach(line => {
            const parts = line.trim().split('/');
            
            if (parts.length === 3) {
                const [category, subcategory, anim] = parts;
                if (!animations[category]) animations[category] = {};
                if (!animations[category][subcategory]) animations[category][subcategory] = [];
                animations[category][subcategory].push(anim);
            } else if (parts.length === 2) {
                const [category, anim] = parts;
                if (!animations[category]) animations[category] = {};
                if (!animations[category]["_no_subcategory"]) animations[category]["_no_subcategory"] = [];
                animations[category]["_no_subcategory"].push(anim);
            }
        });

        console.log('Animaciones cargadas:', animations);
    }

    /**
     * Puebla el select de categorías
     */
    function populateCategories() {
        const categorySelect = document.getElementById('animation-category');
        if (!categorySelect) return;

        Object.keys(animations).forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    /**
     * Maneja el cambio de categoría
     */
    function onCategoryChange() {
        const categorySelect = document.getElementById('animation-category');
        const subcategoryContainer = document.getElementById('subcategory-container');
        const subcategorySelect = document.getElementById('animation-subcategory');
        const animationSelect = document.getElementById('animation-name');

        if (!categorySelect || !subcategoryContainer || !subcategorySelect || !animationSelect) return;

        const selectedCategory = categorySelect.value;
        
        // Limpiar selects
        subcategorySelect.innerHTML = '<option value="">Seleccione una subcategoría</option>';
        animationSelect.innerHTML = '<option value="">Seleccione una animación</option>';

        if (!selectedCategory || !animations[selectedCategory]) {
            subcategoryContainer.style.display = 'none';
            return;
        }

        const subcategories = Object.keys(animations[selectedCategory]);

        if (subcategories.length === 1 && subcategories[0] === '_no_subcategory') {
            // No tiene subcategorías
            subcategoryContainer.style.display = 'none';
            populateAnimations(selectedCategory, '_no_subcategory');
        } else {
            // Tiene subcategorías
            subcategoryContainer.style.display = 'block';
            subcategories.forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory;
                option.textContent = subcategory === '_no_subcategory' ? 'General' : subcategory;
                subcategorySelect.appendChild(option);
            });
        }
    }

    /**
     * Maneja el cambio de subcategoría
     */
    function onSubcategoryChange() {
        const categorySelect = document.getElementById('animation-category');
        const subcategorySelect = document.getElementById('animation-subcategory');

        if (!categorySelect || !subcategorySelect) return;

        const selectedCategory = categorySelect.value;
        const selectedSubcategory = subcategorySelect.value;

        if (selectedCategory && selectedSubcategory) {
            populateAnimations(selectedCategory, selectedSubcategory);
        }
    }

    /**
     * Puebla el select de animaciones
     */
    function populateAnimations(category, subcategory) {
        const animationSelect = document.getElementById('animation-name');
        if (!animationSelect) return;

        animationSelect.innerHTML = '<option value="">Seleccione una animación</option>';

        const anims = animations[category]?.[subcategory] || [];
        anims.forEach(anim => {
            const option = document.createElement('option');
            option.value = anim;
            option.textContent = anim;
            animationSelect.appendChild(option);
        });
    }

    /**
     * Crea el tópico de animaciones
     */
    function createAnimationTopic() {
        animationTopic = RosManager.createTopic('/animations', 'robot_toolkit_msgs/animation_msg');
    }

    /**
     * Ejecuta la animación seleccionada
     */
    function executeAnimation() {
        const categorySelect = document.getElementById('animation-category');
        const subcategorySelect = document.getElementById('animation-subcategory');
        const animationSelect = document.getElementById('animation-name');

        if (!categorySelect || !animationSelect) {
            console.error('Elementos no encontrados');
            return;
        }

        const category = categorySelect.value;
        const subcategory = subcategorySelect ? subcategorySelect.value : '_no_subcategory';
        const animation = animationSelect.value;

        if (!category || !animation) {
            alert('Por favor, seleccione una animación.');
            return;
        }

        const fullPath = subcategory === '_no_subcategory' || !subcategory
            ? `${category}/${animation}`
            : `${category}/${subcategory}/${animation}`;

        if (!animationTopic) {
            alert('Error: El tópico de animaciones no está disponible.');
            return;
        }

        const message = {
            family: "animations",
            animation_name: fullPath
        };

        RosManager.publishMessage(animationTopic, message);
        console.log('Animación ejecutada:', fullPath);
    }

    // API pública
    return {
        init: init,
        onCategoryChange: onCategoryChange,
        onSubcategoryChange: onSubcategoryChange,
        executeAnimation: executeAnimation
    };
})();