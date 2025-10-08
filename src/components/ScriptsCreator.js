import { useEffect, useState } from 'react';
import animationsTxt from "../animations/animations.txt";


const ScriptsCreator = () => {
    const [animations, setAnimations] = useState({});
    const [script, setScript] = useState({
        subtitulos: false,
        img: false,
        speech: [],
        animation: [],
        pantalla: []

    });
    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' });
        element.href = URL.createObjectURL(file);
        element.download = "script.json";
        document.body.appendChild(element);
        element.click();
    };

    useEffect(() => {
        fetch(animationsTxt)
            .then(response => response.text())
            .then(text => {
                const parsedAnimations = {};

                text.split("\n").forEach(animation => {
                    const parts = animation.trim().split("/");

                    if (parts.length === 3) {  // Caso con 3 niveles: Categoría/Subcategoría/Animación
                        const [category, subcategory, anim] = parts;
                        if (!parsedAnimations[category]) parsedAnimations[category] = {};
                        if (!parsedAnimations[category][subcategory]) parsedAnimations[category][subcategory] = [];
                        parsedAnimations[category][subcategory].push(anim);
                    } else if (parts.length === 2) {  // Caso con 2 niveles: Categoría/Animación
                        const [category, anim] = parts;
                        if (!parsedAnimations[category]) parsedAnimations[category] = {};
                        if (!parsedAnimations[category]["_no_subcategory"]) parsedAnimations[category]["_no_subcategory"] = [];
                        parsedAnimations[category]["_no_subcategory"].push(anim);
                    }
                });

                setAnimations(parsedAnimations);
                console.log("Animaciones procesadas correctamente:", parsedAnimations);
            })
            .catch(error => console.error("Error al cargar las animaciones:", error));
    }, []);

    return (
        <div>
            <div>
                <input disabled={script.img} id='subtitulos' type="checkbox" checked={script.subtitulos} onChange={() => setScript({ ...script, subtitulos: !script.subtitulos })} />
                <label htmlFor='subtitulos' >Subtítulos</label>
            </div>
            <div>
                <input disabled={script.subtitulos} id='img' type="checkbox" checked={script.img} onChange={() => setScript({ ...script, img: !script.img })} />
                <label htmlFor='img' >Imagen</label>
            </div>
            <div className='secctionCont'>
                <div>

                    {script.speech.map((item, index) => (
                        <div key={index}>
                            <select value={item.tipo} onChange={(e) => {
                                const newSpeech = [...script.speech];
                                newSpeech[index].tipo = e.target.value;
                                setScript({ ...script, speech: newSpeech });
                            }}>
                                <option value="text">Texto</option>
                                <option value="delay">Delay</option>
                            </select>
                            {
                                item.tipo === "text" ? (
                                    <input type="text" value={item.info} onChange={(e) => {
                                        const newSpeech = [...script.speech];
                                        newSpeech[index].info = e.target.value;
                                        setScript({ ...script, speech: newSpeech });
                                    }} />
                                ) : (
                                    <input type="number" min="0" value={item.info} onChange={(e) => {
                                        const newSpeech = [...script.speech];
                                        newSpeech[index].info = e.target.value;
                                        setScript({ ...script, speech: newSpeech });
                                    }} />
                                )
                            }
                            <button onClick={() => {
                                const newSpeech = script.speech.filter((item, i) => i !== index);
                                setScript({ ...script, speech: newSpeech });
                            }}>Eliminar</button>
                        </div>
                    ))}
                    <button onClick={() => setScript({
                        ...script, speech: [...script.speech, {
                            tipo: "text",
                            info: "Hola, soy Pepper",
                        }]
                    })}>Añadir Speech</button>
                </div>
                <div>

                    {script.animation.map((item, index) => (
                        <div key={index}>
                            <select value={item.tipo} onChange={(e) => {
                                const newAnimation = [...script.animation];
                                newAnimation[index].tipo = e.target.value;
                                setScript({ ...script, animation: newAnimation });
                            }}>
                                <option value="movimiento">Animación</option>
                                <option value="delay">Delay</option>
                            </select>

                            {item.tipo === "movimiento" ? (
                                <input type="text" value={item.info} onChange={(e) => {
                                    const newAnimation = [...script.animation];
                                    newAnimation[index].info = e.target.value;
                                    setScript({ ...script, animation: newAnimation });
                                }} />
                            ) : (
                                <input type="number" min="0" value={item.info} onChange={(e) => {
                                    const newAnimation = [...script.animation];
                                    newAnimation[index].info = e.target.value;
                                    setScript({ ...script, animation: newAnimation });
                                }} />
                            )
                            }
                            <button onClick={() => {
                                const newAnimation = script.animation.filter((item, i) => i !== index);
                                setScript({ ...script, animation: newAnimation });
                            }}>Eliminar</button>
                        </div>
                    ))}
                    <button onClick={() => setScript({
                        ...script, animation: [...script.animation, {
                            tipo: "movimiento",
                            info: "Emotions/Positive/Excited_1",
                        }]
                    })}>Añadir Animación</button>
                </div>

                {(!script.subtitulos && script.img) && <div>

                    {script.pantalla.map((item, index) => (
                        <div key={index}>
                            <select value={item.tipo} onChange={(e) => {
                                const newPantalla = [...script.pantalla];
                                newPantalla[index].tipo = e.target.value;
                                setScript({ ...script, pantalla: newPantalla });
                            }}>
                                <option value="video">Video</option>
                                <option value="delay">Delay</option>
                            </select>
                            {item.tipo === "video" ?
                                (
                                    <input type="text" value={item.info} onChange={(e) => {
                                        const newPantalla = [...script.pantalla];
                                        newPantalla[index].info = e.target.value;
                                        setScript({ ...script, pantalla: newPantalla });
                                    }} />
                                ) :
                                (
                                    <input type="number" min="0" value={item.info} onChange={(e) => {
                                        const newPantalla = [...script.pantalla];
                                        newPantalla[index].info = e.target.value;
                                        setScript({ ...script, pantalla: newPantalla });
                                    }} />
                                )
                            }
                            <button onClick={() => {
                                const newPantalla = script.pantalla.filter((item, i) => i !== index);
                                setScript({ ...script, pantalla: newPantalla });
                            }}>Eliminar</button>
                        </div>
                    ))}
                    <button onClick={() => setScript({
                        ...script, pantalla: [...script.pantalla, {
                            tipo: "video",
                            info: "https://www.example.com/video.mp4",
                        }]
                    })}>Añadir Animación Pantalla</button>

                </div>}
            </div>
            <button onClick={handleDownload}>Download</button>
        </div>
    );
};



export default ScriptsCreator;