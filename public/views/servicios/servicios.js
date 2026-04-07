/**
 * servicios.js
 * Lógica de la vista de SERVICIOS.
 * Carga componentes relacionados con servicios del robot.
 */

(function() {
    console.log('Vista SERVICIOS cargada');

    loadAllComponents();

    function loadAllComponents() {
        const components = [
            '../src/components/navegador.js',
            '../src/components/imagen.js',
            '../src/components/breathing.js',
            '../src/components/autonomous.js',
            '../src/components/tracker.js',
            '../src/components/security.js',
            '../src/components/posture.js',
            '../src/components/hideTablet.js',    // ← NUEVO
            '../src/components/showWords.js'      // ← NUEVO
];

        components.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = function() {
                console.log('✅ Componente cargado:', src);
                initializeComponent(src);
            };
            document.body.appendChild(script);
        });
    }

    function initializeComponent(componentPath) {
        const componentName = componentPath.split('/').pop().replace('.js', '');
        
        const initMap = {
            'navegador': () => window.NavegadorComponent?.init('navegador-container'),
            'imagen': () => window.ImagenComponent?.init('imagen-container'),
            'breathing': () => window.BreathingComponent?.init('breathing-container'),
            'autonomous': () => window.AutonomousComponent?.init('autonomous-container'),
            'tracker': () => window.TrackerComponent?.init('tracker-container'),
            'security': () => window.SecurityComponent?.init('security-container'),
            'posture': () => window.PostureComponent?.init('posture-container')
        };

        if (initMap[componentName]) {
            initMap[componentName]();
        }
    }
})();