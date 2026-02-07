/* ============================================================
   AUTH.JS - Seguridad de G&D Style (Versión Corregida)
   ============================================================ */
const ADMIN_PASS = "DaniGene09"; 

/**
 * Solo verifica si hay sesión y asegura que la interfaz 
 * de administrador sea visible si corresponde.
 */
window.verificarAcceso = function() {
    const sesionActiva = sessionStorage.getItem('gd_admin_session') === 'true';
    const adminTools = document.getElementById('admin-tools');
    
    if (sesionActiva) {
        // Mostramos las herramientas de admin si existen en el HTML
        if (adminTools) adminTools.style.display = 'block';
        
        // NO forzamos parámetros en la URL para evitar romper detalles.html
        // Solo refrescamos los productos si estamos en el index
        if (typeof cargarProductosTienda === 'function' && !window.location.search.includes('id=')) {
            // cargarProductosTienda(); // Opcional: solo si quieres refrescar botones
        }
    }
};

window.loginAdmin = function() {
    const pass = prompt("Introduce la clave de acceso:");
    if (pass === ADMIN_PASS) {
        sessionStorage.setItem('gd_admin_session', 'true');
        alert("🔓 Acceso concedido");
        location.reload(); 
    } else {
        alert("❌ Clave incorrecta");
    }
};

window.logoutAdmin = function() {
    if (confirm("¿Cerrar sesión de administrador?")) {
        sessionStorage.removeItem('gd_admin_session');
        // Redirigimos al index limpio sin parámetros
        window.location.href = "index.html";
        alert("🔒 Sesión cerrada.");
    }
};

// Ejecutar verificación al cargar
document.addEventListener('DOMContentLoaded', verificarAcceso);