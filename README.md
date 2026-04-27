# SinfonIA Web Remote Controller

Interfaz web para controlar el robot Pepper desde el navegador usando ROSBridge y roslib. La aplicación permite manejar voz, animaciones, cámara, leds, postura, movimiento, servicios de tablet, audio, modo autónomo, tracker, hot words y scripts secuenciales para demostraciones o casos de uso.

## Cómo correrlo con Pepper

1. Prende a Pepper.
2. Presiona el botón rojo que dice SinfonIA en el centro de su pantalla.
3. Luego presiona el botón que tiene el logo de SinfonIA y dice toolkit:launcher . Este paso levanta las terminales necesarias del robot, incluyendo los servicios de ROS/pytoolkit y ROSBridge.
4. Luego abre en el navegador la siguiente url: http://157.253.113.233/apps/robot-page/controlador-robot.html donde la ip del robot cambiara respecto a la red y cual de los dos se este usando.
5. En la pantalla de acceso, ingresa la contraseña autorizada de SinfonIA. La app solo permite entrar desde red local (`localhost`, `127.x.x.x`, `10.x.x.x`, `172.16-31.x.x` o `192.168.x.x`). Si aparece la advertencia de red no permitida, revisa que estés conectado a la misma red local del robot.

## Requisitos

- Node.js y npm.
- Pepper encendido y conectado a la red.
- SinfonIA/pytoolkit corriendo en Pepper o en el entorno que expone los servicios ROS.
- ROSBridge disponible en el puerto `9090`.
- Navegador en la misma red local.

## Conexión con ROS

La conexión central está en `src/contexts/RosContext.js`. Por defecto la app intenta conectarse a:

```text
ws://<hostname-del-navegador>:9090
```

El menú lateral muestra la IP actual. Al hacer clic sobre esa IP se puede escribir otra dirección para reconectar la app a:

```text
ws://<IP_INGRESADA>:9090
```

Los helpers de `src/services/RosManager.js` centralizan creación de tópicos, publicación de mensajes, suscripción a tópicos y llamadas a servicios.

## Estructura general

- `src/App.js`: arma la pantalla de acceso, el layout principal, las pestañas y la sección inferior de controles adicionales.
- `src/contexts/RosContext.js`: mantiene la conexión ROS, la IP objetivo y la velocidad base.
- `src/services/RosManager.js`: funciones reutilizables para tópicos y servicios ROS.
- `src/services/scriptExecutor.js`: motor de ejecución de scripts, pasos, subtítulos, pantalla y parada de voz.
- `src/services/useAnimations.js`: carga la lista de animaciones desde `src/animations/animations.txt`.
- `src/components/`: controles visuales y funcionales de Pepper.
- `src/theme.js`: colores y tipografías del sistema visual.

## Pantalla de acceso

Antes de mostrar los controles, la app valida dos cosas:

- Que el navegador esté en una red local permitida.
- Que la contraseña ingresada coincida con el hash configurado.

Cuando el login es correcto, guarda `auth_token=true` en `localStorage`. Para forzar un nuevo login, borra ese valor desde las herramientas del navegador.

## Menú lateral

El menú lateral permite cambiar entre tres vistas principales:

- `Principal`: controles más usados durante operación en vivo.
- `Servicios`: servicios web, tablet, audio, respiración y movimiento.
- `Scripts`: acciones rápidas, hot words y creador de scripts.

También incluye:

- Indicador de batería.
- Slider de volumen, que llama a `/pytoolkit/ALAudioDevice/set_output_volume_srv`.
- Slider de velocidad de base, que afecta el movimiento publicado en `/cmd_vel`.
- IP editable para reconectar ROSBridge.

## Pestaña Principal

### Control seguridad

Permite habilitar o deshabilitar la seguridad de movimiento de Pepper.

