/* ============================================================
   ADMIN.JS - GESTIÓN TOTAL G&D STYLE
   ============================================================ */
if (typeof window.DB_NAME === 'undefined') window.DB_NAME = 'gyd_posts_admin';

let editandoID = null; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificación de Seguridad
    const sesionIniciada = sessionStorage.getItem('gd_admin_session') === 'true';
    if (!sesionIniciada) {
        window.location.href = "index.html";
        return; 
    }
    
    // 2. Eventos de Formulario
    const form = document.getElementById('formPublicar');
    if (form) form.addEventListener('submit', gestionarEnvio);
    
    // 3. Cargar lista de productos en la pestaña de inventario
    actualizarListaControlAdmin();

    // 4. Lógica para detectar si venimos desde el index.html para editar
    const urlParams = new URLSearchParams(window.location.search);
    const idARecibir = urlParams.get('edit');
    if (idARecibir) {
        // Un pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => prepararEdicion(idARecibir), 300);
    }
});

/* ============================================================
   CONTROL DE PESTAÑAS (TABS)
   ============================================================ */
window.switchTab = function(tabId) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    // Quitar estado activo de botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar pestaña seleccionada y activar su botón
    document.getElementById(tabId).style.display = 'block';
    const btnId = tabId === 'tab-publicar' ? 'btn-tab-publicar' : 'btn-tab-lista';
    document.getElementById(btnId).classList.add('active');
};

/* ============================================================
   GESTIÓN DE PRODUCTOS
   ============================================================ */
function gestionarEnvio(e) {
    e.preventDefault();
    if (editandoID) {
        actualizarProducto();
    } else {
        crearNuevoProducto();
    }
}

function crearNuevoProducto() {
    const fotoInput = document.getElementById('foto');
    if (!fotoInput.files[0]) return alert("Por favor, selecciona una foto para el producto.");

    const reader = new FileReader();
    reader.onload = (e) => {
        const nuevo = construirObjetoProducto(e.target.result);
        const db = JSON.parse(localStorage.getItem(window.DB_NAME)) || [];
        db.unshift(nuevo);
        finalizarOperacion(db, "✅ ¡Producto Publicado con éxito!");
    };
    reader.readAsDataURL(fotoInput.files[0]);
}

function actualizarProducto() {
    let db = JSON.parse(localStorage.getItem(window.DB_NAME)) || [];
    const index = db.findIndex(p => String(p.id) === String(editandoID));
    if (index === -1) return;

    const fotoInput = document.getElementById('foto');
    
    // Si el usuario subió una foto nueva, la procesamos
    if (fotoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            db[index] = construirObjetoProducto(e.target.result, editandoID);
            finalizarOperacion(db, "✅ ¡Cambios guardados correctamente!");
        };
        reader.readAsDataURL(fotoInput.files[0]);
    } else {
        // Si no subió foto nueva, mantenemos la que ya tenía la vista previa
        const imgExistente = document.getElementById('vistaPrevia').src;
        db[index] = construirObjetoProducto(imgExistente, editandoID);
        finalizarOperacion(db, "✅ ¡Cambios guardados correctamente!");
    }
}

function construirObjetoProducto(imgData, idExistente = null) {
    return {
        id: idExistente ? idExistente : Date.now().toString(),
        nombre: document.getElementById('nombre').value.toUpperCase(),
        desc: document.getElementById('descripcion').value,
        precio: document.getElementById('precio').value,
        precioOferta: document.getElementById('precioAnterior').value || null,
        isAgotado: document.getElementById('agotado').checked,
        aroma: document.getElementById('categoria').value,
        img: imgData
    };
}

function finalizarOperacion(db, mensaje) {
    localStorage.setItem(window.DB_NAME, JSON.stringify(db));
    alert(mensaje);
    // Recargamos para limpiar todo y volver al estado inicial
    window.location.href = "admin.html";
}

/* ============================================================
   INTERFAZ DE USUARIO (UI)
   ============================================================ */
