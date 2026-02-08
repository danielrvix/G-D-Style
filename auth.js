/* ============================================================
   AUTH.JS - Seguridad de G&D Style
   ============================================================ */
const ADMIN_PASS = "DaniGene09"; 

window.verificarAcceso = function() {
    const isAdmin = sessionStorage.getItem('gd_admin_session') === 'true';
    const isUser = sessionStorage.getItem('gd_user_session') === 'true';
    const adminTools = document.getElementById('admin-tools');
    
    // Si hay alguna sesión activa, mostramos el contenedor de herramientas
    if ((isAdmin || isUser) && adminTools) {
        adminTools.style.display = 'block';
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

// LA FUNCIÓN CLAVE CORREGIDA


function ejecutarSalidaFinal() {
    // Añadimos un parámetro aleatorio (?v=...) para obligar al navegador 
    // a cargar la página desde cero y no desde el historial/caché.
    const timestamp = new Date().getTime();
    window.location.replace('index.html?logout=' + timestamp);
}

// Función auxiliar para redirigir con limpieza de historial
function finalizarSalida() {
    // Usamos replace para que no puedan volver atrás con el botón del navegador
    window.location.replace('index.html');
}

// Ejecutar verificación al cargar
document.addEventListener('DOMContentLoaded', verificarAcceso);