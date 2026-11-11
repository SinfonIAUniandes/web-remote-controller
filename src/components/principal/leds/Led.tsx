import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { useRos } from '../../../contexts/RosContext';
import { createTopic, createService } from '../../../services/RosManager';
import { COLORS, TYPOGRAPHY } from '../../../theme';
import IconoOjos from '../../../assets/Ojos.svg?react';
import IconoOrejas from '../../../assets/Orejas.svg?react';
import IconoPecho from '../../../assets/Pecho.svg?react';
import IconoTodo from '../../../assets/Cara.svg?react';
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

    const ledsTopic = ros
        ? createTopic(ros, '/leds', 'robot_toolkit_msgs/leds_parameters_msg')
        : null;

    useEffect(() => {
        if (ros) {
            const enableMiscService = createService(ros, '/robot_toolkit/misc_tools_srv', 'robot_toolkit_msgs/misc_tools_srv');
            enableMiscService.callService({ data: { command: "enable_all" } }, (result) => console.log('Misc config:', result));
        }
    }, [ros]);

    const publishLedColor = (name: string, colorHex: string) => {
        const { red, green, blue } = hexToRgb(colorHex);
        const message = { name, red, green, blue, time: 0 };
        if (ledsTopic) ledsTopic.publish(message);
    };

    const handleFaceSave = (newState: { left: string; right: string; isLeftOn: boolean; isRightOn: boolean }) => {
        setFaceState(newState);
        publishLedColor('LeftFaceLeds', newState.isLeftOn ? newState.left : '#000000');
        publishLedColor('RightFaceLeds', newState.isRightOn ? newState.right : '#000000');
        setIsFaceModalOpen(false);
    };

    const handleChestSave = (newState: { color: string; isOn: boolean }) => {
        setChestState(newState);
        publishLedColor('ChestLeds', newState.isOn ? newState.color : '#000000');
        setIsChestModalOpen(false);
    };

    // NUEVO: Manejador para guardar OREJAS
    const handleEarSave = (newState: { color: string; isLeftOn: boolean; isRightOn: boolean }) => {
        setEarState(newState);
        publishLedColor('LeftEarLeds', newState.isLeftOn ? newState.color : '#000000');
        publishLedColor('RightEarLeds', newState.isRightOn ? newState.color : '#000000');
        setIsEarModalOpen(false);
    };

    // Manejador para guardar TODO
    const handleAllSave = (newState: { color: string; isOn: boolean }) => {
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

    // Los iconos son SVG en línea con `currentColor`: toman el color de texto del contenedor, así siguen el tema
    const LedIcon = ({ onClick, icon: Icon, alt }: { onClick: () => void; icon: ComponentType<SVGProps<SVGSVGElement>>; alt: string }) => (
        <div
            onClick={onClick}
            className="flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-full text-center transition-colors duration-200"
            style={{ backgroundColor: COLORS.CELESTE_PRINCIPAL, color: COLORS.AZUL_PRINCIPAL }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.AZUL_SECUNDARIO}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.CELESTE_PRINCIPAL}
        >
            <Icon role="img" aria-label={alt} className="h-[26px] w-[26px]" />
        </div>
    );

    return (
        <div
            // className="relative flex h-[140px] w-full max-w-[400px] flex-col justify-center rounded-[25px]"
            className="relative flex h-[140px] w-full flex-col justify-center rounded-[25px]"
            style={{ backgroundColor: COLORS.AZUL_PRINCIPAL }}
        >
            <div
                className="absolute left-0 top-5 flex h-[30px] w-[180px] items-center justify-center rounded-r-[20px] px-[30px] py-1"
                style={{ backgroundColor: COLORS.CELESTE_PRINCIPAL }}
            >
                <span
                    className="text-base"
                    style={{ color: COLORS.AZUL_PRINCIPAL, fontFamily: TYPOGRAPHY.FONT_FAMILY_PRINCIPAL, fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD }}
                >
                    Leds
                </span>
            </div>

            <div className="mt-10 flex w-[calc(100%_-_50px)] items-center justify-around mx-[25px]">
                <LedIcon onClick={() => setIsFaceModalOpen(true)} icon={IconoOjos} alt="Ojos" />
                <LedIcon onClick={() => setIsEarModalOpen(true)} icon={IconoOrejas} alt="Orejas" />
                <LedIcon onClick={() => setIsChestModalOpen(true)} icon={IconoPecho} alt="Pecho" />
                <LedIcon onClick={() => setIsAllModalOpen(true)} icon={IconoTodo} alt="Todo" />
            </div>

            <FaceModal isOpen={isFaceModalOpen} onClose={() => setIsFaceModalOpen(false)} onSave={handleFaceSave} initialState={faceState} />
            <ChestModal isOpen={isChestModalOpen} onClose={() => setIsChestModalOpen(false)} onSave={handleChestSave} initialState={chestState} />
            <EarModal isOpen={isEarModalOpen} onClose={() => setIsEarModalOpen(false)} onSave={handleEarSave} initialState={earState} /> {/* <-- AÑADIDO AQUÍ */}
            <AllModal isOpen={isAllModalOpen} onClose={() => setIsAllModalOpen(false)} onSave={handleAllSave} initialState={allState} />
        </div>
    );
};

export default Led;