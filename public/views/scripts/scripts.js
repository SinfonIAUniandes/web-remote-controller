/**
 * scripts.js
 * Lógica de la vista de SCRIPTS.
 * Carga componentes para gestionar scripts del robot.
 */

(function() {
    console.log('Vista SCRIPTS cargada');

    loadAllComponents();

    function loadAllComponents() {
        const components = [
            '../src/components/quickActions.js',
            '../src/components/scriptsCreator.js',
            '../src/components/scriptPanel.js'
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
            'quickActions': () => window.QuickActionsComponent?.init('quick-actions-container'),
            'scriptsCreator': () => window.ScriptsCreatorComponent?.init('scripts-creator-container'),
            'scriptPanel': () => window.ScriptPanelComponent?.init('script-panel-container')
        };

        if (initMap[componentName]) {
            initMap[componentName]();
        }
    }
})();
