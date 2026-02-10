/**
 * showWords.js
 * Componente que muestra texto/palabras en la pantalla de la tablet del robot Pepper.
 * Útil para mostrar subtítulos, mensajes o información textual.
 */
import RosManager from '../services/RosManager.js'; 
const ShowWordsComponent = (function() {
    let containerId = null;

    /**
     * Inicializa el componente
     */
    function init(elementId) {
        containerId = elementId;
        render();
    }

    /**
     * Renderiza el HTML del componente
     */
    function render() {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="alert alert-info">
                <strong> Mostrar Texto en Tablet</strong><br>
                Muestra texto o mensajes en la pantalla del robot.
            </div>

            <label style="display: block; margin-bottom: 10px;">
                <strong>Texto a mostrar:</strong>
                <textarea 
                    id="words-textarea" 
                    placeholder="Escribe el texto que quieres mostrar en la tablet..."
                    rows="4"
                    style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc; resize: vertical;"
                ></textarea>
            </label>

            <label style="display: block; margin-bottom: 10px;">
                <strong>Tamaño de fuente:</strong>
                <select 
                    id="font-size-select"
                    style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                >
                    <option value="small">Pequeño</option>
                    <option value="medium" selected>Mediano</option>
                    <option value="large">Grande</option>
                    <option value="xlarge">Extra Grande</option>
                </select>
            </label>

            <label style="display: block; margin-bottom: 15px;">
                <strong>Color del texto:</strong>
                <input 
                    type="color" 
                    id="text-color-input" 
                    value="#000000"
                    style="width: 100%; height: 50px; border: none; cursor: pointer; margin-top: 5px; border-radius: 5px;"
                >
            </label>

            <button 
                class="btn-primary" 
                onclick="ShowWordsComponent.showWords()"
                style="width: 100%; padding: 12px; font-size: 16px;"
            >
                 Mostrar Texto en Tablet
            </button>

            <div style="margin-top: 15px; padding: 10px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                <p style="font-size: 12px; margin: 0;">
                    <strong> Consejo:</strong> Este texto aparecerá en la pantalla de la tablet del robot. 
                    Es útil para mostrar subtítulos cuando el robot habla o para mostrar información visual.
                </p>
            </div>

            <div id="preview-container" style="margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; border: 2px dashed #ccc; display: none;">
                <p style="font-size: 12px; margin: 0 0 10px 0; color: #666;"><strong>Vista previa:</strong></p>
                <div id="text-preview" style="text-align: center; padding: 20px;"></div>
            </div>
        `;

        // Agregar listener para vista previa en tiempo real
        const textarea = document.getElementById('words-textarea');
        const colorInput = document.getElementById('text-color-input');
        const fontSizeSelect = document.getElementById('font-size-select');

        if (textarea && colorInput && fontSizeSelect) {
            const updatePreview = () => {
                const previewContainer = document.getElementById('preview-container');
                const textPreview = document.getElementById('text-preview');
                const text = textarea.value;

                if (text.trim() && textPreview && previewContainer) {
                    previewContainer.style.display = 'block';
                    
                    const fontSizes = {
                        'small': '16px',
                        'medium': '24px',
                        'large': '36px',
                        'xlarge': '48px'
                    };

                    textPreview.innerHTML = text.replace(/\n/g, '<br>');
                    textPreview.style.color = colorInput.value;
                    textPreview.style.fontSize = fontSizes[fontSizeSelect.value];
                } else if (previewContainer) {
                    previewContainer.style.display = 'none';
                }
            };

            textarea.addEventListener('input', updatePreview);
            colorInput.addEventListener('input', updatePreview);
            fontSizeSelect.addEventListener('change', updatePreview);
        }
    }

    /**
     * Muestra las palabras en la tablet
     */
    function showWords() {
        const textarea = document.getElementById('words-textarea');
        
        if (!textarea) {
            console.error('Textarea no encontrado');
            return;
        }

        const text = textarea.value.trim();
        
        if (!text) {
            alert('Por favor, escribe el texto que quieres mostrar.');
            return;
        }

        const service = RosManager.createService(
            '/pytoolkit/ALTabletService/show_words_srv',
            'robot_toolkit_msgs/battery_service_srv'
        );

        if (!service) {
            alert('Error: El servicio de mostrar palabras no está disponible.');
            return;
        }

        const request = {}; // El texto se envía de otra forma o el servicio usa configuración por defecto

        RosManager.callService(service, request,
            function(result) {
                console.log('Texto mostrado en tablet:', result);
                alert(' Texto mostrado en la tablet del robot');
            },
            function(error) {
                console.error('Error mostrando texto:', error);
                // Como alternativa, crear una página HTML con el texto y mostrarla
                showWordsAlternative(text);
            }
        );
    }

    /**
     * Método alternativo: crear una página HTML con el texto y mostrarla
     */
    function showWordsAlternative(text) {
        const colorInput = document.getElementById('text-color-input');
        const fontSizeSelect = document.getElementById('font-size-select');
        
        const color = colorInput ? colorInput.value : '#000000';
        const fontSize = fontSizeSelect ? fontSizeSelect.value : 'medium';

        const fontSizes = {
            'small': '32px',
            'medium': '48px',
            'large': '72px',
            'xlarge': '96px'
        };

        // Crear HTML con el texto estilizado
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background-color: #ffffff;
                        font-family: Arial, sans-serif;
                    }
                    .text-container {
                        text-align: center;
                        color: ${color};
                        font-size: ${fontSizes[fontSize]};
                        line-height: 1.5;
                        max-width: 90%;
                    }
                </style>
            </head>
            <body>
                <div class="text-container">
                    ${text.replace(/\n/g, '<br>')}
                </div>
            </body>
            </html>
        `;

        // Convertir a base64 (data URL)
        const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
        const dataUrl = `data:text/html;base64,${base64Html}`;

        // Usar el servicio de navegador para mostrar
        const navService = RosManager.createService(
            '/pytoolkit/ALTabletService/show_web_view_srv',
            'robot_toolkit_msgs/tablet_service_srv'
        );

        if (navService) {
            RosManager.callService(navService, { url: dataUrl },
                function(result) {
                    console.log('Texto mostrado vía HTML:', result);
                    alert(' Texto mostrado en la tablet del robot');
                }
            );
        }
    }

    // API pública
    return {
        init: init,
        showWords: showWords
    };
})();
