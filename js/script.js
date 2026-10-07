gsap.registerPlugin(ScrollTrigger);

const cover = document.getElementById('passport-cover');
const passportContainer = document.getElementById('passport-container');
const passportScreen = document.getElementById('passport-screen');
const main = document.getElementById('main-content');
const music = document.getElementById('bg-music');
const indicator = document.getElementById('scroll-indicator');
const muteBtn = document.getElementById('mute-btn');
const guestCountSelect = document.getElementById('guest-count');
const guestNamesContainer = document.getElementById('guest-names-container');
const progressBarContainer = document.getElementById('scroll-progress-container');
const progressBar = document.getElementById('scroll-progress-bar');

document.addEventListener("DOMContentLoaded", () => {
    // 1. Definir la fecha límite (Ejemplo: 15 de enero de 2027 a las 23:59)
    const RSVP_DEADLINE = new Date("2027-01-15T23:59:59");
    const fechaActual = new Date();

    const reservacionContainer = document.getElementById("reservacion-container");
    const mensajeEstado = document.getElementById("mensaje-estado");

    // Validar si el plazo de confirmación ya expiró
    if (fechaActual > RSVP_DEADLINE) {
        if (reservacionContainer) reservacionContainer.style.display = "none";
        if (mensajeEstado) {
            mensajeEstado.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
                    <strong class="font-bold">¡El plazo de confirmación ha finalizado!</strong>
                    <p class="block sm:inline mt-1">El periodo para confirmar la asistencia ya pasó y lo lamentamos mucho. Ya cerramos la lista definitiva para tener todo listo para nuestra boda. ¡Gracias de todas formas!</p>
                </div>
            `;
        }
        return; // Detiene la ejecución para que no valide el token si ya venció el plazo
    }

    // 2. Validación de tokens y asientos
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("pass");

    // Base de datos de tokens permitidos y sus asientos
    const GUEST_TOKENS = {
        "A1X9": 1, "B7K2": 1, "C3M8": 1,
        "D4P1": 2, "E8L5": 2, "F2W9": 2,
        "G9R3": 3, "H5T7": 3, "J1V4": 3,
        "K6Z8": 4, "L2Y0": 4, "M7N3": 4,
        "P3Q5": 5, "R8S1": 5, "T4U9": 5
    };

    if (!token || !GUEST_TOKENS[token]) {
        // Si no trae pase o el pase es inválido, se oculta la sección de reserva
        if (reservacionContainer) reservacionContainer.style.display = "none";
        if (mensajeEstado) {
            mensajeEstado.innerHTML = `
                <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded relative text-center" role="alert">
                    <strong class="font-bold">Acceso sin pase válido</strong>
                    <p class="block sm:inline mt-1">Este enlace no cuenta con un pase de invitación válido para realizar reservaciones. Por favor, verifica el enlace personalizado que se te compartió.</p>
                </div>
            `;
        }
    } else {
        // Si el token es válido, asignamos la cantidad de asientos permitidos
        const asientosDisponibles = GUEST_TOKENS[token];
        console.log(`Pase válido detectado. Asientos asignados: ${asientosDisponibles}`);
        // Aquí puedes colocar la lógica para mostrar los campos según los asientos
    }
});

// --- 1. HOVER EFECTO 3D EN PASAPORTE (TILT) ---
passportContainer.addEventListener('mousemove', (e) => {
    const rect = passportContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - (rect.width / 2);
    const y = e.clientY - rect.top - (rect.height / 2);
    
    const tiltX = (y / (rect.height / 2)) * -15;
    const tiltY = (x / (rect.width / 2)) * 15;

    gsap.to(cover, {
        rotateX: tiltX,
        rotateY: tiltY,
        transformPerspective: 1000,
        duration: 0.3,
        ease: "power2.out"
    });
});

passportContainer.addEventListener('mouseleave', () => {
    gsap.to(cover, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: "power2.out"
    });
});

// --- 2. APERTURA RÁPIDA DEL PASAPORTE ---
cover.addEventListener('click', () => {
    music.volume = 0.35;
    music.play().then(() => {
        muteBtn.classList.remove('hidden');
    }).catch(error => {
        muteBtn.classList.remove('hidden');
    });

    const tl = gsap.timeline();
    tl.to(cover, { 
        rotateY: -130, 
        x: -320, 
        scale: 0.9,
        opacity: 0, 
        duration: 0.7, 
        ease: "power3.inOut"
    })
    .to(passportScreen, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
            passportScreen.style.display = 'none';
            progressBarContainer.classList.remove('hidden');
        }
    }, "-=0.3")
    .set("body", { className: "-=no-scroll" })
    .set(main, { display: 'block' })
    .to(main, { opacity: 1, duration: 0.1 })
    .to(indicator, { opacity: 1, duration: 0.6 })
    .fromTo(".ticket-section", 
        { opacity: 0, y: 50 },
        { 
            opacity: 1, 
            y: 0, 
            duration: 0.7, 
            stagger: 0.12, 
            ease: "power3.out",
            onComplete: () => {
                initScrollAnimations();
                initScrollProgressBar();
            }
        }, "-=0.2"
    );
});

// --- 3. INPUTS DINÁMICOS DE INVITADOS ---
guestCountSelect.addEventListener('change', (e) => {
    const count = parseInt(e.target.value);
    guestNamesContainer.innerHTML = '';
    
    for(let i = 1; i <= count; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Nombre del Pasajero ${i}`;
        input.className = 'rsvp-input guest-name-field opacity-0 transform translate-y-2';
        input.required = true;
        guestNamesContainer.appendChild(input);

        gsap.to(input, {
            opacity: 1,
            y: 0,
            delay: i * 0.1,
            duration: 0.4,
            ease: "power2.out"
        });
    }
});

// --- 4. ENVÍO DE RSVP A WHATSAPP ---
function sendRSVP() {
    const fields = document.querySelectorAll('.guest-name-field');
    const errorMsg = document.getElementById('error-msg');
    let names = [];
    let isValid = true;

    if (fields.length === 0) {
        isValid = false;
    }

    fields.forEach(f => {
        if(f.value.trim() === "") isValid = false;
        names.push(f.value.trim());
    });

    if(!isValid) {
        errorMsg.classList.remove('hidden');
        return;
    }

    errorMsg.classList.add('hidden');
    
    let message = "*\u2708\uFE0F \u00A1CONFIRMACI\u00D3N DE VUELO! \u2708\uFE0F*\n\n";
    message += "\u2728 \u00A1Hola Susan y Winston! Confirmo nuestra asistencia a su boda.\n\n";
    message += "*\uD83C\uDFAB Asientos reservados:* " + names.length + "\n";
    message += "*\uD83D\uDC65 Pasajeros del viaje:*\n";
    
    names.forEach((n, idx) => {
        message += " \u2022 *Pasajero " + (idx + 1) + ":* " + n + "\n";
    });
    
    message += "\n_\u00A1Estamos listos para despegar con ustedes! \u2728_";
    
    const whatsappUrl = "https://api.whatsapp.com/send?phone=50684031258&text=" + encodeURIComponent(message);
    
    window.open(whatsappUrl, '_blank');
}

// --- 5. CONTROLADOR DE AUDIO ---
muteBtn.addEventListener('click', () => {
    if (music.paused) {
        music.play();
        muteBtn.innerText = "🔊";
    } else {
        music.pause();
        muteBtn.innerText = "🔇";
    }
});

// --- 6. CÓDIGO DE VESTIMENTA INTERACTIVO ---
function selectColorDress(color) {
    const adviceBox = document.getElementById('dress-code-advice');
    let text = "";

    switch(color) {
        case 'sage':
            text = "🌿 Verde Olivia: Un tono fresco, elegante y en perfecta sintonía con el entorno.";
            break;
        case 'lila':
            text = "💜 Lila: Aporta suavidad, romance y encanto a la celebración.";
            break;
        case 'beige':
            text = "🌾 Beige: Neutro, luminoso y muy distinguido.";
            break;
        case 'cafe':
            text = "☕ Café: Un tono cálido y sobrio ideal para la tarde.";
            break;
        default:
            text = "💡 Elige cualquiera de los colores sugeridos para obtener recomendaciones.";
    }

    gsap.to(adviceBox, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
            adviceBox.innerHTML = `<p class="text-xs text-forestGreen font-semibold font-sans">${text}</p>`;
            gsap.to(adviceBox, { opacity: 1, duration: 0.3 });
        }
    });
}

