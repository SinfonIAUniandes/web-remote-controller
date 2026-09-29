import { useState } from 'react';
import { useRos } from '../contexts/RosContext';
import * as ROSLIB from 'roslib';

// Componente para controlar la respiración del robot
const BreathingControl = () => {
    const { ros } = useRos(); // Acceder a la conexión ROS
    const [selectedPart, setSelectedPart] = useState("Body"); //Estado para poner la parte del cuerpo seleccionada como string
     //setSelectedPart: es una función que se usa para cambiar el valor de variable
    //selectedPart: valor actual que quiero recordar
  
    const [breathingState, setBreathingState] = useState("False"); //Estado inicial como string
      //setBreathingState: es una función que se usa para cambiar el valor de variable
    //breathingState: valor actual que quiero recordar

    //Función para cambiar el estado de la respiración en la parte seleccionada
    const toggleBreathing = (enable: boolean) => {
        if (ros) {
            const service = new ROSLIB.Service({
                ros: ros,
                name: '/pytoolkit/ALMotion/toggle_breathing_srv', //Nombre del servicioo
                serviceType: 'robot_toolkit_msgs/set_open_close_hand_srv' //Msg type de mi servicio 
            });

            // Crear una solicitudd
            const request = {
                hand: selectedPart,  // Parte del cuerpo como "Body", "Arms", "LArm", "RArm", "Head"
                state: enable ? "True" : "False", //Paso el booleano a formato string "True" o "False"
            };

            // Llamar al servicio
            service.callService(request, (result) => {
                console.log(`Respiración de ${selectedPart} cambiada a ${enable ? 'True' : 'False'}. Respuesta:`, result);
                setBreathingState(enable ? "True" : "False"); //Actualiza el estado
            });
        }
    };

    return (
        <div>
            <h2>Control de Respiración</h2>

            {/* Para seleccionar parte del cuerpooo */}
            <label>
                Seleccionar parte del cuerpo:
                <select value={selectedPart} onChange={(e) => setSelectedPart(e.target.value)}>
                    <option value="Body">Cuerpo</option>
                    <option value="Arms">Brazos</option>
                    <option value="LArm">Brazo Izquierdo</option>
                    <option value="RArm">Brazo Derecho</option>
                    <option value="Head">Cabeza</option>
                </select>
            </label>

            {/* Mostrar el estado actual */}
            <p>Estado actual de {selectedPart}: {breathingState === "True" ? "Activada" : "Desactivada"}</p>

            {/* Botones para encender o apagar */}
            <button onClick={() => toggleBreathing(true)}>Activar Respiración</button>
            <button onClick={() => toggleBreathing(false)}>Desactivar Respiración</button>
        </div>
    );
};

export default BreathingControl;