- Habilitar llama a `/pytoolkit/ALMotion/enable_security_srv`.
- Deshabilitar llama a `/pytoolkit/ALMotion/set_security_distance_srv` con `distance: 0.0`.

### Animaciones

Carga `src/animations/animations.txt`, organiza las rutas por categoría/subcategoría/animación y publica la animación seleccionada en:

```text
/animations
```

con tipo:

```text
robot_toolkit_msgs/animation_msg
```

El mensaje usa `family: "animations"` y `animation_name` con la ruta completa.

### Texto

Permite escribir una frase para que Pepper la diga en español o inglés.

- Habilita TTS con `/robot_toolkit/audio_tools_srv`.
- Publica la frase en `/speech`.
- Usa `robot_toolkit_msgs/speech_msg`.
- Envía `animated: true` para permitir habla animada.

### Leds

Controla los leds de ojos/cara, orejas, pecho o todos a la vez.

- Habilita herramientas misc con `/robot_toolkit/misc_tools_srv`.
- Publica colores RGB en `/leds`.
- Usa `robot_toolkit_msgs/leds_parameters_msg`.
- Los modales permiten escoger color y encender/apagar grupos individuales.

### Cámaras

Muestra cámara frontal e inferior de Pepper.

- Suscribe a `/robot_toolkit_node/camera/front/image_raw/compressed`.
- Suscribe a `/robot_toolkit_node/camera/bottom/image_raw/compressed`.
- Habilita visión con `/robot_toolkit/vision_tools_srv`.
- Renderiza imágenes JPEG en base64.
- Incluye vista en pantalla completa para cada cámara.

### Postura de control

Permite enviar a Pepper a dos posturas:

- `AGACHARSE`: llama a `/pytoolkit/ALRobotPosture/go_to_posture_srv` con `posture: "rest"`.
- `PARARSE`: llama al mismo servicio con `posture: "stand"`.

## Pestaña Servicios

### Servicio Web

Envía una URL a la tablet de Pepper para abrirla como web view.

- Servicio: `/pytoolkit/ALTabletService/show_web_view_srv`.
- Tipo: `robot_toolkit_msgs/tablet_service_srv`.
- Request: `{ url }`.

### Imagen

Envía una URL de imagen a la tablet de Pepper.

- Servicio: `/pytoolkit/ALTabletService/show_image_srv`.
- Tipo: `robot_toolkit_msgs/tablet_service_srv`.
- Request: `{ url }`.

### Audio

Reproduce o detiene audio por URL.

- Reproducir: `/pytoolkit/ALAudioPlayer/play_audio_stream_srv`.
- Detener: `/pytoolkit/ALAudioPlayer/stop_audio_stream_srv`.
- El input espera una URL reproducible por el robot.

### Control respiración

Activa o desactiva la respiración corporal por parte del cuerpo.

Partes disponibles:

- `Body`: cuerpo completo.
- `Arms`: brazos.
- `LArm`: brazo izquierdo.
- `RArm`: brazo derecho.
- `Head`: cabeza.

Llama a `/pytoolkit/ALMotion/toggle_breathing_srv` con la parte seleccionada y estado `True` o `False`.

### Mover base

Controla la base de Pepper con teclado o botones en pantalla.

- `W`: avanzar.
- `S`: retroceder.
- `A`: desplazarse lateralmente a la izquierda.
- `D`: desplazarse lateralmente a la derecha.
- `Q`: girar a la izquierda.
- `E`: girar a la derecha.

Publica mensajes `geometry_msgs/Twist` en `/cmd_vel`. Al soltar la tecla o el botón, publica velocidad cero para detener el movimiento.

### Mover cabeza

Controla `HeadPitch` y `HeadYaw` con teclado o botones en pantalla.

- `I`: cabeza arriba.
- `K`: cabeza abajo.
- `J`: cabeza hacia la izquierda.
- `L`: cabeza hacia la derecha.

Publica en `/set_angles` usando `robot_toolkit_msgs/set_angles_msg`.

