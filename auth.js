/* ============================================================
   AUTH.JS - Seguridad de G&D Style (Versión Persistente)
   ============================================================ */
const ADMIN_PASS = "DaniGene09"; 

window.verificarAcceso = function() {
    // CAMBIO CLAVE: Usamos localStorage en lugar de sessionStorage
    const isAdmin = localStorage.getItem('gd_admin_session') === 'true';
    const adminTools = document.getElementById('admin-tools');
    const adminFooter = document.getElementById('admin-tools-footer'); // ID que tienes en el footer de tu index
    
    if (isAdmin) {
        // Si es admin, mostramos las herramientas en el menú
        if (adminTools) {
            adminTools.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #f8b4b4; font-size: 0.8rem;">✨ Modo Admin</span>
                    <button onclick="logoutAdmin()" class="btn-logout-small" style="background:none; border:none; color:#ff4d4d; cursor:pointer; text-decoration:underline; font-size:0.7rem;">Salir</button>
                </div>
            `;
            adminTools.style.display = 'block';
        }
        // También mostramos el panel del footer si existe
        if (footerTools) {
            footerTools.style.display = 'block';
        }
    } else {
        // Si NO es admin, mostramos el botón de Iniciar Sesión
        if (adminTools) {
            adminTools.innerHTML = `
                <button onclick="loginAdmin()" class="btn-login-nav" style="background:#f8b4b4; color:white; border:none; padding:5px 15px; border-radius:15px; cursor:pointer; font-weight:bold; font-size:0.8rem;">
                    <i class="fas fa-lock"></i> Entrar
                </button>
            `;
            adminTools.style.display = 'block';
        }
    }
};

window.loginAdmin = function() {
    const pass = prompt("Introduce la clave de acceso para G&D Style:");
    if (pass === ADMIN_PASS) {
        // CAMBIO CLAVE: Guardamos en localStorage para que no se borre al cerrar el navegador
        localStorage.setItem('gd_admin_session', 'true');
        alert("🔓 Acceso concedido, Daniel");
        location.reload(); 
    } else if (pass !== null) { // Si no canceló el prompt
        alert("❌ Clave incorrecta");
    }
};

window.logoutAdmin = function() {
    if (confirm("¿Seguro que deseas cerrar sesión?")) {
        // Limpiamos localStorage
        localStorage.removeItem('gd_admin_session');
        localStorage.removeItem('gd_user_session');
        
        // Redirección limpia para evitar que vuelvan atrás con el botón del navegador
        const timestamp = new Date().getTime();
        window.location.replace('index.html?logout=' + timestamp);
    }
};

// Ejecutar verificación al cargar
document.addEventListener('DOMContentLoaded', verificarAcceso);
