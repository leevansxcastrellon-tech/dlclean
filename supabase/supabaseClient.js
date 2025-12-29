let supabaseClient;

function inicializarSupabase() {
    if (typeof supabase === 'undefined' || !window.SUPABASE_CONFIG) {
        return false;
    }
    
    try {
        supabaseClient = supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.anonKey
        );
        return true;
    } catch (e) {
        return false;
    }
}

async function obtenerOpiniones(limite = 50) {
    try {
        const { data, error } = await supabaseClient
            .from(window.TABLA_OPINIONES)
            .select('id,nombre,comentario,created_at')
            .order('created_at', { ascending: false })
            .limit(limite);
        
        if (error) return [];
        return data;
    } catch (e) {
        return [];
    }
}

async function insertarOpinion(opinion) {
    try {
        const nombre = sanitizarTexto(opinion.nombre);
        const comentario = sanitizarTexto(opinion.comentario);
        
        const nombreSinEspacios = nombre.replace(/\s/g, '');
        const comentarioSinEspacios = comentario.replace(/\s/g, '');
        
        if (!nombreSinEspacios || nombreSinEspacios.length < 2) {
            return { success: false, error: 'El nombre debe tener al menos 2 caracteres' };
        }
        
        if (!comentarioSinEspacios || comentarioSinEspacios.length < 5) {
            return { success: false, error: 'El comentario debe tener al menos 5 caracteres' };
        }
        
        if (nombre.length > 100) {
            return { success: false, error: 'El nombre es demasiado largo' };
        }
        
        if (comentario.length > 3000) {
            return { success: false, error: 'El comentario es demasiado largo (máximo 3000 caracteres)' };
        }
        
        const { data, error } = await supabaseClient
            .from(window.TABLA_OPINIONES)
            .insert([{ nombre, comentario }])
            .select('id,nombre,comentario,created_at');
        
        if (error) {
            return { success: false, error: 'Error al guardar. Intenta de nuevo.' };
        }
        
        return { success: true, data: data[0] };
    } catch (e) {
        return { success: false, error: 'Error inesperado.' };
    }
}

function sanitizarTexto(texto) {
    if (!texto || typeof texto !== 'string') return '';
    return texto
        .trim()
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
}

function escaparHTML(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function formatearFecha(fecha) {
    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });
    } catch (e) {
        return '';
    }
}

function generarEstrellas() {
    return '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>';
}

window.SupabaseOpiniones = {
    inicializar: inicializarSupabase,
    obtenerOpiniones,
    insertarOpinion,
    formatearFecha,
    generarEstrellas,
    escaparHTML
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSupabase);
} else {
    inicializarSupabase();
}
