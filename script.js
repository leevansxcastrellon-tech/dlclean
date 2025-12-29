// 1. Manejo del Menú Móvil
const btn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');

btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
});

// 2. Sistema de Pestañas (Tabs)
function switchTab(tabName) {
    // Ocultar todos
    document.getElementById('tab-hogar').classList.add('hidden');
    document.getElementById('tab-empresas').classList.add('hidden');

    // Reset botones
    const btnHogar = document.getElementById('btn-hogar');
    const btnEmpresas = document.getElementById('btn-empresas');

    btnHogar.classList.remove('bg-brand-primary', 'text-white', 'shadow-lg', 'scale-105');
    btnHogar.classList.add('bg-white', 'text-gray-500', 'border');

    btnEmpresas.classList.remove('bg-brand-primary', 'text-white', 'shadow-lg', 'scale-105');
    btnEmpresas.classList.add('bg-white', 'text-gray-500', 'border');

    // Mostrar seleccionado
    document.getElementById('tab-' + tabName).classList.remove('hidden');
    document.getElementById('tab-' + tabName).classList.add('fade-in-up', 'visible');

    // Estilar botón activo
    const activeBtn = document.getElementById('btn-' + tabName);
    activeBtn.classList.remove('bg-white', 'text-gray-500', 'border');
    activeBtn.classList.add('bg-brand-primary', 'text-white', 'shadow-lg');
}

// 3. Sistema de Testimonios con SUPABASE y Carrusel
const reviewForm = document.getElementById('review-form');
const reviewsContainer = document.getElementById('reviews-container');
const carouselPrev = document.getElementById('carousel-prev');
const carouselNext = document.getElementById('carousel-next');
const carouselDots = document.getElementById('carousel-dots');
const noReviewsMessage = document.getElementById('no-reviews-message');

let currentSlide = 0;
let totalSlides = 0;
let opiniones = [];
let ultimoEnvio = 0;
const COOLDOWN_MS = 10000;

document.addEventListener('DOMContentLoaded', async () => {
    await cargarOpinionesDesdeSupabase();
    initCarousel();
});

reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const ahora = Date.now();
    if (ahora - ultimoEnvio < COOLDOWN_MS) {
        const segundosRestantes = Math.ceil((COOLDOWN_MS - (ahora - ultimoEnvio)) / 1000);
        alert(`Por favor espera ${segundosRestantes} segundos antes de enviar otro comentario.`);
        return;
    }

    const nombre = document.getElementById('review-name').value;
    const comentario = document.getElementById('review-text').value;

    if (nombre && comentario) {
        const btnSubmit = reviewForm.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit.textContent;
        btnSubmit.textContent = 'Enviando...';
        btnSubmit.disabled = true;

        const resultado = await window.SupabaseOpiniones.insertarOpinion({
            nombre: nombre,
            comentario: comentario
        });

        btnSubmit.textContent = textoOriginal;
        btnSubmit.disabled = false;

        if (resultado.success) {
            ultimoEnvio = Date.now();
            reviewForm.reset();
            alert('¡Gracias por tu comentario! Se ha publicado correctamente.');
            await cargarOpinionesDesdeSupabase();
            initCarousel();
        } else {
            alert(resultado.error);
        }
    }
});

// Cargar opiniones desde Supabase
async function cargarOpinionesDesdeSupabase() {
    try {
        opiniones = await window.SupabaseOpiniones.obtenerOpiniones(20);
        
        reviewsContainer.innerHTML = '';
        
        if (opiniones.length === 0) {
            noReviewsMessage.classList.remove('hidden');
            carouselPrev.classList.add('hidden');
            carouselNext.classList.add('hidden');
            return;
        }
        
        noReviewsMessage.classList.add('hidden');
        
        opiniones.forEach(opinion => {
            agregarOpinionAlDOM(opinion);
        });
        
    } catch (e) {
    }
}

// Agregar opinión al DOM con diseño de tarjeta para carrusel
function agregarOpinionAlDOM(opinion) {
    const div = document.createElement('div');
    div.className = 'carousel-card flex-shrink-0 bg-white p-5 rounded-xl shadow-md';
    
    const estrellas = window.SupabaseOpiniones.generarEstrellas();
    const nombreSeguro = window.SupabaseOpiniones.escaparHTML(opinion.nombre);
    const comentarioSeguro = window.SupabaseOpiniones.escaparHTML(opinion.comentario);
    
    div.innerHTML = `
        <div class="flex items-center mb-3 text-yellow-400">
            ${estrellas}
        </div>
        <p class="text-gray-600 italic mb-4 line-clamp-4">"${comentarioSeguro}"</p>
        <p class="font-bold text-brand-primary truncate">- ${nombreSeguro}</p>
    `;
    reviewsContainer.appendChild(div);
}

// Obtener número de tarjetas visibles según el ancho de pantalla
function getVisibleCards() {
    const width = window.innerWidth;
    if (width < 640) return 1;      // Móvil
    if (width < 1024) return 2;     // Tablet
    return 3;                        // Desktop
}

