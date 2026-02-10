/* eslint-disable no-restricted-globals */
/**
 * security.js
 * Componente que controla la seguridad del robot Pepper.
 * Permite habilitar/deshabilitar la seguridad y ajustar la distancia de seguridad.
 */
import RosManager from '../services/RosManager.js'; 
const SecurityComponent = (function() {
    let containerId = null;
    let securityEnabled = true;
    let securityDistance = 0.05; // metros

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
            <div class="alert alert-warning">
                <strong> Importante:</strong> La seguridad del robot protege 
                contra colisiones. Solo desactívala si es estrictamente necesario 
                y tienes control total del entorno.
            </div>

            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px;"> Control de Seguridad</h4>
                
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button 
                        class="btn-success" 
                        onclick="SecurityComponent.enableSecurity()"
                        style="flex: 1; padding: 12px;"
                    >
                         Habilitar Seguridad
                    </button>
                    <button 
                        class="btn-danger" 
                        onclick="SecurityComponent.disableSecurity()"
                        style="flex: 1; padding: 12px;"
                    >
                         Deshabilitar Seguridad
                    </button>
                </div>

                <div id="security-status" style="padding: 10px; background-color: #d4edda; border-radius: 5px; text-align: center;">
                    <strong>Estado actual:</strong> <span style="color: #27ae60;">Habilitada</span>
                </div>
            </div>

            <div style="border-top: 2px dashed #ccc; padding-top: 20px;">
                <h4 style="margin-bottom: 15px;"> Distancia de Seguridad</h4>
                
                <label style="display: block; margin-bottom: 10px;">
                    <strong>Distancia (metros):</strong>
                    <input 
                        type="number" 
                        id="security-distance-input"
                        value="0.05"
                        min="0"
                        max="1"
                        step="0.01"
                        style="width: 100%; padding: 10px; margin-top: 5px; border-radius: 5px; border: 1px solid #ccc;"
                    >
                    <small style="color: #666;">0 = desactivar, 0.05 = predeterminado, 1 = máximo</small>
                </label>

                <button 
                    class="btn-primary" 
                    onclick="SecurityComponent.setSecurityDistance()"
                    style="width: 100%; padding: 12px;"
                >
                     Establecer Distancia
                </button>
            </div>

            <div style="margin-top: 15px; padding: 10px; background-color: #f8d7da; border-radius: 5px; border-left: 4px solid #dc3545;">
                <p style="font-size: 12px; margin: 0;">
                    <strong> Precaución:</strong> Ajustar la distancia de seguridad a 0 
                    desactiva completamente las protecciones contra colisiones. 
                    Úsalo solo en entornos controlados.
                </p>
            </div>
        `;
    }

    /**
     * Habilita la seguridad del robot
     */
    function enableSecurity() {
        const service = RosManager.createService(
            '/pytoolkit/ALMotion/enable_security_srv',
            'robot_toolkit_msgs/battery_service_srv'
        );

        if (!service) {
            alert('Error: El servicio de seguridad no está disponible.');
            return;
        }

        const request = {}; // Sin argumentos

        RosManager.callService(service, request,
            function(result) {
                console.log('Seguridad habilitada:', result);
                securityEnabled = true;
                updateSecurityStatus(true);
                alert(' Seguridad habilitada correctamente');
            },
            function(error) {
                console.error('Error habilitando seguridad:', error);
                alert(' Error al habilitar la seguridad');
            }
        );
    }

    /**
     * Deshabilita la seguridad del robot (estableciendo distancia a 0)
     */
    function disableSecurity() {
        // eslint-disable-next-line no-restricted-globals
        if (!confirm('¿Estás seguro de que quieres DESHABILITAR la seguridad? Esto puede ser peligroso.')) {
            return;
        }

        const service = RosManager.createService(
            '/pytoolkit/ALMotion/set_security_distance_srv',
            'robot_toolkit_msgs/set_security_distance_srv'
        );

        if (!service) {
            alert('Error: El servicio de distancia de seguridad no está disponible.');
            return;
        }

        const request = { distance: 0.0 };

        RosManager.callService(service, request,
            function(result) {
                console.log('Seguridad deshabilitada (distancia = 0):', result);
                securityEnabled = false;
                securityDistance = 0;
                updateSecurityStatus(false);
                
                // Actualizar input
                const distanceInput = document.getElementById('security-distance-input');
                if (distanceInput) {
                    distanceInput.value = 0;
                }
                
                alert(' Seguridad DESHABILITADA. Ten mucho cuidado.');
            },
            function(error) {
                console.error('Error deshabilitando seguridad:', error);
                alert(' Error al deshabilitar la seguridad');
            }
        );
    }

    /**
     * Establece la distancia de seguridad
     */
    function setSecurityDistance() {
        const distanceInput = document.getElementById('security-distance-input');
        if (!distanceInput) return;

        const distance = parseFloat(distanceInput.value);

        if (isNaN(distance) || distance < 0 || distance > 1) {
            alert('Por favor, ingresa una distancia válida entre 0 y 1 metros.');
            return;
        }

        if (distance === 0 && !confirm('⚠️ Distancia = 0 DESACTIVA la seguridad. ¿Continuar?')) {
            return;
        }

        const service = RosManager.createService(
            '/pytoolkit/ALMotion/set_security_distance_srv',
            'robot_toolkit_msgs/set_security_distance_srv'
        );

        if (!service) {
            alert('Error: El servicio de distancia de seguridad no está disponible.');
            return;
        }

        const request = { distance: distance };

        RosManager.callService(service, request,
            function(result) {
                console.log(`Distancia de seguridad establecida en ${distance}m:`, result);
                securityDistance = distance;
                securityEnabled = distance > 0;
                updateSecurityStatus(securityEnabled);
                alert(`✅ Distancia de seguridad establecida en ${distance} metros`);
            },
            function(error) {
                console.error('Error estableciendo distancia de seguridad:', error);
                alert('❌ Error al establecer la distancia de seguridad');
            }
        );
    }

    /**
     * Actualiza el indicador visual de estado de seguridad
     */
    function updateSecurityStatus(enabled) {
        const statusElement = document.getElementById('security-status');
        if (!statusElement) return;

        if (enabled) {
            statusElement.innerHTML = '<strong>Estado actual:</strong> <span style="color: #27ae60;">Habilitada</span>';
            statusElement.style.backgroundColor = '#d4edda';
        } else {
            statusElement.innerHTML = '<strong>Estado actual:</strong> <span style="color: #e74c3c;">DESHABILITADA ⚠️</span>';
            statusElement.style.backgroundColor = '#f8d7da';
        }
    }

    // API pública
    return {
        init: init,
        enableSecurity: enableSecurity,
        disableSecurity: disableSecurity,
        setSecurityDistance: setSecurityDistance
    };
})();
