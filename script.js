const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const inputNombre = document.getElementById("inputNombre");
const inputFoto = document.getElementById("inputFoto");
const btnAgregar = document.getElementById("btnAgregar");
const btnSpin = document.getElementById("btnSpin");
const btnLimpiar = document.getElementById("btnLimpiar");
const listaDiv = document.getElementById("listaParticipantes");

const sonidoClic = document.getElementById("sonidoClic");
const sonidoGanador = document.getElementById("sonidoGanador");
const sonidoFinal = document.getElementById("sonidoFinal");

const modalGanador = document.getElementById("ganadorModal");
const fotoGanadorModal = document.getElementById("ganadorFoto");
const nombreGanadorModal = document.getElementById("ganadorNombre");
const btnCerrarModal = document.getElementById("btnCerrarGanador");
const confetiContainer = document.getElementById("confeti");

let participantes = [];
let anguloActual = 0;
let velocidad = 0;
const friccion = 0.993;
let ultimoIndiceSonido = -1;
let finalReproducido = false;

// --- OPTIMIZACIÓN DE AUDIO CON VOLUMEN FORZADO AL MÁXIMO ---
let ultimaVezSonido = 0;
const intervaloMinimoAudio = 45; 

function reproducirClic(vol) {
    const ahora = Date.now();
    if (velocidad > 0.04 && ahora - ultimaVezSonido > intervaloMinimoAudio) {
        if (sonidoClic) {
            sonidoClic.pause(); // Reset físico del buffer
            sonidoClic.currentTime = 0;
            // FORZADO AL MÁXIMO (1.0) para compensar archivos con baja ganancia
            sonidoClic.volume = 1.0; 
            sonidoClic.play().catch(() => {});
            ultimaVezSonido = ahora;
        }
    }
}

// --- DESBLOQUEO DE AUDIO ---
document.body.addEventListener('click', () => {
    [sonidoClic, sonidoGanador, sonidoFinal].forEach(s => {
        if (s) {
            s.play().then(() => {
                s.pause();
                s.currentTime = 0;
            }).catch(() => {});
        }
    });
}, { once: true });

function obtenerColorVariado(i) {
    const hue = (i * 137.5) % 360;
    return `hsl(${hue}, 85%, 60%)`;
}

function guardarEnBDLocal() {
    const datosParaGuardar = participantes.map(p => ({
        nombre: p.nombre,
        color: p.color,
        imagenSrc: p.imagen.src
    }));
    localStorage.setItem("ruleta_data", JSON.stringify(datosParaGuardar));
}

function cargarDesdeBDLocal() {
    const datosGuardados = localStorage.getItem("ruleta_data");
    if (datosGuardados) {
        const datosParseados = JSON.parse(datosGuardados);
        datosParseados.forEach(dato => {
            const img = new Image();
            img.onload = () => {
                participantes.push({
                    nombre: dato.nombre,
                    color: dato.color,
                    imagen: img
                });
                actualizarTodo();
            };
            img.src = dato.imagenSrc;
        });
    }
}

function iniciarGiro() {
    if (velocidad === 0 && participantes.length > 0) {
        ocultarGanador();
        ultimoIndiceSonido = -1;
        finalReproducido = false;
        velocidad = Math.random() * 0.3 + 0.45;
        animar();
    }
}

canvas.onclick = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const distancia = Math.sqrt(Math.pow(x - 250, 2) + Math.pow(y - 250, 2));
    if (distancia < 80) iniciarGiro();
};

canvas.onmousemove = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const distancia = Math.sqrt(Math.pow(x - 250, 2) + Math.pow(y - 250, 2));
    canvas.style.cursor = (distancia < 80) ? "pointer" : "default";
};

btnAgregar.onclick = () => {
    const nombre = inputNombre.value.trim();
    if (!nombre) return;
    const file = inputFoto.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            participantes.push({ 
                nombre, 
                imagen: img, 
                color: obtenerColorVariado(participantes.length)
            });
            actualizarTodo();
            guardarEnBDLocal();
        };
        img.src = e.target.result;
    };

    if (file) reader.readAsDataURL(file);
    else {
        const imgDef = new Image();
        imgDef.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        imgDef.onload = () => {
            participantes.push({ 
                nombre, 
                imagen: imgDef, 
                color: obtenerColorVariado(participantes.length)
            });
            actualizarTodo();
            guardarEnBDLocal();
        };
    }
};

function actualizarTodo() {
    inputNombre.value = ""; inputFoto.value = "";
    dibujar(); renderLista();
}