// --- 7. ANIMACIONES DE DESLIZAMIENTO EN SCROLL ---
function initScrollAnimations() {
    gsap.utils.toArray('.ticket-card').forEach((card) => {
        gsap.fromTo(card, 
            { opacity: 0.7, scale: 0.96, y: 30 },
            { 
                opacity: 1, 
                scale: 1, 
                y: 0,
                scrollTrigger: {
                    trigger: card,
                    start: "top 95%",
                    end: "top 65%",
                    scrub: 1,
                }
            }
        );
    });
}

// --- 8. CONFIGURACIÓN DE LA BARRA DE PROGRESO DE SCROLL ---
function initScrollProgressBar() {
    window.addEventListener('scroll', () => {
        const windowScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (windowScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// --- 9. CANVAS DE PARTÍCULAS AÉREAS ---
const canvas = document.getElementById('bubbles-canvas');
const ctx = canvas.getContext('2d');
let flightElements = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class FlightParticle {
    constructor(type) {
        this.type = type || (Math.random() > 0.15 ? 'star' : 'paperplane');
        this.reset();
        this.y = Math.random() * canvas.height;
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = this.type === 'paperplane' ? Math.random() * 8 + 6 : Math.random() * 3.5 + 1;
        this.speedY = Math.random() * 1.2 + 0.6;
        this.speedX = Math.random() * 0.8 + 0.2;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.angle = Math.random() * 360;
        this.spinSpeed = Math.random() * 0.8 - 0.4;
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.type === 'paperplane') {
            this.angle += this.spinSpeed;
        }

        if (this.y > canvas.height + 20 || this.x > canvas.width + 20) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowColor = "rgba(212, 175, 55, 0.4)";

        if (this.type === 'paperplane') {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle * Math.PI / 180);
            
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size * 0.6, this.size * 0.8);
            ctx.lineTo(0, this.size * 0.3);
            ctx.lineTo(-this.size * 0.6, this.size * 0.8);
            ctx.closePath();
            
            ctx.fillStyle = "#718355";
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(0, this.size * 0.3);
            ctx.lineTo(-this.size * 0.6, this.size * 0.8);
            ctx.closePath();
            ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
            ctx.fill();

        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            ctx.shadowBlur = 6;
            ctx.fill();
        }

        ctx.restore();
    }
}

function initFlightBackground() {
    flightElements = [];
    const totalParticles = 28; 
    for (let i = 0; i < totalParticles; i++) {
        flightElements.push(new FlightParticle());
    }
}

function animateFlightBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < flightElements.length; i++) {
        flightElements[i].update();
        flightElements[i].draw();
    }
    requestAnimationFrame(animateFlightBackground);
}

initFlightBackground();
animateFlightBackground();

// --- 10. CONFIGURACIÓN DEL TEMPORIZADOR ---
const targetDate = new Date(2027, 1, 13, 9, 0, 0).getTime();
function updateTimer() {
    const now = new Date().getTime();
    const diff = targetDate - now;
    
    if (diff > 0) {
        document.getElementById("days").innerText = Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
        document.getElementById("hours").innerText = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
        document.getElementById("mins").innerText = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        document.getElementById("secs").innerText = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
    }
}
setInterval(updateTimer, 1000);
updateTimer();