### Modo autónomo

Activa o desactiva `ALAutonomousLife`.

- Servicio: `/pytoolkit/ALAutonomousLife/set_state_srv`.
- Tipo: `std_srvs/SetBool`.

### Control tracker

Enciende o apaga el tracker de Pepper.

- Encender: `/pytoolkit/ALTracker/start_tracker_srv`.
- Apagar: `/pytoolkit/ALTracker/stop_tracker_srv`.

### Visibilidad tablet

Oculta la pantalla de la tablet con `/pytoolkit/ALTabletService/hide_srv`.

Actualmente el botón de “encender visibilidad” solo actualiza el estado visual de la interfaz; en el código hay un `TODO` para reemplazarlo por el servicio ROS que muestre contenido nuevamente.

## Pestaña Scripts

### Acciones rápidas

Incluye scripts predefinidos para operación inmediata:

- Saludo.
- Presentación.
- Despedida.
- Celebración.
- Baile.

Cada acción ejecuta una secuencia de pasos con voz, animaciones y pausa corta. Se puede detener la ejecución en curso.

### Hot Words

Configura palabras clave para reconocimiento de voz y respuestas automáticas.

Funcionalidades:

- Cambiar idioma entre `ES` y `EN`.
- Activar/desactivar reconocimiento.
- Configurar `Noise` y `Eyes`.
- Crear, editar o eliminar palabras clave.
- Ajustar threshold por palabra.
- Enviar vocabulario al robot.
- Escuchar el tópico de estado y responder por `/speech` cuando se detecta una palabra configurada.

Servicios/tópicos usados:

- `/pytoolkit/ALSpeechRecognition/set_speechrecognition_srv`.
- `/pytoolkit/ALSpeechRecognition/set_hot_word_language_srv`.
- `/pytoolkit/ALSpeechRecognition/set_words_srv`.
- Suscripción a `/pytoolkit/ALSpeechRecognition/status`.
- Publicación de respuesta en `/speech`.

### Creador de Scripts

Permite crear scripts personalizados de interacción.

Cada script tiene:

- Nombre.
- Idioma (`Spanish` o `English`).
- Delay entre pasos.
- Lista ordenable de pasos.

Cada paso puede incluir:

- Voz de Pepper.
- Animación.
- Acción de pantalla: ninguna, subtítulo, imagen por URL o página web por URL.

Funciones disponibles:

- Crear script nuevo.
- Cargar script `.json`.
- Importar `.txt` legado.
- Guardar script como `.json`.
- Agregar, editar, eliminar y reordenar pasos.
- Ejecutar un paso individual.
- Ejecutar todo el script.
- Detener un paso o detener todo.

El motor está en `src/services/scriptExecutor.js`. El orden de ejecución de un paso es:

1. Animación.
2. Acción de pantalla si no es subtítulo.
3. Voz.
4. Subtítulo en tablet, si aplica.
5. Espera estimada según longitud de texto o tipo de acción.

## Formato de scripts

### JSON

```json
{
  "config": {
    "name": "mi_script",
    "language": "Spanish",
    "stepDelay": 3000
  },
  "steps": [
    {
      "speech": "Hola, soy Pepper.",
      "animation": "Gestures/Hey_1",
      "screen": null
    },
    {
      "speech": "Mira esta imagen.",
      "animation": "",
      "screen": {
        "type": "image",
        "content": "https://example.com/imagen.png"
      }
    }
  ]
}
```

### TXT legado

El parser acepta un archivo `.txt` con bloque opcional de configuración:

```text
<config>
name=demo
language=Spanish
</config>
1,Gestures/Hey_1,"Hola, soy Pepper"
2,Gestures/Explain_1,"Bienvenidos a SinfonIA"
```

Cada línea de paso usa:

```text
id,animacion,texto
```

## Sección inferior

Debajo del tablero principal hay una sección adicional con controles más antiguos o versiones alternativas de componentes:

