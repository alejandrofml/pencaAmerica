let partidos = [];
let partidoActual = 0;
let jugadasTemporales = [];
let usuarioActual = {
    id: null,
    usuario: '',
    contrasena: '',
    jugadas: []
};


const esPartidoPasado = (fecha, hora) => {
    const [dia, mes, anio] = fecha.split('/');
    const [horas, minutos] = hora.split(':');
    const fechaPartido = new Date(anio, mes - 1, dia, horas, minutos);
    const fechaActual = new Date();
    return fechaActual > fechaPartido;
    

};

const mostrarLoader = () => {
    document.getElementById('loader').style.display = 'block';
};

const ocultarLoader = () => {
    document.getElementById('loader').style.display = 'none';
};

const ordenarPartidosPorFecha = (partidos) => {
    return partidos.sort((a, b) => {
        const [diaA, mesA, anioA] = a.fecha.split('/');
        const [horasA, minutosA] = a.hora.split(':');
        const fechaA = new Date(anioA, mesA - 1, diaA, horasA, minutosA);

        const [diaB, mesB, anioB] = b.fecha.split('/');
        const [horasB, minutosB] = b.hora.split(':');
        const fechaB = new Date(anioB, mesB - 1, diaB, horasB, minutosB);

        return fechaA - fechaB;
    });
};


const API_URL = "https://api.jsonbin.io/v3/b/66721024acd3cb34a8597582";
const API_KEY = "$2a$10$y7zs4M9/QpacoFMTCNwtjeRxmFar26.OFN6n8QBTEVa9kcY2bNAU6";

const cargarPartidos = async () => {
    try {
        const response = await fetch(`${API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            partidos = data.record.partidos || [];
            partidos = ordenarPartidosPorFecha(partidos); // Ordenar partidos por fecha
            generarCartasPartidos(); // Inicializar la primera carta después de cargar los partidos
        }
    } catch (error) {
        console.error('Error al cargar los partidos:', error);
    }
};


const registrarUsuario = async (usuario, contrasena) => {
    try {
        const response = await fetch(`${API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            const usuarios = data.record.usuarios || [];
            const usuarioExistente = usuarios.find(u => u.usuario === usuario);
            if (usuarioExistente) {
                mostrarAlerta('El usuario ya existe. Por favor, elige otro nombre de usuario.', 'danger');
                return;
            }
            usuarios.push({ id: usuarios.length + 1, usuario, contrasena });
            const updatedData = {
                ...data.record,
                usuarios
            };
            const saveResponse = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(updatedData)
            });
            if (saveResponse.ok) {
                mostrarAlerta('Usuario registrado correctamente', 'success');// Iniciar sesión automáticamente
                limpiarSecciones();
            } else {
                mostrarAlerta('Error al registrar el usuario', 'danger');
            }
        }
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
    }
};


