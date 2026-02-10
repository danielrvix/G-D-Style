/* ============================================================
   1. SEGURIDAD Y CONTROL GLOBAL (FIX REBOTE)
   ============================================================ */
let editandoID = null;

// UNIFICACIÓN: Ahora buscamos en localStorage igual que el Login
if (localStorage.getItem('gd_admin_session') !== 'true') {
    console.log("Acceso no autorizado detectado.");
    window.location.replace('login.html'); // Usamos replace para limpiar el historial
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar lista de inventario
    actualizarListaControlAdmin();

    // --- DETECTAR EDICIÓN DESDE URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const idParaEditar = urlParams.get('edit');
    
    if (idParaEditar) {
        setTimeout(() => {
            window.prepararEdicion(idParaEditar);
        }, 600);
    }

    // --- MANEJO DEL FORMULARIO ---
    const form = document.getElementById('formPublicar');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const imgVal = document.getElementById('vistaPrevia').src;

            if (!imgVal || imgVal === "" || imgVal.includes('window.location')) {
                alert("Por favor, sube una foto del producto.");
                return;
            }

            const productoObj = {
                id: editandoID || Date.now().toString(),
                nombre: document.getElementById('nombre').value,
                desc: document.getElementById('descripcion').value,
                precio: document.getElementById('precio').value,
                precioOferta: document.getElementById('precioAnterior').value || "",
                aroma: document.getElementById('categoria').value,
                isAgotado: document.getElementById('agotado').checked,
                img: imgVal,
                lastUpdate: new Date().getTime()
            };

            const mensajeExito = editandoID ? "¡Producto actualizado con éxito!" : "¡Producto publicado con éxito!";
            finalizarOperacion(productoObj, mensajeExito);
        });
    }

    // Buscador de Inventario
    const inputBusqueda = document.getElementById('busquedaInventario');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', function(e) {
            const termino = e.target.value.toLowerCase();
            document.querySelectorAll('.item-admin').forEach(item => {
                item.style.display = item.innerText.toLowerCase().includes(termino) ? "flex" : "none";
            });
        });
    }
});

/* ============================================================
   2. FUNCIONES DE FIREBASE
   ============================================================ */

function finalizarOperacion(productoObj, mensaje) {
    db.ref('productos/' + productoObj.id).set(productoObj)
        .then(() => {
            alert(mensaje);
            if (window.location.search.includes('edit=')) {
                window.location.href = "admin.html";
            } else {
                resetearFormulario();
                if (typeof switchTab === 'function') switchTab('tab-lista'); 
            }
        })
        .catch(err => alert("Error: " + err.message));
}

function actualizarListaControlAdmin() {
    const contenedor = document.getElementById('listaProductosAdmin');
    if (!contenedor) return;

    db.ref('productos').on('value', (snapshot) => {
        const data = snapshot.val();
        contenedor.innerHTML = "";

        if (!data) {
            contenedor.innerHTML = "<p style='text-align:center;'>No hay productos registrados.</p>";
            return;
        }

        Object.values(data).reverse().forEach(p => {
            const item = document.createElement('div');
            item.className = "item-admin";
            item.innerHTML = `
                <img src="${p.img}" alt="foto">
                <div style="flex-grow:1">
                    <div style="font-weight:bold;">${p.nombre}</div>
                    <div style="font-size:0.8rem; color:#888;">$ ${p.precio} - ${p.aroma}</div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn-edit" onclick="prepararEdicion('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="borrarDesdeAdmin('${p.id}')"><i class="fas fa-trash"></i></button>
                </div>
            `;
            contenedor.appendChild(item);
        });
    });
}

window.borrarDesdeAdmin = function(id) {
    if (confirm("¿Seguro que quieres eliminar este producto?")) {
        db.ref('productos/' + id).remove()
            .then(() => {
                if(editandoID === id) resetearFormulario();
                alert("Eliminado correctamente.");
            });
    }
};

window.prepararEdicion = function(id) {
    db.ref('productos/' + id).once('value').then(snapshot => {
        const p = snapshot.val();
        if (!p) return;

        editandoID = id;
        if (typeof switchTab === 'function') switchTab('tab-publicar');

        document.getElementById('nombre').value = p.nombre || "";
        document.getElementById('descripcion').value = p.desc || "";
        document.getElementById('precio').value = p.precio || "";
        document.getElementById('precioAnterior').value = p.precioOferta || "";
        document.getElementById('categoria').value = p.aroma || "";
        document.getElementById('agotado').checked = p.isAgotado || false;
        
        const vp = document.getElementById('vistaPrevia');
        if (vp) { vp.src = p.img; vp.style.display = 'block'; }

        actualizarInterfazEdicion(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

function resetearFormulario() {
    editandoID = null;
    const form = document.getElementById('formPublicar');
    if (form) form.reset();
    const vp = document.getElementById('vistaPrevia');
    if (vp) { vp.src = ""; vp.style.display = 'none'; }
    actualizarInterfazEdicion(false);
}

function actualizarInterfazEdicion(isEdit) {
    const titulo = document.getElementById('tituloForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnCancelar = document.getElementById('btnCancelarEdicion');

    if (isEdit) {
        if (titulo) titulo.innerText = "Editando Producto";
        if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        if (btnCancelar) btnCancelar.style.display = "block";
    } else {
        if (titulo) titulo.innerText = "Nueva Publicación";
        if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Producto';
        if (btnCancelar) btnCancelar.style.display = "none";
    }
}