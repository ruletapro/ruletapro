const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const inputNombre = document.getElementById("inputNombre");
const inputFoto = document.getElementById("inputFoto");
const btnAgregar = document.getElementById("btnAgregar");
const btnSpin = document.getElementById("btnSpin");
const btnLimpiar = document.getElementById("btnLimpiar");
const listaDiv = document.getElementById("listaParticipantes");

let participantes = [];
const coloresDefault = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082"];

let anguloActual = 0;
let velocidad = 0;
const friccion = 0.993;

// --- AGREGAR ---
btnAgregar.onclick = () => {
    const nombre = inputNombre.value.trim();
    if (!nombre) return;
    const file = inputFoto.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            participantes.push({ nombre, imagen: img, color: coloresDefault[participantes.length % 6] });
            actualizarTodo();
        };
        img.src = e.target.result;
    };

    if (file) reader.readAsDataURL(file);
    else {
        const imgDef = new Image();
        imgDef.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        imgDef.onload = () => {
            participantes.push({ nombre, imagen: imgDef, color: coloresDefault[participantes.length % 6] });
            actualizarTodo();
        };
    }
};

function actualizarTodo() {
    inputNombre.value = ""; inputFoto.value = "";
    dibujar(); renderLista();
}

// --- DIBUJO ---
function dibujar() {
    ctx.clearRect(0, 0, 500, 500);
    const centro = 250;
    const radio = 250;

    if (participantes.length === 0) {
        dibujarAroMulticolor(centro, radio);
        return;
    }

    const arco = (Math.PI * 2) / participantes.length;

    // 1. Dibujar el Aro Multicolor Externo
    dibujarAroMulticolor(centro, radio);

    // 2. Dibujar Secciones y Nombres
    participantes.forEach((p, i) => {
        const ang = anguloActual + i * arco;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.moveTo(centro, centro);
        ctx.arc(centro, centro, radio - 12, ang, ang + arco); // Espacio para el aro
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.stroke();

        ctx.save();
        ctx.translate(centro, centro);
        ctx.rotate(ang + arco/2);
        ctx.textAlign = "right"; ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.fillText(p.nombre.substring(0, 15), radio - 40, 5);
        ctx.restore();
    });

    // 3. Sincronizar Imagen Central
    let anguloFlecha = (1.5 * Math.PI) - (anguloActual % (Math.PI * 2));
    if (anguloFlecha < 0) anguloFlecha += Math.PI * 2;
    const indiceActual = Math.floor(anguloFlecha / arco) % participantes.length;
    const pActual = participantes[indiceActual];

    if (pActual) {
        // Brillo central
        ctx.save();
        ctx.beginPath(); ctx.arc(centro, centro, 82, 0, Math.PI*2);
        ctx.shadowBlur = 15; ctx.shadowColor = "#00ff00";
        ctx.fillStyle = "#000"; ctx.fill();
        ctx.restore();

        // Foto
        ctx.save();
        ctx.beginPath(); ctx.arc(centro, centro, 80, 0, Math.PI*2); ctx.clip();
        ctx.drawImage(pActual.imagen, 170, 170, 160, 160);
        ctx.restore();

        // Aro Neon Central
        ctx.beginPath(); ctx.arc(centro, centro, 80, 0, Math.PI*2);
        ctx.strokeStyle = "#00ff00"; ctx.lineWidth = 5; ctx.stroke();
    }
}

function dibujarAroMulticolor(centro, radio) {
    ctx.save();
    // Gradiente cónico que gira con la ruleta
    const grad = ctx.createConicGradient(anguloActual, centro, centro);
    grad.addColorStop(0, "#ff0000");
    grad.addColorStop(0.2, "#ffff00");
    grad.addColorStop(0.4, "#00ff00");
    grad.addColorStop(0.6, "#00ffff");
    grad.addColorStop(0.8, "#0000ff");
    grad.addColorStop(1, "#ff0000");

    ctx.beginPath();
    ctx.arc(centro, centro, radio - 6, 0, Math.PI * 2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 12;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(255,255,255,0.3)";
    ctx.stroke();
    ctx.restore();
}

// --- ANIMACIÓN ---
function animar() {
    if (velocidad > 0.001) {
        anguloActual += velocidad;
        velocidad *= friccion;
        dibujar();
        requestAnimationFrame(animar);
    } else { velocidad = 0; }
}

btnSpin.onclick = () => {
    if (velocidad === 0 && participantes.length > 0) {
        velocidad = Math.random() * 0.5 + 0.4;
        animar();
    }
};

btnLimpiar.onclick = () => { participantes = []; actualizarTodo(); };

function renderLista() {
    listaDiv.innerHTML = "";
    participantes.forEach((p, i) => {
        const d = document.createElement("div");
        d.className = "participante-item";
        d.innerHTML = `<img src="${p.imagen.src}" class="mini-foto"> <span>${p.nombre}</span> <button onclick="eliminar(${i})">🗑️</button>`;
        listaDiv.appendChild(d);
    });
}

window.eliminar = (i) => { participantes.splice(i, 1); actualizarTodo(); };

dibujar();