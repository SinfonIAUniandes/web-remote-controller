import { useEffect, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';

//Componente que permite elegir los colores de los LEDS del robot
const LEDController = () => {

    const { ros } = useRos(); //Acceder a la conexión ROS

    //Nombre del led (o grupo de leds)
    const [ledName, setLedName] = useState('FaceLeds');
    //setVariable: es una función que se usa para cambiar el valor de variable
    //ledName: valor actual que quiero recordar
    //useState(valorInicial): dar un valor inicial a la variable de estado ledName

    //Color en formato hexadecimal, color: variable de estado
    const [color, setColor] = useState('#ffffff');  //Por defecto, blanco

    //Segundos de duracion del color, time: variable de estado
    const [time, setTime] = useState(0); //0 para cambiar inmediatamente (se hace de una)

    //Creamr el tópico?? para publicar los colores de los LEDs
    const ledsTopic = ros
        ? createTopic(ros, '/leds', 'robot_toolkit_msgs/leds_parameters_msg')
        : null;

    useEffect(() => {
        if (ros) {

            const enableMiscService = createService(ros, '/robot_toolkit/misc_tools_srv', 'robot_toolkit_msgs/misc_tools_srv');

            // Request for misc services
            const miscRequest = {
                data:{
                    command: "enable_all"
                } 
            };
            //Llamar al servicio
            enableMiscService.callService(miscRequest, (result) => {
                console.log('Misc functionalities service called:', result);
            });
        }
    }, [ros]);

    //Función para enviar el mensaje de LEDs a ROS
    const setLEDColor = () => {
        if (!ledsTopic) return;

        const { red, green, blue } = hexToRgb(color); //Usar función hexToRgb para convertir el color hexadecimal a RGB

        //Crear el mensaje de ROS en el formato que dan de leds_parameters_msg
        const message = {
            name: ledName,  //Nombre del LED o grupo de LEDs
            red: red,       //Valor RGB de color rojo
            green: green,   //Valor RGB de color verde
            blue: blue,     //Valor RGB de color azul
            time: time      //Duración en segundos del led
        };

        // Publicar el mensaje en el tópico /leds
        ledsTopic.publish(message);
        console.log('Mensaje enviado: Nombre del led/leds - ${ledName}, Rojo - ${red}, Verde - ${green}, Azul - ${blue}, Tiempo - ${time}');
    };

    //Función para convertir color hexadecimal a RGB
    const hexToRgb = (hex: string) => {
        //Convertir un valor en un número decimal
        //parseInt(string, base actual)
        const red = parseInt(hex.substring(1, 3), 16);
        const green = parseInt(hex.substring(3, 5), 16);
        const blue = parseInt(hex.substring(5, 7), 16);
        //Objeto con los valores de los colores en RBG
        return { red, green, blue };
    };

    return (
        <div>
            <h2>Control de LEDs</h2>

            {/*Input para el nombre del led*/}
            <div>
                <label>Nombre del LED: </label>
                <input
                    type="text"
                    value={ledName}
                    onChange={(e) => setLedName(e.target.value)}
                />
            </div>

            {/*Input para el color del led*/}
            <div>
                <label>Color del LED: </label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />
            </div>

            {/*Input para el tiempo de duración del LED */}
            <div>
                <label>Tiempo (en segundos): </label>
                <input
                    type="number"
                    value={time}
                    onChange={(e) => setTime(parseInt(e.target.value) || 0)}
                />
            </div>

            {/*Boton para actualizar el color de los LEDs */}
            <button onClick={setLEDColor}>Actualizar LEDs</button>
        </div>
    );
};

export default LEDController;