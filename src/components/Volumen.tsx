import React, { useEffect, useState } from 'react';
import { useRos } from '../contexts/RosContext';
import { createService } from '../services/RosManager';

const RobotAudioControl = () => {
    const { ros } = useRos();
    const [volume, setVolume] = useState(50);

    useEffect(() => {
        if (ros) {
            const volumeService = createService(ros, '/pytoolkit/ALAudioDevice/set_output_volume_srv', 'robot_toolkit_msgs/set_output_volume_srv');
            const request = { volume: 50 };
            volumeService.callService(request, (result) => {
                console.log('Volumen inicial establecido en 50:', result);
            }, (error) => {
                console.error('Error al establecer el volumen inicial:', error);
            });
        }
    }, [ros]);

    const handleVolumeChange = (
        event: React.ChangeEvent<HTMLInputElement> | { target: { value: number } }
    ) => {
        const newVolume = parseInt(String(event.target.value), 10);
        setVolume(newVolume);

        if (ros) {
            const volumeService = createService(ros, '/pytoolkit/ALAudioDevice/set_output_volume_srv', 'robot_toolkit_msgs/set_output_volume_srv');
            const request = { volume: newVolume };

            volumeService.callService(request, (result) => {
                console.log('Volumen actualizado:', result);
            }, (error) => {
                console.error('Error al actualizar volumen:', error);
            });
        }
    };

    const increaseVolume = () => {
        if (volume < 100) {
            handleVolumeChange({ target: { value: volume + 10 } });
        }
    };

    const decreaseVolume = () => {
        if (volume > 0) {
            handleVolumeChange({ target: { value: volume - 10 } });
        }
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Control de Audio del Robot</h2>
            <div>
                <label>Volumen: {volume}</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                />
                <button onClick={increaseVolume}>Subir Volumen</button>
                <button onClick={decreaseVolume}>Bajar Volumen</button>
            </div>
        </div>
    );
};

export default RobotAudioControl;