function actualizarListaControlAdmin() {
    const lista = document.getElementById('listaProductosAdmin');
    if (!lista) return;
    
    const productos = JSON.parse(localStorage.getItem(window.DB_NAME)) || [];
    
    if (productos.length === 0) {
        lista.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">No hay productos en el inventario.</p>';
        return;
    }

    lista.innerHTML = productos.map(p => {
        // --- LÓGICA DE DIFERENCIACIÓN ---
        let badge = '';
        let estiloCard = '';
        const esOferta = p.precioOferta && parseFloat(p.precioOferta) > parseFloat(p.precio);

        if (p.isAgotado) {
            badge = `<span style="background:#ff4d4d; color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold;">AGOTADO</span>`;
            estiloCard = 'opacity: 0.7; background: #f9f9f9;'; // Se ve un poco opaco
        } else if (esOferta) {
            badge = `<span style="background:#ff9800; color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold;">OFERTA</span>`;
            estiloCard = 'border-left: 4px solid #ff9800;'; // Una línea naranja al lado
        } else {
            badge = `<span style="background:#28a745; color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold;">ACTIVO</span>`;
        }

        return `
        <div class="item-admin" style="display:flex; align-items:center; gap:15px; padding:12px; border-bottom:1px solid #eee; ${estiloCard}">
            <div style="position:relative;">
                <img src="${p.img}" alt="${p.nombre}" style="width:55px; height:55px; object-fit:cover; border-radius:8px;">
            </div>
            
            <div style="flex-grow:1;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <strong style="font-size:0.95rem;">${p.nombre}</strong>
                    ${badge}
                </div>
                <div style="font-size:0.85rem; color:#555;">
                    ${esOferta 
                        ? `<span style="color:#e74c3c; font-weight:bold;">$ ${parseFloat(p.precio).toFixed(2)}</span> <small style="text-decoration:line-through; color:#999;">$ ${parseFloat(p.precioOferta).toFixed(2)}</small>` 
                        : `<span>$ ${parseFloat(p.precio).toFixed(2)}</span>`
                    }
                    <span style="margin-left:10px; color:#888; font-style:italic;">— ${p.aroma}</span>
                </div>
            </div>

            <div style="display:flex; gap:5px;">
                <button class="btn-edit" onclick="prepararEdicion('${p.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="borrarDesdeAdmin('${p.id}')" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

window.prepararEdicion = function(id) {
    const productos = JSON.parse(localStorage.getItem(window.DB_NAME)) || [];
    const p = productos.find(prod => String(prod.id) === String(id));
    if (!p) return;

    // 1. Cambiamos a la pestaña de formulario
    switchTab('tab-publicar');

    // 2. Cargamos los datos en los inputs
    editandoID = id;
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('descripcion').value = p.desc || '';
    document.getElementById('precio').value = p.precio;
    document.getElementById('precioAnterior').value = p.precioOferta || '';
    document.getElementById('agotado').checked = p.isAgotado || false;
    document.getElementById('categoria').value = p.aroma;
    
    // 3. Mostramos la imagen actual
    const vista = document.getElementById('vistaPrevia');
    vista.src = p.img;
    vista.style.display = 'block';

    // 4. Cambiamos la estética del formulario a "Modo Edición"
    document.getElementById('tituloForm').innerHTML = '<i class="fas fa-edit"></i> Editando Producto';
    document.getElementById('cardFormulario').classList.add('edit-mode-active');
    
    const btn = document.getElementById('btnSubmit');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-save"></i> GUARDAR CAMBIOS';
        btn.style.background = '#28a745'; // Color verde para indicar guardado
        btn.style.color = 'white';
    }

    // Mostramos el botón de cancelar
    document.getElementById('btnCancelarEdicion').style.display = 'block';
    
    // Subimos al inicio para que el usuario vea el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.borrarDesdeAdmin = function(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.")) return;
    
    let productos = JSON.parse(localStorage.getItem(window.DB_NAME)) || [];
    productos = productos.filter(p => String(p.id) !== String(id));
    
    localStorage.setItem(window.DB_NAME, JSON.stringify(productos));
    actualizarListaControlAdmin();
};

window.logoutAdmin = function() {
    sessionStorage.removeItem('gd_admin_session');
    window.location.href = "index.html";
};