- `Leds`
- `Navegador`
- `Imagen`
- `Base`
- `EnableRobotSecurity`
- `DisableRobotSecurity`
- `Battery`
- `Volumen`
- `BreathingControl`
- `AutonomousLifeControl`
- `TrackerControl`
- `ShowWordsTablet`
- `Audio`
- `Cabeza`
- `HideTabletScreen`
- `ScriptPanel`
- `ScriptsCreator`
- `QuickAction`

Esta sección es útil para pruebas, depuración o compatibilidad con controles previos, aunque la operación principal está concentrada en las tres pestañas superiores.

## Casos de uso que ya cubre la app

### Demo guiada de Pepper

1. Entrar a la pestaña `Scripts`.
2. Ejecutar `Presentación` en acciones rápidas.
3. Usar `Creador de Scripts` para encadenar frases, animaciones y contenido en la tablet.
4. Detener la ejecución si se necesita interrumpir la demo.

### Operación remota básica

1. Ajustar volumen y velocidad desde el menú lateral.
2. Ir a `Servicios`.
3. Mover base con `W/A/S/D/Q/E`.
4. Mover cabeza con `I/J/K/L`.
5. Ver cámaras desde la pestaña `Principal`.

### Contenido en tablet

1. Usar `Servicio Web` para abrir una página.
2. Usar `Imagen` para mostrar una imagen por URL.
3. Usar pasos de script con subtítulos, imágenes o web para sincronizar tablet con voz.

### Interacción por voz

1. Ir a `Scripts`.
2. Configurar Hot Words.
3. Activar reconocimiento.
4. Pepper responde automáticamente por voz cuando escucha una palabra configurada.

### Estado físico y seguridad

1. Revisar batería desde el menú lateral.
2. Usar `Control seguridad` antes de pruebas de movimiento.
3. Activar/desactivar respiración, modo autónomo y tracker según el tipo de actividad.

## Scripts de npm

```bash
npm start
```

Levanta el servidor de desarrollo en `http://localhost:3000`.

```bash
npm test
```

Ejecuta las pruebas de React en modo watch.

```bash
npm run build
```

Genera una versión de producción en la carpeta `build`.

## Solución de problemas

### La app muestra “No estás en la red local del robot”

Verifica que estés abriendo la interfaz desde `localhost` o desde una IP privada local. La validación está en `isLocalNetwork()` dentro de `src/App.js`.

### No se conecta con ROS

Revisa:

- Que SinfonIA/ROSBridge esté corriendo.
- Que el puerto `9090` esté disponible.
- Que la IP mostrada en el menú lateral sea la correcta.
- Que el navegador pueda alcanzar `ws://<IP>:9090`.

### Las cámaras no muestran imagen

Revisa:

- Que los tópicos de cámara comprimida estén publicados.
- Que `/robot_toolkit/vision_tools_srv` responda.
- Que Pepper tenga permisos/servicios de visión activos.

### El robot no se mueve

Revisa:

- Que la seguridad y navegación estén configuradas correctamente.
- Que `/cmd_vel` esté habilitado.
- Que el slider de velocidad no esté en `0%`.
- Que el foco del teclado no esté dentro de un input, porque la app ignora movimiento mientras se escribe.

### La tablet no muestra contenido

Revisa:

- Que la URL sea accesible desde Pepper.
- Que la URL use un formato que la tablet pueda abrir.
- Que los servicios `ALTabletService` estén disponibles.

## Pendientes recomendados

- Confirmar y documentar las credenciales exactas que deben usarse en la pantalla de acceso.
- Completar el servicio real para “encender visibilidad” en `TabletVisibility.jsx`.
- Revisar los tipos ROS de algunos servicios de audio/legacy, porque hay nombres que parecen reutilizados o provisionales.
- Separar o retirar la sección inferior si ya no se usa en operación diaria.
