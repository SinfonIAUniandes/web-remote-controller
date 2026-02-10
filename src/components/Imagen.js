/**
 * imagen.js
 * Componente que permite mostrar imágenes en la tablet del robot Pepper.
 * Puede cargar imágenes desde URL o desde archivos locales (convertidos a base64).
 */
import RosManager from '../services/RosManager.js'; 
const ImagenComponent = (function() {
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
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 10px;">
                    <strong>Opción 1: URL de imagen</strong>
                    <input 
                        type="text" 
                        id="image-url-input" 
                        placeholder="https://ejemplo.com/imagen.jpg"
                        style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                    >
                </label>
                
                <button 
                    class="btn-primary" 
                    onclick="ImagenComponent.showImageFromURL()" 
                    style="width: 100%; padding: 10px; margin-bottom: 10px;"
                >
                     Mostrar desde URL
                </button>
            </div>

            <div style="border-top: 2px dashed #ccc; padding-top: 15px;">
                <label style="display: block; margin-bottom: 10px;">
                    <strong>Opción 2: Subir archivo</strong>
                    <input 
                        type="file" 
                        id="image-file-input" 
                        accept="image/*"
                        onchange="ImagenComponent.handleFileUpload()"
                        style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                    >
                </label>
                
                <div id="image-preview" style="margin-top: 10px; text-align: center;"></div>
            </div>
        `;
    }

    /**
     * Muestra una imagen desde URL
     */
    function showImageFromURL() {
        const urlInput = document.getElementById('image-url-input');
        if (!urlInput) return;

        const imageUrl = urlInput.value.trim();
        
        if (!imageUrl) {
            alert('Por favor, ingresa una URL de imagen válida.');
            return;
        }

        sendImageToTablet(imageUrl);
    }

    /**
     * Maneja la subida de archivo y lo convierte a base64
     */
    async function handleFileUpload() {
        const fileInput = document.getElementById('image-file-input');
        if (!fileInput || !fileInput.files || !fileInput.files[0]) return;

        const file = fileInput.files[0];
        
        // Verificar que sea una imagen
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen válido.');
            return;
        }

        try {
            const base64Data = await convertFileToBase64(file);
            
            // Mostrar preview
            const preview = document.getElementById('image-preview');
            if (preview) {
                preview.innerHTML = `
                    <img src="${base64Data}" style="max-width: 200px; border-radius: 5px; margin-bottom: 10px;">
                    <br>
                    <button class="btn-success" onclick="ImagenComponent.showImageFromFile()">
                         Enviar a la Tablet
                    </button>
                `;
            }
            
            // Guardar base64 temporalmente
            ImagenComponent._tempBase64 = base64Data;
            
        } catch (error) {
            console.error('Error convirtiendo archivo:', error);
            alert('Error al procesar la imagen.');
        }
    }

    /**
     * Convierte un archivo a base64
     */
    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    }

    /**
     * Muestra la imagen desde archivo (base64)
     */
    function showImageFromFile() {
        if (!ImagenComponent._tempBase64) {
            alert('No hay imagen cargada.');
            return;
        }

        sendImageToTablet(ImagenComponent._tempBase64);
    }

    /**
     * Envía la imagen a la tablet del robot
     */
    function sendImageToTablet(imageData) {
        const service = RosManager.createService(
            '/pytoolkit/ALTabletService/show_image_srv',
            'robot_toolkit_msgs/tablet_service_srv'
        );

        if (!service) {
            alert('Error: El servicio de tablet no está disponible.');
            return;
        }

        const request = { url: imageData };

        RosManager.callService(service, request,
            function(result) {
                console.log('Imagen mostrada en tablet:', result);
                alert(' Imagen cargada en la tablet del robot');
            },
            function(error) {
                console.error('Error mostrando imagen:', error);
                alert(' Error al cargar la imagen en la tablet');
            }
        );
    }

    // API pública
    return {
        init: init,
        showImageFromURL: showImageFromURL,
        handleFileUpload: handleFileUpload,
        showImageFromFile: showImageFromFile,
        _tempBase64: null
    };
})();

