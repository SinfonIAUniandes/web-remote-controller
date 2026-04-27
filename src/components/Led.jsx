import React, { useEffect, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createTopic, createService } from '../services/RosManager';
import { COLORS, TYPOGRAPHY } from '../theme';
import * as ROSLIB from 'roslib';
import iconoOjos from '../assets/Ojos.svg';
import iconoOrejas from '../assets/Orejas.svg';
import iconoPecho from '../assets/Pecho.svg';
import iconoTodo from '../assets/Cara.svg';
import { hexToRgb } from './InteractiveColorWheel';

import FaceModal from './FaceModal';
import ChestModal from './ChestModal';
import EarModal from './EarModal'; // <-- IMPORTAMOS EARMODAL
import AllModal from './AllModal';

const Led = () => {
    const { ros } = useRos();

    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
    const [isEarModalOpen, setIsEarModalOpen] = useState(false);
    const [isChestModalOpen, setIsChestModalOpen] = useState(false);
    const [isAllModalOpen, setIsAllModalOpen] = useState(false);

    // Estados para recordar la configuración al cerrar los modales
    const [faceState, setFaceState] = useState({ left: '#FFFFFF', right: '#FFFFFF', isLeftOn: true, isRightOn: true });
    const [chestState, setChestState] = useState({ color: '#FFFFFF', isOn: true });
    // Nuevo estado para las orejas
    const [earState, setEarState] = useState({ color: '#0000FF', isLeftOn: true, isRightOn: true });
    // Estado para recordar la configuración general
    const [allState, setAllState] = useState({ color: '#00FFC8', isOn: true });

    const ledsTopic = createTopic(ros, '/leds', 'robot_toolkit_msgs/leds_parameters_msg');

    useEffect(() => {
        if (ros) {
            const enableMiscService = createService(ros, '/robot_toolkit/misc_tools_srv', 'robot_toolkit_msgs/misc_tools_srv');
            enableMiscService.callService({ data: { command: "enable_all" } }, (result) => console.log('Misc config:', result));
        }
    }, [ros]);

    const publishLedColor = (name, colorHex) => {
        const { red, green, blue } = hexToRgb(colorHex);
        const message = new ROSLIB.Message({ name, red, green, blue, time: 0 });
        if (ledsTopic) ledsTopic.publish(message);
    };

    const handleFaceSave = (newState) => {
        setFaceState(newState);
        publishLedColor('LeftFaceLeds', newState.isLeftOn ? newState.left : '#000000');
        publishLedColor('RightFaceLeds', newState.isRightOn ? newState.right : '#000000');
        setIsFaceModalOpen(false);
    };

    const handleChestSave = (newState) => {
        setChestState(newState);
        publishLedColor('ChestLeds', newState.isOn ? newState.color : '#000000');
        setIsChestModalOpen(false);
    };

    // NUEVO: Manejador para guardar OREJAS
    const handleEarSave = (newState) => {
        setEarState(newState);
        publishLedColor('LeftEarLeds', newState.isLeftOn ? newState.color : '#000000');
        publishLedColor('RightEarLeds', newState.isRightOn ? newState.color : '#000000');
        setIsEarModalOpen(false);
    };

    // Manejador para guardar TODO
    const handleAllSave = (newState) => {
        setAllState(newState);
        const finalColor = newState.isOn ? newState.color : '#000000';
        
        // Publicamos a TODOS los tópicos
        publishLedColor('LeftFaceLeds', finalColor);
        publishLedColor('RightFaceLeds', finalColor);
        publishLedColor('ChestLeds', finalColor);
        publishLedColor('LeftEarLeds', finalColor); 
        publishLedColor('RightEarLeds', finalColor); 

        // Sincronizamos las memorias de los otros modales
        setFaceState({ left: newState.color, right: newState.color, isLeftOn: newState.isOn, isRightOn: newState.isOn });
        setChestState({ color: newState.color, isOn: newState.isOn });
        // También sincronizamos la memoria del modal de orejas
        setEarState({ color: newState.color, isLeftOn: newState.isOn, isRightOn: newState.isOn });

        setIsAllModalOpen(false);
    };

    const LedIcon = ({ onClick, src, alt }) => (
        <div onClick={onClick} style={{
            width: '46px', height: '46px', 
            backgroundColor: COLORS.CELESTE_PRINCIPAL, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'background-color 0.2s',
            color: COLORS.AZUL_PRINCIPAL
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.AZUL_SECUNDARIO}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.CELESTE_PRINCIPAL}
        >
            {src ? <img src={src} alt={alt} style={{ width: '26px', height: '26px' }} /> : <span>{alt}</span>}
        </div>
    );

    return (
        <div style={{
            width: '400px', height: '140px', backgroundColor: COLORS.AZUL_PRINCIPAL, borderRadius: '25px',
            position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
            <div style={{ width: '180px', height: '30px', position: 'absolute', top: '20px', left: 0, backgroundColor: COLORS.CELESTE_PRINCIPAL, padding: '4px 30px', borderTopRightRadius: '20px', borderBottomRightRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: COLORS.AZUL_PRINCIPAL, fontSize: '16px', fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD }}>Leds</span>
            </div>

            <div style={{ width: '350px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', marginTop: '40px', marginLeft: '25px', marginRight: '25px'}}>
                <LedIcon onClick={() => setIsFaceModalOpen(true)} src={iconoOjos} alt="Ojos" />
                <LedIcon onClick={() => setIsEarModalOpen(true)} src={iconoOrejas} alt="Orejas" />
                <LedIcon onClick={() => setIsChestModalOpen(true)} src={iconoPecho} alt="Pecho" />
                <LedIcon onClick={() => setIsAllModalOpen(true)} src={iconoTodo} alt="Todo" />
            </div>

            <FaceModal isOpen={isFaceModalOpen} onClose={() => setIsFaceModalOpen(false)} onSave={handleFaceSave} initialState={faceState} />
            <ChestModal isOpen={isChestModalOpen} onClose={() => setIsChestModalOpen(false)} onSave={handleChestSave} initialState={chestState} />
            <EarModal isOpen={isEarModalOpen} onClose={() => setIsEarModalOpen(false)} onSave={handleEarSave} initialState={earState} /> {/* <-- AÑADIDO AQUÍ */}
            <AllModal isOpen={isAllModalOpen} onClose={() => setIsAllModalOpen(false)} onSave={handleAllSave} initialState={allState} />
        </div>
    );
};

export default Led;