const iniciarSesion = async (usuario, contrasena) => {
    try {
        const response = await fetch(`${API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            const usuarios = data.record.usuarios || [];
            const jugadas = data.record.jugadas || [];

            const usuarioExistente = usuarios.find(u => u.usuario.toLowerCase() === usuario.toLowerCase() && u.contrasena === contrasena);
            if (usuarioExistente) {
                usuarioActual = {
                    ...usuarioExistente,
                    jugadas: jugadas.filter(j => j.usuario.toLowerCase() === usuario.toLowerCase())
                };
                document.getElementById('form-login').style.display = 'none';
                document.getElementById('form-jugar').style.display = 'block';
                generarCartasPartidos(); // Inicializar las cartas de los partidos

                // Mover a la primera carta del próximo partido no jugado
                const proximoPartidoNoJugado = partidos.findIndex(partido => !esPartidoPasado(partido.fecha, partido.hora));
                if (proximoPartidoNoJugado >= 0) {
                    const carousel = new bootstrap.Carousel(document.querySelector('#partidos-container'));
                    for (let i = 0; i < proximoPartidoNoJugado; i++) {
                        carousel.next();
                    }
                }
            } else {
                mostrarAlerta('Usuario o contraseña incorrectos', 'danger');
            }
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
    }
};

const mostrarPopupPuntos = (puntosGanados, puntosTotales) => {
    const popup = document.createElement('div');
    popup.className = 'popup-puntos';
    popup.innerHTML = `
        <div class="popup-content">
            <h2>¡Felicidades!</h2>
            <p>Has ganado ${puntosGanados} puntos.</p>
            <p>Tus puntos totales son ${puntosTotales}.</p>
            <button class="btn btn-primary" onclick="cerrarPopup()">Cerrar</button>
        </div>
    `;
    document.body.appendChild(popup);
};

const cerrarPopup = () => {
    const popup = document.querySelector('.popup-puntos');
    if (popup) {
        document.body.removeChild(popup);
    }
};





const encontrarProximoPartidoNoJugado = () => {
    return partidos.findIndex(partido => !esPartidoPasado(partido.fecha, partido.hora));
};

const generarCartasPartidos = () => {
    const contenedorPartidos = document.getElementById("partidos");
    contenedorPartidos.innerHTML = '';

    partidos.forEach((partido, index) => {
        const jugadaGuardada = usuarioActual.jugadas.find(jugada => jugada.partido.toLowerCase() === `${partido.equipo1.toLowerCase()} vs ${partido.equipo2.toLowerCase()}`);
        const partidoPasado = esPartidoPasado(partido.fecha, partido.hora);

        const resultado1 = jugadaGuardada && jugadaGuardada.resultado !== 'null-null' ? jugadaGuardada.resultado.split('-')[0] : '';
        const resultado2 = jugadaGuardada && jugadaGuardada.resultado !== 'null-null' ? jugadaGuardada.resultado.split('-')[1] : '';

        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = `
            <div class="card mx-auto" style="max-width: 18rem; position: relative;">
                <div class="card-header">${partido.equipo1} vs ${partido.equipo2}</div>
                <div class="card-body">
                    <p>${partido.fecha} ${partido.hora}</p>
                    <p>${partido.estadio}</p>
                    <div class="form-floating mb-2">
                        <input type="number" class="form-control" id="resultado-${partido.id}-${partido.equipo1}" name="resultado-${partido.id}-${partido.equipo1}" min="0" value="${resultado1}" ${partidoPasado ? 'disabled' : ''}>
                        <label for="resultado-${partido.id}-${partido.equipo1}">${partido.equipo1}:</label>
                    </div>
                    <div class="form-floating mb-3">
                        <input type="number" class="form-control" id="resultado-${partido.id}-${partido.equipo2}" name="resultado-${partido.id}-${partido.equipo2}" min="0" value="${resultado2}" ${partidoPasado ? 'disabled' : ''}>
                        <label for="resultado-${partido.id}-${partido.equipo2}">${partido.equipo2}:</label>
                    </div>
                    ${partidoPasado ? '<div class="badge bg-danger" style="position: absolute; font-size: 12px; top: 80px; right: 90px; padding: 20px 15px; transform: rotate(-35deg);">Partido jugado</div>' : ''}
                </div>
            </div>
        `;
        contenedorPartidos.appendChild(slide);
    });

    actualizarBotonGuardar();

    // Encontrar el próximo partido no jugado
    const proximoPartidoNoJugado = encontrarProximoPartidoNoJugado();

    // Inicializar Swiper
    new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 10,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        keyboard: {
            enabled: true,
        },
        grabCursor: true,
        centeredSlides: true,
        loop: true,
        initialSlide: proximoPartidoNoJugado >= 0 ? proximoPartidoNoJugado : 0,
    });
};




const mostrarPartidoSiguiente = () => {
    const resultado1 = document.getElementById(`resultado-${partidos[partidoActual].id}-${partidos[partidoActual].equipo1}`).value;
    const resultado2 = document.getElementById(`resultado-${partidos[partidoActual].id}-${partidos[partidoActual].equipo2}`).value;

    if (resultado1 !== '' && resultado2 !== '') {
        const partido = `${partidos[partidoActual].equipo1} vs ${partidos[partidoActual].equipo2}`;
        const jugadaExistente = jugadasTemporales.find(jugada => jugada.partido === partido);

        if (jugadaExistente) {
            jugadaExistente.resultado = `${resultado1}-${resultado2}`;
        } else {
            jugadasTemporales.push({
                usuario: usuarioActual.usuario,
                partido: partido,
                resultado: `${resultado1}-${resultado2}`
            });
        }

        if (partidoActual < partidos.length - 1) {
            partidoActual++;
            const carousel = new bootstrap.Carousel(document.querySelector('#partidos-container'));
            carousel.next();
        }

        actualizarBotonGuardar(); // Verificar si el botón debe habilitarse
    } else {
        mostrarAlerta('Por favor, ingrese ambos resultados antes de continuar.', 'danger');
    }
};

const mostrarPartidoAnterior = () => {
    if (partidoActual > 0) {
        partidoActual--;
        const carousel = new bootstrap.Carousel(document.querySelector('#partidos-container'));
        carousel.prev();
    }
    actualizarBotonGuardar(); // Verificar si el botón debe habilitarse
};

const actualizarBotonGuardar = () => {
    const botonGuardar = document.querySelector("#form-jugar button[type='submit']");
    botonGuardar.disabled = false; // Asegurar que siempre esté habilitado
};

const obtenerPuntosUsuario = (jugadas, mapaResultados) => {
    return jugadas.reduce((total, jugada) => {
        const resultadoReal = mapaResultados[jugada.partido];
        if (resultadoReal) {
            const [goles1, goles2] = jugada.resultado.split('-').map(Number);
            const [golesReal1, golesReal2] = resultadoReal.split('-').map(Number);

            if (goles1 === golesReal1 && goles2 === golesReal2) {
                return total + 3;
            } else if ((goles1 > goles2 && golesReal1 > golesReal2) || 
                       (goles1 < goles2 && golesReal2 > golesReal1) || 
                       (goles1 === goles2 && golesReal1 === golesReal2)) {
                return total + 1;
            }
        }
        return total;
    }, 0);
};

const guardarJugada = async () => {
    try {
        const response = await fetch(`${API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });

        if (response.ok) {
            const data = await response.json();
            const jugadas = data.record.jugadas || [];
            const resultados = data.record.resultados || [];

            // Crear un mapa de resultados
            const mapaResultados = {};
            resultados.forEach(res => {
                mapaResultados[res.partido] = res.resultado;
            });

            // Obtener puntos actuales del usuario
            const puntosPrevios = obtenerPuntosUsuario(usuarioActual.jugadas, mapaResultados);

            const updatedJugadas = jugadas.filter(j => j.usuario !== usuarioActual.usuario);

            partidos.forEach((partido) => {
                const resultado1 = document.getElementById(`resultado-${partido.id}-${partido.equipo1}`).value || 'null';
                const resultado2 = document.getElementById(`resultado-${partido.id}-${partido.equipo2}`).value || 'null';
                const resultado = `${resultado1}-${resultado2}`;

                updatedJugadas.push({
                    usuario: usuarioActual.usuario,
                    partido: `${partido.equipo1} vs ${partido.equipo2}`,
                    resultado
                });
            });

            const updatedData = {
                ...data.record,
                jugadas: updatedJugadas
            };

            const saveResponse = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(updatedData)
            });

            if (saveResponse.ok) {
                mostrarAlerta('Jugadas guardadas correctamente', 'success');
                usuarioActual.jugadas = [...updatedJugadas.filter(j => j.usuario === usuarioActual.usuario)];

                // Obtener puntos nuevos del usuario
                const puntosNuevos = obtenerPuntosUsuario(usuarioActual.jugadas, mapaResultados);

                // Mostrar pop-up si los puntos han aumentado
                if (puntosNuevos > puntosPrevios) {
                    const puntosGanados = puntosNuevos - puntosPrevios;
                    mostrarPopupPuntos(puntosGanados, puntosNuevos);
                }

                await cargarPosiciones(); // Actualizar la tabla de posiciones
            } else {
                mostrarAlerta('Error al guardar las jugadas', 'danger');
            }
        }
    } catch (error) {
        console.error('Error al guardar las jugadas:', error);
    }
};