// Calcular y aplicar ancho de tarjetas
function calcularAnchoTarjetas() {
    const containerWidth = reviewsContainer.parentElement.offsetWidth;
    const gap = 16;
    const visible = getVisibleCards();
    const cardWidth = (containerWidth - (gap * (visible - 1))) / visible;
    
    const cards = reviewsContainer.querySelectorAll('.carousel-card');
    cards.forEach(card => {
        card.style.width = `${cardWidth}px`;
    });
    
    return cardWidth;
}

// Inicializar carrusel
function initCarousel() {
    const cards = reviewsContainer.querySelectorAll('.carousel-card');
    totalSlides = cards.length;
    
    if (totalSlides === 0) {
        carouselPrev.style.display = 'none';
        carouselNext.style.display = 'none';
        return;
    }
    
    calcularAnchoTarjetas();
    
    const visible = getVisibleCards();
    const maxSlide = Math.max(0, totalSlides - visible);
    
    // Mostrar/ocultar botones según cantidad de opiniones
    if (totalSlides <= visible) {
        carouselPrev.style.display = 'none';
        carouselNext.style.display = 'none';
        reviewsContainer.style.justifyContent = 'center';
    } else {
        carouselPrev.style.display = 'flex';
        carouselNext.style.display = 'flex';
        reviewsContainer.style.justifyContent = 'flex-start';
    }
    
    // Generar dots
    generateDots();
    
    // Ir al inicio
    currentSlide = 0;
    updateCarousel();
}

// Actualizar posición del carrusel
function updateCarousel() {
    const cardWidth = calcularAnchoTarjetas();
    const gap = 16;
    const offset = currentSlide * (cardWidth + gap);
    reviewsContainer.style.transform = `translateX(-${offset}px)`;
    
    const visible = getVisibleCards();
    const maxSlide = Math.max(0, totalSlides - visible);
    
    // Actualizar dots
    const dots = carouselDots.querySelectorAll('button');
    dots.forEach((dot, i) => {
        if (i === currentSlide) {
            dot.classList.remove('bg-gray-300');
            dot.classList.add('bg-brand-primary');
        } else {
            dot.classList.remove('bg-brand-primary');
            dot.classList.add('bg-gray-300');
        }
    });
    
    // Actualizar estado de botones
    carouselPrev.classList.toggle('opacity-40', currentSlide === 0);
    carouselPrev.classList.toggle('cursor-not-allowed', currentSlide === 0);
    carouselNext.classList.toggle('opacity-40', currentSlide >= maxSlide);
    carouselNext.classList.toggle('cursor-not-allowed', currentSlide >= maxSlide);
}

// Generar dots de navegación
function generateDots() {
    carouselDots.innerHTML = '';
    const visible = getVisibleCards();
    const numDots = Math.max(1, totalSlides - visible + 1);
    
    for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('button');
        dot.className = `w-2.5 h-2.5 rounded-full transition-colors ${i === 0 ? 'bg-brand-primary' : 'bg-gray-300'}`;
        dot.addEventListener('click', () => {
            currentSlide = i;
            updateCarousel();
        });
        carouselDots.appendChild(dot);
    }
}

// Event listeners para botones del carrusel
carouselPrev.addEventListener('click', () => {
    if (currentSlide > 0) {
        currentSlide--;
        updateCarousel();
    }
});

carouselNext.addEventListener('click', () => {
    const visible = getVisibleCards();
    const maxSlide = Math.max(0, totalSlides - visible);
    if (currentSlide < maxSlide) {
        currentSlide++;
        updateCarousel();
    }
});

// Actualizar carrusel al cambiar tamaño de ventana
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const visible = getVisibleCards();
        const maxSlide = Math.max(0, totalSlides - visible);
        if (currentSlide > maxSlide) {
            currentSlide = maxSlide;
        }
        initCarousel();
    }, 150);
});

// Touch/Swipe para móvil
let touchStartX = 0;
let touchEndX = 0;

reviewsContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

reviewsContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    const visible = getVisibleCards();
    const maxSlide = Math.max(0, totalSlides - visible);
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentSlide < maxSlide) {
            currentSlide++;
            updateCarousel();
        } else if (diff < 0 && currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    }
}

// 4. Animaciones al hacer Scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in-up').forEach(el => {
    observer.observe(el);
});

// 5. Navbar efecto scroll (adaptado para responsive)
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    const navInner = nav.querySelector('div > div'); // El div con las clases de altura
    
    if (window.scrollY > 50) {
        nav.classList.add('shadow-lg');
        // Reducir altura en scroll
        navInner.classList.remove('h-16', 'sm:h-20', 'md:h-24');
        navInner.classList.add('h-14', 'sm:h-16', 'md:h-18');
    } else {
        nav.classList.remove('shadow-lg');
        // Restaurar altura original
        navInner.classList.remove('h-14', 'sm:h-16', 'md:h-18');
        navInner.classList.add('h-16', 'sm:h-20', 'md:h-24');
    }
});