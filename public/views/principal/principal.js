/**
 * principal.js
 * Lógica de la vista PRINCIPAL.
 * Carga y gestiona todos los componentes de control principal del robot.
 */

(function() {
    console.log(' Vista PRINCIPAL cargada');

    // Cargar todos los componentes necesarios
    loadAllComponents();

    /**
     * Carga todos los componentes JS necesarios para esta vista
     */
    function loadAllComponents() {
        const components = [
            '../src/components/cameras.js',
            '../src/components/texto.js',
            '../src/components/leds.js',
            '../src/components/animaciones.js',
            '../src/components/cabeza.js',
            '../src/components/audio.js',
            '../src/components/base.js'
        ];

        components.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = function() {
                console.log(' Componente cargado:', src);
                initializeComponent(src);
            };
            document.body.appendChild(script);
        });
    }

    /**
     * Inicializa un componente específico
     */
    function initializeComponent(componentPath) {
        const componentName = componentPath.split('/').pop().replace('.js', '');
        
        // eslint-disable-next-line default-case
        switch(componentName) {
            case 'cameras':
                if (window.CamerasComponent) {
                    window.CamerasComponent.init('cameras-container');
                }
                break;
            case 'texto':
                if (window.TextoComponent) {
                    window.TextoComponent.init('speech-container');
                }
                break;
            case 'leds':
                if (window.LedsComponent) {
                    window.LedsComponent.init('leds-container');
                }
                break;
            case 'animaciones':
                if (window.AnimacionesComponent) {
                    window.AnimacionesComponent.init('animations-container');
                }
                break;
            case 'cabeza':
                if (window.CabezaComponent) {
                    window.CabezaComponent.init('head-container');
                }
                break;
            case 'audio':
                if (window.AudioComponent) {
                    window.AudioComponent.init('audio-container');
                }
                break;
            case 'base':
                if (window.BaseComponent) {
                    window.BaseComponent.init('base-container');
                }
                break;
        }
    }
})();