document.addEventListener("DOMContentLoaded", () => {
    cargarPartidos().then(() => {
        cargarFechas(); // Llenar el selector de fechas después de cargar los partidos
    });
    cargarPosiciones(); // Cargar posiciones al cargar la página

    const formRegistrarse = document.getElementById("form-registrarse");
    const formLogin = document.getElementById("form-login");
    const formJugar = document.getElementById("form-jugar");
    const formAuth = document.getElementById("form-auth");
    const formMisJugadas = document.getElementById("form-mis-jugadas");
    const formEliminarUsuario = document.getElementById("form-eliminar-usuario");

    formRegistrarse.addEventListener("submit", (event) => {
        event.preventDefault();
        const usuario = document.getElementById("usuario-registro").value;
        const contrasena = document.getElementById("password-registro").value;
        registrarUsuario(usuario, contrasena);
    });

    formLogin.addEventListener("submit", (event) => {
        event.preventDefault();
        const usuario = document.getElementById("nombre").value;
        const contrasena = document.getElementById("password").value;
        iniciarSesion(usuario, contrasena);
    });

    formJugar.addEventListener("submit", (event) => {
        event.preventDefault();
        guardarJugada();
    });

    formAuth.addEventListener("submit", autenticarAdmin);

    formEliminarUsuario.addEventListener("submit", (event) => {
        event.preventDefault();
        const nombreUsuario = document.getElementById("usuario-eliminar").value;
        eliminarUsuario(nombreUsuario);
    });

    formMisJugadas.addEventListener("submit", (event) => {
        event.preventDefault();
        const nombreUsuario = document.getElementById("nombre-jugadas").value;
        const fechaSeleccionada = document.getElementById("fecha-jugadas").value;
        cargarMisJugadas(nombreUsuario, fechaSeleccionada);
    });

    cargarFechas(); // Llenar el selector de fechas


    cargarPosiciones();
});


