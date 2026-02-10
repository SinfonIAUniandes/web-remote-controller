/**
 * navigation.js
 * Sistema de navegación entre las diferentes vistas de la aplicación.
 * Carga dinámicamente HTML, CSS y JS de cada vista.
 */

const Navigation = (function() {
    const views = {
        home: {
            html: '../src/views/home/home.html',
            css: '../src/views/home/home.css',
            js: '../src/views/home/home.js'
        },
        principal: {
            html: '../src/views/principal/principal.html',
            css: '../src/views/principal/principal.css',
            js: '../src/views/principal/principal.js'
        },
        servicios: {
            html: '../src/views/servicios/servicios.html',
            css: '../src/views/servicios/servicios.css',
            js: '../src/views/servicios/servicios.js'
        },
        scripts: {
            html: '../src/views/scripts/scripts.html',
            css: '../src/views/scripts/scripts.css',
            js: '../src/views/scripts/scripts.js'
        }
    };

    let currentView = null;
    let loadedStyles = [];
    let loadedScripts = [];

    /**
     * Carga una vista específica
     */
    async function loadView(viewName) {
        if (!views[viewName]) {
            console.error('Vista no encontrada:', viewName);
            return;
        }

        // Limpiar scripts y estilos anteriores
        cleanupCurrentView();

        const view = views[viewName];
        
        try {
            // Cargar el sidebar (siempre presente)
            await loadSidebar(viewName);

            // Cargar el HTML de la vista
            await loadHTML(view.html);

            // Cargar el CSS de la vista
            await loadCSS(view.css);

            // Cargar el JS de la vista
            await loadJS(view.js);

            currentView = viewName;
            console.log('✅ Vista cargada:', viewName);

        } catch (error) {
            console.error('❌ Error cargando vista:', error);
        }
    }

    /**
     * Carga el sidebar con la navegación
     */
    async function loadSidebar(activeView) {
        const sidebarHTML = `
            <h2>🤖 Pepper Control</h2>
            
            <div id="connection-status" style="margin-bottom: 20px; padding: 10px; background-color: rgba(255,255,255,0.1); border-radius: 5px; text-align: center;">
                <span class="status-indicator status-disconnected"></span>Desconectado
            </div>

            <nav>
                <button class="${activeView === 'home' ? 'active' : ''}" onclick="Navigation.loadView('home')">
                    🏠 Inicio
                </button>
                <button class="${activeView === 'principal' ? 'active' : ''}" onclick="Navigation.loadView('principal')">
                    🎮 Principal
                </button>
                <button class="${activeView === 'servicios' ? 'active' : ''}" onclick="Navigation.loadView('servicios')">
                    ⚙️ Servicios
                </button>
                <button class="${activeView === 'scripts' ? 'active' : ''}" onclick="Navigation.loadView('scripts')">
                    📝 Scripts
                </button>
            </nav>

            <div id="battery-widget"></div>
            <div id="volume-widget"></div>
        `;

        document.getElementById('sidebar').innerHTML = sidebarHTML;
        
        // Cargar widgets del sidebar
        if (window.BatteryComponent) {
            window.BatteryComponent.init('battery-widget');
        }
        if (window.VolumeComponent) {
            window.VolumeComponent.init('volume-widget');
        }
    }

    /**
     * Carga el HTML de una vista
     */
    async function loadHTML(htmlPath) {
        const response = await fetch(htmlPath);
        const html = await response.text();
        document.getElementById('main-content').innerHTML = html;
    }

    /**
     * Carga el CSS de una vista
     */
    async function loadCSS(cssPath) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            link.onload = () => {
                loadedStyles.push(link);
                resolve();
            };
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    /**
     * Carga el JS de una vista
     */
    async function loadJS(jsPath) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = jsPath;
            script.onload = () => {
                loadedScripts.push(script);
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    /**
     * Limpia la vista actual (remueve CSS y JS)
     */
    function cleanupCurrentView() {
        // Remover estilos cargados
        loadedStyles.forEach(link => {
            if (link.parentNode) {
                link.parentNode.removeChild(link);
            }
        });
        loadedStyles = [];

        // Remover scripts cargados
        loadedScripts.forEach(script => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
        loadedScripts = [];
    }

    // API pública
    return {
        loadView: loadView
    };
})();