function dibujar() {
    ctx.clearRect(0, 0, 500, 500);
    const centro = 250;
    const radio = 250;

    ctx.save();
    const grad = ctx.createConicGradient(anguloActual, centro, centro);
    grad.addColorStop(0, "#ff0000"); grad.addColorStop(0.2, "#ffff00");
    grad.addColorStop(0.4, "#00ff00"); grad.addColorStop(0.6, "#00ffff");
    grad.addColorStop(0.8, "#0000ff"); grad.addColorStop(1, "#ff0000");
    ctx.beginPath(); ctx.arc(centro, centro, radio - 6, 0, Math.PI * 2);
    ctx.strokeStyle = grad; ctx.lineWidth = 12; ctx.stroke(); ctx.restore();

    if (participantes.length === 0) return;
    const arco = (Math.PI * 2) / participantes.length;

    participantes.forEach((p, i) => {
        const ang = anguloActual + i * arco;
        ctx.beginPath(); ctx.fillStyle = p.color; ctx.moveTo(centro, centro);
        ctx.arc(centro, centro, radio - 12, ang, ang + arco); ctx.fill();
        ctx.save(); ctx.translate(centro, centro); ctx.rotate(ang + arco/2);
        ctx.textAlign = "right"; ctx.fillStyle = "white"; ctx.font = "bold 14px Arial";
        ctx.fillText(p.nombre.substring(0, 15), radio - 40, 5); ctx.restore();
    });

    let anguloFlecha = (1.5 * Math.PI) - (anguloActual % (Math.PI * 2));
    if (anguloFlecha < 0) anguloFlecha += Math.PI * 2;
    const indiceActual = Math.floor(anguloFlecha / arco) % participantes.length;
    
    if (indiceActual !== ultimoIndiceSonido && velocidad > 0.005) {
        reproducirClic(velocidad);
        ultimoIndiceSonido = indiceActual;
    }

    // SONIDO FINAL AL MÁXIMO VOLUMEN (1.0)
    if (velocidad < 0.04 && velocidad > 0.001 && !finalReproducido) {
        if (sonidoFinal) {
            sonidoFinal.currentTime = 0;
            sonidoFinal.volume = 1.0; 
            sonidoFinal.play().catch(() => {});
            finalReproducido = true;
        }
    }

    const pActual = participantes[indiceActual];
    if (pActual) {
        ctx.save();
        ctx.beginPath(); ctx.arc(centro, centro, 80, 0, Math.PI*2); ctx.clip();
        ctx.drawImage(pActual.imagen, 170, 170, 160, 160);
        ctx.restore();
        ctx.beginPath(); ctx.arc(centro, centro, 80, 0, Math.PI*2);
        ctx.strokeStyle = "#00ff00"; ctx.lineWidth = 5; ctx.stroke();
    }
}

function animar() {
    if (velocidad > 0.001) {
        anguloActual += velocidad;
        velocidad *= friccion;
        dibujar();
        requestAnimationFrame(animar);
    } else if (velocidad !== 0) {
            velocidad = 0;
            if (sonidoFinal) {
                sonidoFinal.pause();
            }
            if (sonidoGanador) {
                sonidoGanador.currentTime = 0;
                sonidoGanador.volume = 1.0; // VOLUMEN GANADOR AL MÁXIMO
                sonidoGanador.play().catch(() => {});
            }
            const arcoFinal = (Math.PI * 2) / participantes.length;
            let angFinal = (1.5 * Math.PI) - (anguloActual % (Math.PI * 2));
            if (angFinal < 0) angFinal += Math.PI * 2;
            const ganador = participantes[Math.floor(angFinal / arcoFinal) % participantes.length];
            if (ganador) mostrarGanador(ganador);
            dibujar();
    }
}

function mostrarGanador(ganador) {
    fotoGanadorModal.src = ganador.imagen.src;
    nombreGanadorModal.innerText = ganador.nombre;
    modalGanador.classList.add("modal-visible");
    modalGanador.style.display = "flex";
    lanzarConfeti();
}

function ocultarGanador() {
    modalGanador.classList.remove("modal-visible");
    modalGanador.style.display = "none";
    limpiarConfeti();
}

btnCerrarModal.onclick = ocultarGanador;
btnSpin.onclick = iniciarGiro;

btnLimpiar.onclick = () => { 
    participantes = []; 
    localStorage.removeItem("ruleta_data"); 
    actualizarTodo(); 
};

function renderLista() {
    listaDiv.innerHTML = "";
    participantes.forEach((p, i) => {
        const d = document.createElement("div");
        d.className = "participante-item";
        d.innerHTML = `<span>${p.nombre}</span> <button onclick="eliminar(${i})">🗑️</button>`;
        listaDiv.appendChild(d);
    });
}

window.eliminar = (i) => { 
    participantes.splice(i, 1); 
    guardarEnBDLocal(); 
    actualizarTodo(); 
};

const coloresConfeti = ['#ff0', '#f0f', '#0ff', '#0f0', '#ff5733', '#fff'];
function lanzarConfeti() {
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        p.className = 'confeti';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 2 + 's';
        p.style.backgroundColor = coloresConfeti[Math.floor(Math.random() * coloresConfeti.length)];
        confetiContainer.appendChild(p);
    }
}

function limpiarConfeti() {
    confetiContainer.innerHTML = '';
}

cargarDesdeBDLocal();
dibujar();