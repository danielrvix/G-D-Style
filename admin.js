/* ============================================================
   1. SEGURIDAD Y CONTROL GLOBAL
   ============================================================ */
let editandoID = null;

// Bloqueo de acceso no autorizado
if (localStorage.getItem('gd_admin_session') !== 'true') {
    window.location.replace('login.html');
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarListaControlAdmin();

    // --- DETECTAR EDICIÓN DESDE URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const idParaEditar = urlParams.get('edit');
    if (idParaEditar) {
        setTimeout(() => prepararEdicion(idParaEditar), 600);
    }

    // --- MANEJO DEL FORMULARIO ---
    const form = document.getElementById('formPublicar');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const btnSubmit = document.getElementById('btnSubmit');
            const originalHTML = btnSubmit.innerHTML;

            // 1. Validar imagen
            const imgVal = document.getElementById('vistaPrevia').src;
            if (!imgVal || imgVal === "" || imgVal.includes('window.location')) {
                alert("Por favor, sube una foto del producto.");
                return;
            }

            // 2. Feedback visual de carga
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizando imagen...';

            try {
                // 3. OPTIMIZACIÓN: Comprimir imagen antes de subir
                const imgOptimizada = await optimizarImagen(imgVal);

                const productoObj = {
                    id: editandoID || Date.now().toString(),
                    nombre: document.getElementById('nombre').value.trim(),
                    desc: document.getElementById('descripcion').value.trim(),
                    precio: document.getElementById('precio').value,
                    precioOferta: document.getElementById('precioAnterior').value || "",
                    aroma: document.getElementById('categoria').value,
                    isAgotado: document.getElementById('agotado').checked,
                    img: imgOptimizada,
                    lastUpdate: new Date().getTime()
                };

                const mensajeExito = editandoID ? "¡Producto actualizado!" : "¡Producto publicado!";
                finalizarOperacion(productoObj, mensajeExito);
                
            } catch (error) {
                alert("Error al procesar la imagen.");
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalHTML;
            }
        });
    }

    // --- BUSCADOR DE INVENTARIO (CON DEBOUNCE) ---
    const inputBusqueda = document.getElementById('busquedaInventario');
    let timerBusqueda;
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', function(e) {
            clearTimeout(timerBusqueda);
            timerBusqueda = setTimeout(() => {
                const termino = e.target.value.toLowerCase();
                document.querySelectorAll('.item-admin').forEach(item => {
                    item.style.display = item.innerText.toLowerCase().includes(termino) ? "flex" : "none";
                });
            }, 300);
        });
    }
});

/* ============================================================
   2. FUNCIONES DE OPTIMIZACIÓN (MAGIA DE VELOCIDAD)
   ============================================================ */

async function optimizarImagen(base64Str) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Tamaño estándar para web móvil
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertimos a JPEG con 70% de calidad para ahorrar espacio
            resolve(canvas.toDataURL('image/jpeg', 0.3));
        };
    });
}

/* ============================================================
   3. OPERACIONES DE FIREBASE
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
        .catch(err => alert("Error: " + err.message))
        .finally(() => {
            const btnSubmit = document.getElementById('btnSubmit');
            if(btnSubmit) btnSubmit.disabled = false;
        });
}

function actualizarListaControlAdmin() {
    const contenedor = document.getElementById('listaProductosAdmin');
    if (!contenedor) return;

    // Cambiado a .on para ver cambios en tiempo real
    db.ref('productos').on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            contenedor.innerHTML = "<p style='text-align:center;'>No hay productos registrados.</p>";
            return;
        }

        // Construir todo el HTML en una variable para inyectar una sola vez (más rápido)
        let htmlFinal = "";
        Object.values(data).reverse().forEach(p => {
            htmlFinal += `
                <div class="item-admin">
                    <img src="${p.img}" alt="foto" loading="lazy">
                    <div style="flex-grow:1">
                        <div style="font-weight:bold;">${p.nombre}</div>
                        <div style="font-size:0.8rem; color:#888;">$ ${p.precio} - ${p.aroma}</div>
                        ${p.isAgotado ? '<span style="color:red; font-size:0.7rem; font-weight:bold;">AGOTADO</span>' : ''}
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-edit" onclick="prepararEdicion('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="borrarDesdeAdmin('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
        });
        contenedor.innerHTML = htmlFinal;
    });
}

window.borrarDesdeAdmin = function(id) {
    if (confirm("¿Seguro que quieres eliminar este producto?")) {
        db.ref('productos/' + id).remove().then(() => {
            if(editandoID === id) resetearFormulario();
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

/* ============================================================
   4. UTILIDADES DE INTERFAZ
   ============================================================ */

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
        if (titulo) titulo.innerHTML = '<i class="fas fa-edit"></i> Editando Producto';
        if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        if (btnCancelar) btnCancelar.style.display = "block";
    } else {
        if (titulo) titulo.innerHTML = '<i class="fas fa-magic"></i> Nueva Publicación';
        if (btnSubmit) btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Producto';
        if (btnCancelar) btnCancelar.style.display = "none";
    }
}

document.getElementById('btnCancelarEdicion')?.addEventListener('click', resetearFormulario);