const cargarFechas = () => {
    const fechasUnicas = [...new Set(partidos.map(partido => partido.fecha))];
    const selectFecha = document.getElementById("fecha-jugadas");

    fechasUnicas.forEach(fecha => {
        const option = document.createElement("option");
        option.value = fecha;
        option.textContent = fecha;
        selectFecha.appendChild(option);
    });
};

const cargarPosiciones = async () => {

    mostrarLoader()
    try {
        const response = await fetch(`${API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            const jugadas = Array.isArray(data.record.jugadas) ? data.record.jugadas : [];
            const resultados = Array.isArray(data.record.resultados) ? data.record.resultados : [];

            // Crear un mapa de resultados
            const mapaResultados = {};
            resultados.forEach(res => {
                mapaResultados[res.partido] = res.resultado;
            });

            // Procesar las jugadas para calcular los puntos
            const usuariosPuntos = {};

            jugadas.forEach(jugada => {
                if (!usuariosPuntos[jugada.usuario]) {
                    usuariosPuntos[jugada.usuario] = 0;
                }
                const resultadoReal = mapaResultados[jugada.partido];
                if (resultadoReal) {
                    const [goles1, goles2] = jugada.resultado.split('-').map(Number);
                    const [golesReal1, golesReal2] = resultadoReal.split('-').map(Number);

                    if (goles1 === golesReal1 && goles2 === golesReal2) {
                        usuariosPuntos[jugada.usuario] += 3;
                    } else if ((goles1 > goles2 && golesReal1 > golesReal2) || 
                               (goles1 < goles2 && golesReal2 > golesReal1) || 
                               (goles1 === goles2 && golesReal1 === golesReal2)) {
                        usuariosPuntos[jugada.usuario] += 1;
                    }
                }
            });

            // Ordenar los usuarios por puntos en orden descendente
            const usuariosOrdenados = Object.entries(usuariosPuntos).sort((a, b) => b[1] - a[1]);

            // Crear filas de tabla para mostrar los puntos
            const tabla = document.getElementById('tabla-posiciones');
            tabla.innerHTML = `
                <tr>
                    <th>Usuario</th>
                    <th>Puntos</th>
                </tr>
            `;

            usuariosOrdenados.forEach(([usuario, puntos]) => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${usuario}</td>
                    <td>${puntos}</td>
                `;
                tabla.appendChild(fila);
            });
        } else {
            console.error('Error al obtener los datos de la API:', response.statusText);
        }
    } catch (error) {
        console.error('Error al cargar las posiciones:', error);
    }
    ocultarLoader();
};


