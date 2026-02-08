// 1. VARIABLE GLOBAL DE CONTROL
let editandoID = null;

// BLOQUEO DE SEGURIDAD
if (sessionStorage.getItem('gd_admin_session') !== 'true') {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar lista de inventario
    actualizarListaControlAdmin();

    // --- NUEVA LÓGICA: DETECTAR EDICIÓN DESDE URL ---
    // Esto permite que el botón "Editar" de la tienda funcione al redirigir
    const urlParams = new URLSearchParams(window.location.search);
    const idParaEditar = urlParams.get('edit');
    
    if (idParaEditar) {
        // Pequeño delay para asegurar que Firebase esté listo
        setTimeout(() => {
            window.prepararEdicion(idParaEditar);
        }, 500);
    }

    // 2. MANEJO DEL FORMULARIO (SUBMIT)
    const form = document.getElementById('formPublicar');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // CAPTURA DE DATOS
            const nombreVal = document.getElementById('nombre').value;
            const descVal = document.getElementById('descripcion').value;
            const precioVal = document.getElementById('precio').value;
            const precioAntVal = document.getElementById('precioAnterior').value || "";
            const catVal = document.getElementById('categoria').value;
            const agotadoVal = document.getElementById('agotado').checked;
            const imgVal = document.getElementById('vistaPrevia').src;

            // Validación de imagen
            if (!imgVal || imgVal.includes('window.location') || imgVal === "") {
                alert("Por favor, sube una foto del producto.");
                return;
            }

            const productoObj = {
                id: editandoID || Date.now().toString(), // Mantiene el ID si es edición
                nombre: nombreVal,
                desc: descVal,
                precio: precioVal,
                precioOferta: precioAntVal,
                aroma: catVal,
                isAgotado: agotadoVal,
                img: imgVal,
                lastUpdate: new Date().getTime() // Marca de tiempo opcional
            };

            const mensajeExito = editandoID ? "¡Producto actualizado con éxito!" : "¡Producto publicado con éxito!";
            
            finalizarOperacion(productoObj, mensajeExito);
        });
    }

    // Manejo del botón cancelar (si existe en tu HTML)
    const btnCancelar = document.getElementById('btnCancelarEdicion');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            resetearFormulario();
        });
    }
});

/* ============================================================
   FUNCIONES PRINCIPALES
   ============================================================ */

// GUARDAR EN FIREBASE
function finalizarOperacion(productoObj, mensaje) {
    const ref = db.ref('productos/' + productoObj.id);

    ref.set(productoObj)
        .then(() => {
            alert(mensaje);
            // Si veníamos de una URL de edición, limpiamos la URL
            if (window.location.search.includes('edit=')) {
                window.location.href = "admin.html";
            } else {
                resetearFormulario();
                if (typeof switchTab === 'function') switchTab('tab-lista'); 
            }
        })
        .catch(error => {
            console.error("Error en Firebase:", error);
            alert("Error al guardar: " + error.message);
        });
}

// LISTAR PRODUCTOS EN EL PANEL
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

// BORRAR PRODUCTO
window.borrarDesdeAdmin = function(id) {
    if (confirm("¿Seguro que quieres eliminar este producto de la nube?")) {
        db.ref('productos/' + id).remove()
            .then(() => {
                if(editandoID === id) resetearFormulario();
                alert("Eliminado correctamente.");
            })
            .catch(err => alert("Error: " + err.message));
    }
};

// PREPARAR EDICIÓN (LLENAR FORMULARIO)
window.prepararEdicion = function(id) {
    db.ref('productos/' + id).once('value').then(snapshot => {
        const p = snapshot.val();
        if (!p) return;

        editandoID = id;
        
        // Cambiar a la pestaña de formulario si usas el sistema de tabs
        if (typeof switchTab === 'function') switchTab('tab-publicar');

        // Llenar inputs del HTML
        document.getElementById('nombre').value = p.nombre || "";
        document.getElementById('descripcion').value = p.desc || "";
        document.getElementById('precio').value = p.precio || "";
        document.getElementById('precioAnterior').value = p.precioOferta || "";
        document.getElementById('categoria').value = p.aroma || "";
        document.getElementById('agotado').checked = p.isAgotado || false;
        
        const vp = document.getElementById('vistaPrevia');
        if (vp) {
            vp.src = p.img;
            vp.style.display = 'block';
        }

        // Cambiar Interfaz a modo edición
        actualizarInterfazEdicion(true);
        
        // Scroll suave al formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

// RESETEAR FORMULARIO (VOLVER A MODO CREAR)
function resetearFormulario() {
    editandoID = null;
    const form = document.getElementById('formPublicar');
    if (form) form.reset();
    
    const vp = document.getElementById('vistaPrevia');
    if (vp) {
        vp.src = "";
        vp.style.display = 'none';
    }

    actualizarInterfazEdicion(false);
}

// CAMBIOS VISUALES SEGÚN MODO
function actualizarInterfazEdicion(isEdit) {
    const titulo = document.getElementById('tituloForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnCancelar = document.getElementById('btnCancelarEdicion');
    const card = document.getElementById('cardFormulario');

    if (isEdit) {
        if (titulo) titulo.innerText = "Editando Producto";
        if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        if (btnCancelar) btnCancelar.style.display = "block";
        if (card) card.classList.add('edit-mode-active');
    } else {
        if (titulo) titulo.innerText = "Nueva Publicación";
        if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Producto';
        if (btnCancelar) btnCancelar.style.display = "none";
        if (card) card.classList.remove('edit-mode-active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ... tu código anterior ...

    const inputBusqueda = document.getElementById('busquedaInventario');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', function(e) {
            const termino = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.item-admin');

            items.forEach(item => {
                // Obtenemos el texto del nombre y la categoría/precio que pusiste en el innerHTML
                const textoContenido = item.innerText.toLowerCase();
                
                if (textoContenido.includes(termino)) {
                    item.style.display = "flex"; // Se muestra
                } else {
                    item.style.display = "none"; // Se oculta
                }
            });
        });
    }
});