# Web Remote Controller - Robot Pepper

Control remoto web para el robot Pepper usando ROS y React.

## Requisitos

- Node.js instalado
- Git Bash en Windows
- Robot Pepper encendido y en la misma red
- Acceso SSH al robot (usuario: nao)

## Configuracion Inicial

Edita el archivo `start.bat` y cambia estos valores con los datos de tu robot:

```batch
set PEPPER_IP=192.168.0.208
set PEPPER_USER=nao
set PEPPER_PASSWORD=
set WORKSPACE_PATH=/gentoo/startprefix
```

## Como Iniciar desde Windows

### Paso 1: Configurar

Abre `start.bat` con un editor de texto y cambia la IP del robot.

### Paso 2: Ejecutar

Haz doble clic en `start.bat`

Se abriran 5 terminales automaticamente:

1. **Terminal 1: py_toolkit** - Toolkit base del robot
2. **Terminal 2: manipulation_utilities** - Control de brazos
3. **Terminal 3: speech_utilities** - Voz y habla
4. **Terminal 4: navigation + perception** - Navegacion y sensores
5. **Terminal 5: Web Server** - Interfaz web (npm start)

### Paso 3: Usar

Espera 20-30 segundos y abre tu navegador en: **http://localhost:3000**

## Que hace cada terminal

El script `start.bat` ejecuta exactamente lo siguiente:

### TERMINAL 1
```bash
ssh nao@192.168.0.208
password: ****
cd /gentoo/startprefix
source devel/setup.bash
roslaunch py_toolkit start_robot_toolkit_wlan.sh
```

### TERMINAL 2
```bash
ssh nao@192.168.0.208
password: ****
cd /gentoo/startprefix
source devel/setup.bash
rosrun manipulation_utilities manipulation_utilities
```

### TERMINAL 3
```bash
ssh nao@192.168.0.208
password: ****
cd /gentoo/startprefix
source devel/setup.bash
rosrun speech_utilities speech_utilities.py
```

### TERMINAL 4
```bash
ssh nao@192.168.0.208
password: ****
cd /gentoo/startprefix
source devel/setup.bash
rosrun navigation_utilities NavigationUtilities.py &
rosrun perception_utilities PerceptionUtilities.py
```

### TERMINAL 5
```bash
cd web-remote-controller/
npm start
```

## Detener los Servicios

Cierra las ventanas de terminal o presiona Ctrl+C en cada una.

## Estructura del Proyecto

```
web-remote-controller/
├── start.bat              # Script de inicio para Windows
├── README.md              # Este archivo
├── package.json           # Dependencias npm
├── public/                # Archivos estaticos
│   └── views/             # Vistas HTML
└── src/
    ├── index.js           # Punto de entrada
    ├── components/        # Componentes del robot
    ├── services/          # Servicios ROS
    ├── views/             # Vistas fuente
    ├── utils/             # Utilidades
    └── styles/            # Estilos CSS
```

## Servicios ROS

- **py_toolkit**: ALMotion, ALTablet, ALLeds, ALAudio, etc.
- **manipulation_utilities**: Control de brazos y manipulacion
- **speech_utilities**: Texto a voz y reconocimiento
- **navigation_utilities**: Navegacion y mapeo SLAM
- **perception_utilities**: Vision por computadora y sensores

## Solucion de Problemas

### No se puede conectar al robot

Verifica:
- Robot encendido
- Misma red WiFi
- IP correcta en start.bat
- Prueba: `ping 192.168.0.208`

### Error de SSH

Si no tienes sshpass o usas Git Bash:
- Conectate manualmente la primera vez
- O configura SSH keys: `ssh-keygen` y `ssh-copy-id nao@192.168.0.208`

### Puerto 3000 ocupado

```cmd
netstat -ano | findstr :3000
taskkill /PID [numero] /F
```

### Git Bash no encontrado

Instala Git Bash desde: https://git-scm.com/downloads

El script busca Git Bash en:
- `C:\Program Files\Git\bin\bash.exe`
- `C:\Program Files (x86)\Git\bin\bash.exe`

## Repositorios Relacionados

- py_toolkit: https://github.com/SinfonIAUniandes/py_toolkit
- robot_toolkit_msgs: https://github.com/SinfonIAUniandes/robot_toolkit_msgs
- manipulation_utilities: https://github.com/SinfonIAUniandes/manipulation_utilities
- speech_utilities: https://github.com/SinfonIAUniandes/speech_utilities
- navigation_utilities: https://github.com/SinfonIAUniandes/navigation_utilities
- perception_utilities: https://github.com/SinfonIAUniandes/perception_utilities

## Equipo

SinfonIA Uniandes - Grupo de investigacion en robotica social