const guardarResultado = async (resultado) => {
    try {
        const response = await fetch(`${API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            const updatedData = {
                ...data.record,
                resultados: [...data.record.resultados, resultado]
            };
            const saveResponse = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(updatedData)
            });
            if (saveResponse.ok) {
                mostrarAlerta('Resultado guardado correctamente', 'success');
                cargarPosiciones(); // Actualizar la tabla de posiciones
            } else {
                mostrarAlerta('Error al guardar el resultado', 'danger');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }

    cargarPosiciones();
};

const cargarMisJugadas = async (nombreUsuario, fechaSeleccionada) => {
    try {
        const response = await fetch(`${API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            const jugadas = Array.isArray(data.record.jugadas) ? data.record.jugadas : [];
            const usuarioJugadas = jugadas.filter(j => j.usuario.toLowerCase() === nombreUsuario.toLowerCase());

            const listaJugadas = document.getElementById('lista-jugadas');
            listaJugadas.innerHTML = '';

            if (usuarioJugadas.length > 0) {
                const jugadasFiltradas = fechaSeleccionada === "todas" ? usuarioJugadas : usuarioJugadas.filter(j => {
                    const partido = partidos.find(p => `${p.equipo1} vs ${p.equipo2}` === j.partido);
                    return partido && partido.fecha === fechaSeleccionada;
                });

                if (jugadasFiltradas.length > 0) {
                    const grupos = {
                        'Grupo A': [],
                        'Grupo B': [],
                        'Grupo C': [],
                        'Grupo D': []
                    };

                    jugadasFiltradas.forEach(jugada => {
                        const partido = partidos.find(p => `${p.equipo1} vs ${p.equipo2}` === jugada.partido);
                        if (partido) {
                            if (partido.id <= 6) {
                                grupos['Grupo A'].push(jugada);
                            } else if (partido.id <= 12) {
                                grupos['Grupo B'].push(jugada);
                            } else if (partido.id <= 18) {
                                grupos['Grupo C'].push(jugada);
                            } else {
                                grupos['Grupo D'].push(jugada);
                            }
                        }
                    });

                    for (const [grupo, jugadas] of Object.entries(grupos)) {
                        if (jugadas.length > 0) {
                            const grupoDiv = document.createElement('div');
                            grupoDiv.innerHTML = `<h3>${grupo}</h3>`;
                            const tabla = document.createElement('table');
                            tabla.className = 'tabla-jugadas table table-striped';
                            tabla.innerHTML = `
                                <tr>
                                    <th>Partido</th>
                                    <th>Resultado</th>
                                </tr>
                            `;
                            jugadas.forEach(jugada => {
                                const fila = document.createElement('tr');
                                fila.innerHTML = `
                                    <td>${jugada.partido}</td>
                                    <td>${jugada.resultado}</td>
                                `;
                                tabla.appendChild(fila);
                            });
                            grupoDiv.appendChild(tabla);
                            listaJugadas.appendChild(grupoDiv);
                        }
                    }
                } else {
                    listaJugadas.innerHTML = '<p>No se encontraron jugadas para la fecha seleccionada.</p>';
                }
            } else {
                listaJugadas.innerHTML = '<p>No se encontraron jugadas para este usuario.</p>';
            }
        }
    } catch (error) {
        console.error('Error al cargar las jugadas:', error);
    }
};




const eliminarUsuario = async (nombreUsuario) => {
    try {
        const response = await fetch(`${API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            const usuarios = data.record.usuarios || [];
            const jugadas = data.record.jugadas || [];
            
            // Filtrar usuarios y jugadas
            const nuevosUsuarios = usuarios.filter(u => u.usuario !== nombreUsuario);
            const nuevasJugadas = jugadas.filter(j => j.usuario !== nombreUsuario);
            
            const updatedData = {
                ...data.record,
                usuarios: nuevosUsuarios,
                jugadas: nuevasJugadas
            };

            const saveResponse = await fetch(API_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY
                },
                body: JSON.stringify(updatedData)
            });

            if (saveResponse.ok) {
                mostrarAlerta(`Usuario ${nombreUsuario} y sus jugadas han sido eliminados correctamente`, 'success');
                cargarPosiciones(); // Actualizar la tabla de posiciones
            } else {
                mostrarAlerta('Error al eliminar el usuario', 'danger');
            }
        }
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
    }
    cargarPosiciones();
};


const mostrarPartidosAdmin = async () => {
    try {
        const response = await fetch(`${API_URL}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            const resultados = data.record.resultados || [];

            const contenedorResultados = document.getElementById("resultados-partidos");
            contenedorResultados.innerHTML = '';

            partidos.forEach(partido => {
                const resultadoGuardado = resultados.find(res => res.partido === `${partido.equipo1} vs ${partido.equipo2}`);
                const resultado1 = resultadoGuardado ? resultadoGuardado.resultado.split('-')[0] : '';
                const resultado2 = resultadoGuardado ? resultadoGuardado.resultado.split('-')[1] : '';

                const card = document.createElement("div");
                card.className = "card-admin";
                card.innerHTML = `
                    <div class="card mx-auto" style="max-width: 18rem;">
                        <div class="card-header">${partido.equipo1} vs ${partido.equipo2}</div>
                        <div class="card-body">
                            <p>${partido.fecha} ${partido.hora}</p>
                            <p>${partido.estadio}</p>
                            <div class="form-floating mb-2">
                                <input type="number" class="form-control" id="resultado-admin-${partido.id}-${partido.equipo1}" name="resultado-admin-${partido.id}-${partido.equipo1}" min="0" value="${resultado1}">
                                <label for="resultado-admin-${partido.id}-${partido.equipo1}">${partido.equipo1}:</label>
                            </div>
                            <div class="form-floating mb-3">
                                <input type="number" class="form-control" id="resultado-admin-${partido.id}-${partido.equipo2}" name="resultado-admin-${partido.id}-${partido.equipo2}" min="0" value="${resultado2}">
                                <label for="resultado-admin-${partido.id}-${partido.equipo2}">${partido.equipo2}:</label>
                            </div>
                            <button class="btn btn-primary" onclick="guardarResultadoReal(${partido.id})">Guardar Resultado</button>
                        </div>
                    </div>
                `;
                contenedorResultados.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error al mostrar los partidos del admin:', error);
    }
};

const guardarResultadoReal = async (partidoId) => {
    const partido = partidos.find(p => p.id === partidoId);
    const resultado1 = document.getElementById(`resultado-admin-${partido.id}-${partido.equipo1}`).value || 'null';
    const resultado2 = document.getElementById(`resultado-admin-${partido.id}-${partido.equipo2}`).value || 'null';

    if (resultado1 !== 'null' && resultado2 !== 'null') {
        const resultado = {
            partido: `${partido.equipo1} vs ${partido.equipo2}`,
            resultado: `${resultado1}-${resultado2}`
        };

        try {
            const response = await fetch(`${API_URL}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': API_KEY
                }
            });

            if (response.ok) {
                const data = await response.json();
                const resultados = data.record.resultados || [];
                const updatedResultados = resultados.filter(res => res.partido !== resultado.partido);

                updatedResultados.push(resultado);

                const updatedData = {
                    ...data.record,
                    resultados: updatedResultados
                };

                const saveResponse = await fetch(API_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': API_KEY
                    },
                    body: JSON.stringify(updatedData)
                });

                if (saveResponse.ok) {
                    mostrarAlerta('Resultado guardado correctamente', 'success');
                    await cargarPosiciones(); // Actualizar la tabla de posiciones
                    mostrarPartidosAdmin(); // Actualizar la vista después de guardar el resultado
                } else {
                    mostrarAlerta('Error al guardar el resultado', 'danger');
                }
            }
        } catch (error) {
            console.error('Error al guardar el resultado:', error);
        }
    } else {
        mostrarAlerta('Por favor ingrese ambos resultados.', 'danger');
    }
    cargarPosiciones();
};


const limpiarSecciones = () => {
    document.getElementById('form-login').reset();
    document.getElementById('form-jugar').reset();
    document.getElementById('form-auth').reset();
    document.getElementById('form-eliminar-usuario').reset();
    document.getElementById('form-mis-jugadas').reset();
    
    document.getElementById('partidos').innerHTML = '';
    document.getElementById('resultados-partidos').innerHTML = '';
    document.getElementById('lista-jugadas').innerHTML = '';
    document.getElementById('tabla-posiciones').innerHTML = '';

    cargarPosiciones();
};

const navbarNav = document.getElementById('navbarNav');
const navLinks = document.querySelectorAll('.nav-link');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navbarNav.classList.contains('show')) {
            new bootstrap.Collapse(navbarNav).toggle();
        }
    });
});

const mostrarSeccion = (seccion) => {
    limpiarSecciones(); // Limpiar secciones antes de mostrar una nueva
    const secciones = document.querySelectorAll('main section');
    secciones.forEach(sec => {
        sec.style.display = (sec.id === seccion) ? 'block' : 'none';
    });

    // Recargar partidos cuando se muestra la sección "Jugar"
    if (seccion === 'jugar') {
        generarCartasPartidos();
    }

    // Contraer el menú después de seleccionar una sección
    if (navbarNav.classList.contains('show')) {
        new bootstrap.Collapse(navbarNav).toggle();
    }

    cargarPosiciones();
};



const autenticarAdmin = (event) => {
    event.preventDefault();
    const usuario = document.getElementById('usuario-admin').value;
    const password = document.getElementById('password-admin').value;
    
    if (usuario === 'usuAdmin' && password === 'pass123') {
        document.getElementById('auth-admin').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        mostrarPartidosAdmin();
    } else {
        mostrarAlerta('Usuario o contraseña incorrectos', 'danger');
    }
    cargarPosiciones();
};


const mostrarAlerta = (mensaje, tipo) => {
    const alertContainer = document.getElementById('alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alertDiv);

    // Quitar la alerta después de 5 segundos
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
};