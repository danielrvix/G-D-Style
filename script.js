/* ============================================================
   1. CONFIGURACIÓN, MEMORIA Y SELECTORES
   ============================================================ */
const DB_NAME = 'gyd_posts_admin';
const CART_NAME = 'carrito_gyd'; // Unificado para usar un solo nombre de carrito
let carrito = JSON.parse(localStorage.getItem(CART_NAME)) || [];

const cartOverlay = document.getElementById('cartOverlay');
const cartContent = document.getElementById('cartItems'); // Selector corregido para la UI
const totalElement = document.getElementById('cartTotal');
const cartCountElement = document.querySelector('.cart-count');
const sidebar = document.getElementById('sidebar');

// Variables para Lightbox
let zoomScale = 1, rotation = 0, isDragging = false;
let startX, startY, translateX = 0, translateY = 0;
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("imgFull");
const modalWrapper = document.getElementById("modalWrapper");
const imgPrincipal = document.getElementById("mainImage");

// --- HELPERS ---
const limpiarPrecio = (texto) => {
    if (!texto) return 0;
    let limpio = texto.replace('$', '').replace(/\s/g, '').replace(',', '.');
    return parseFloat(limpio) || 0;
};

const formatUSD = (num) => '$ ' + num.toFixed(2).replace('.', ',');

/* ============================================================
   2. INICIALIZACIÓN Y EVENTOS DE INTERFAZ
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    cargarProductosTienda();
    actualizarInterfazCarrito();

    // Eventos de Filtros
    document.getElementById('productSearch')?.addEventListener('input', filtrarProductos);
    document.getElementById('priceRange')?.addEventListener('input', filtrarProductos);
    document.querySelectorAll('.filter-check').forEach(cb => cb.addEventListener('change', filtrarProductos));

    if (window.location.pathname.includes('detalles.html')) cargarDetallesProducto();
});

// Cierre Global de Modales
window.addEventListener('click', (e) => {
    if (e.target === modal || e.target === modalWrapper || e.target.closest('.close-modal')) cerrarModalImagen();
    if (e.target === cartOverlay || e.target.closest('#closeCart')) cerrarCarrito();
    if (sidebar?.classList.contains('active') && !sidebar.contains(e.target) && !e.target.closest('#openFilters')) cerrarFiltros();
    if (e.target.closest('#openCartFloat')) {
        cartOverlay.style.display = 'flex';
        document.body.classList.add('no-scroll');
    }
});

const cerrarCarrito = () => { cartOverlay.style.display = 'none'; document.body.classList.remove('no-scroll'); };
const cerrarFiltros = () => { sidebar?.classList.remove('active'); document.body.classList.remove('no-scroll'); };
const cerrarModalImagen = () => { if (modal) { modal.style.display = "none"; resetTransform(); document.body.classList.remove('no-scroll'); } };

/* ============================================================
   3. CARGA DE PRODUCTOS (ADMIN + RENDER)
   ============================================================ */
function cargarProductosTienda() {
    const contenedor = document.getElementById('productsGrid');
    if (!contenedor) return;
    
    // 1. Limpieza inicial
    contenedor.innerHTML = ''; 

    // 2. Verificamos si somos Admin por la URL para mostrar u ocultar el botón de borrar
    const params = new URLSearchParams(window.location.search);
    const isAdmin = params.get('admin') === 'true';

    // 3. Obtenemos los productos (Usamos DB_NAME que es tu variable del Admin)
    const productosGuardados = JSON.parse(localStorage.getItem(DB_NAME)) || [];

    productosGuardados.forEach(p => {
        const precioFormateado = parseFloat(p.precio).toFixed(2).replace('.', ',');
        const aromaTag = (p.aroma || p.cat || 'ninguno').toLowerCase();
        const colorTag = (p.color || 'ninguno').toLowerCase();

        // --- LÓGICA DEL BOTÓN BORRAR ---
        // Si es admin, mostramos el botón. Si no, queda vacío.
        const botonBorrarAdmin = isAdmin 
            ? `<button onclick="borrarProducto(${p.id})" style="margin-left:auto; background:#ff4d4d; border:none; color:white; cursor:pointer; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <i class="fas fa-trash"></i>
               </button>`
            : '';

        const cardHTML = `
            <div class="product-card" data-aroma="${aromaTag}" data-color="${colorTag}" id="post-${p.id}" style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 20px; background: #fff;">
                
                <div class="card-header" style="display:flex; align-items:center; padding:10px;">
                    <img src="img/logo.jpeg" style="width:35px; height:35px; border-radius:50%; margin-right:10px;">
                    <div>
                        <strong style="display:block; font-size:0.9rem;">G&D Style</strong>
                        <small style="color:gray; font-size:0.7rem;">Publicado · <i class="fas fa-globe-americas"></i></small>
                    </div>
                    ${botonBorrarAdmin} </div>

                <a href="detalles.html?id=${p.id}" style="text-decoration:none; color:inherit;">
                    <div class="img-container">
                        <div class="img-box" style="background-image: url('${p.img}'); height:250px; background-size:cover; background-position:center;"></div>
                    </div>
                    <div class="card-body" style="padding:15px;">
                        <h4 style="margin:0; text-transform:uppercase;">${p.nombre}</h4>
                        <p style="font-size:0.85rem; color:#444; white-space: pre-wrap; margin: 10px 0;">${p.desc}</p>
                        <p class="price" style="font-weight:bold; color:#2c3136; font-size: 1.2rem;">$ ${precioFormateado}</p>
                    </div>
                </a>

                <div style="padding:0 15px 15px 15px;">
                    <button class="add-btn" style="width:100%; padding:12px; border-radius:5px; background:#f8b4b4; border:none; font-weight:bold; cursor:pointer;" onclick="agregarAlCarritoSimple('${p.id}')">
                        <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                    </button>
                </div>
            </div>`;

        contenedor.insertAdjacentHTML('beforeend', cardHTML);
    });
}

/* ============================================================
   4. FILTRADO PRO
   ============================================================ */
function filtrarProductos() {
    const textoBusqueda = document.getElementById('productSearch')?.value.toLowerCase().trim() || "";
    const precioMaximo = parseFloat(document.getElementById('priceRange')?.value) || 0;
    
    // 1. Capturamos los aromas marcados
    const aromasSeleccionados = Array.from(document.querySelectorAll('.filter-check:checked'))
                                     .map(cb => cb.value.toLowerCase().trim());

    // 2. Actualizamos el texto del precio en la interfaz si existe
    const labelPrecio = document.getElementById('currentMaxLabel');
    if (labelPrecio) labelPrecio.innerText = `$ ${precioMaximo}`;

    // 3. Revisamos cada tarjeta
    document.querySelectorAll('.product-card').forEach(card => {
        // Extraer nombre
        const nombre = card.querySelector('h4')?.innerText.toLowerCase() || "";
        
        // Extraer precio y limpiarlo (quitando $, espacios y cambiando coma por punto)
        const precioTexto = card.querySelector('.price')?.innerText || "0";
        const precioLimpio = parseFloat(precioTexto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        
        // Extraer aroma del atributo data-aroma
        const aromaDoc = (card.getAttribute('data-aroma') || "").toLowerCase().trim();

        // LOGICA DE FILTRADO (Las 3 deben ser true)
        const coincideNombre = nombre.includes(textoBusqueda);
        const coincidePrecio = precioLimpio <= precioMaximo;
        
        // Si no hay filtros seleccionados, mostramos todos. 
        // Si hay filtros, el aroma del producto debe estar en la lista.
        const coincideAroma = aromasSeleccionados.length === 0 || aromasSeleccionados.includes(aromaDoc);

        // DEBUG: Descomenta la linea de abajo si sigue fallando para ver el error en consola
        // console.log(`Producto: ${nombre} | Aroma: ${aromaDoc} | Coincide: ${coincideAroma}`);

        if (coincideNombre && coincidePrecio && coincideAroma) {
            card.style.display = ""; // Volver a mostrar
            card.style.opacity = "1";
        } else {
            card.style.display = "none"; // Ocultar
        }
    });
}

/* ============================================================
   5. LÓGICA DEL CARRITO
   ============================================================ */
function agregarAlCarritoSimple(id) {
    const productos = JSON.parse(localStorage.getItem(DB_NAME)) || [];
    const p = productos.find(item => item.id == id);
    if (p) ejecutarAgregarCarrito(p, 1);
}

function ejecutarAgregarCarrito(producto, cantidad) {
    const index = carrito.findIndex(item => item.id === producto.id);
    if (index !== -1) {
        carrito[index].cantidad += parseInt(cantidad);
    } else {
        carrito.push({ ...producto, cantidad: parseInt(cantidad) });
    }
    localStorage.setItem(CART_NAME, JSON.stringify(carrito));
    actualizarInterfazCarrito();
    cartOverlay.style.display = 'flex';
}

window.actualizarInterfazCarrito = function() {
    const carritoReal = JSON.parse(localStorage.getItem('carrito_gyd')) || [];
    const cartContent = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    const cartCountElement = document.querySelector('.cart-count');

    if (!cartContent) return;
    cartContent.innerHTML = '';
    let total = 0;
    
    // Calcular unidades totales para la burbuja
    const unidades = carritoReal.reduce((sum, item) => sum + item.cantidad, 0);
    if (cartCountElement) {
        cartCountElement.innerText = unidades;
        cartCountElement.style.display = unidades > 0 ? 'flex' : 'none';
    }

    if (carritoReal.length === 0) {
        cartContent.innerHTML = `<p style="text-align:center; padding:20px; color:#999;">Tu carrito está vacío</p>`;
    } else {
        carritoReal.forEach((item, i) => {
            const sub = parseFloat(item.precio) * item.cantidad;
            total += sub;

            // ELIMINAMOS LA RESTRICCIÓN DE ADMIN AQUÍ:
            // Ahora cualquier usuario verá la "X" para borrar
            const botonEliminar = `<button onclick="eliminarItem(${i})" style="color:#ff4d4d; background:none; border:none; cursor:pointer; font-size:1.4rem; padding: 5px; font-weight:bold;">&times;</button>`;

            cartContent.insertAdjacentHTML('beforeend', `
                <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <a href="detalles.html?id=${item.id}" style="display:flex; align-items:center; text-decoration:none; color:inherit; gap:12px; flex-grow: 1;">
                        <div style="width:50px; height:50px; background-image:url('${item.img}'); background-size:cover; background-position:center; border-radius:5px; border:1px solid #eee; flex-shrink:0;"></div>
                        <div>
                            <strong style="display:block; font-size:0.85rem; line-height:1.2;">${item.nombre}</strong>
                            <small style="color: #666;">${item.cantidad} x $ ${parseFloat(item.precio).toFixed(2).replace('.', ',')}</small>
                        </div>
                    </a>

                    <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
                        <span style="font-weight:bold; font-size:0.9rem;">$ ${sub.toFixed(2).replace('.', ',')}</span>
                        ${botonEliminar}
                    </div>
                </div>`);
        });
    }
    
    if (totalElement) totalElement.innerText = `$ ${total.toFixed(2).replace('.', ',')}`;
};

window.eliminarItem = (index) => {
    carrito.splice(index, 1);
    localStorage.setItem(CART_NAME, JSON.stringify(carrito));
    actualizarInterfazCarrito();
};

/* ============================================================
   6. CHECKOUT WHATSAPP
   ============================================================ */
const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
    checkoutBtn.onclick = () => {
        if (carrito.length === 0) return alert("Carrito vacío");
        let msg = " *NUEVO PEDIDO - GyD Store* \n\n";
        carrito.forEach(item => msg += `• *${item.cantidad}x* ${item.nombre} - ${formatUSD(item.precio * item.cantidad)}\n`);
        const total = carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
        msg += `\n*TOTAL: ${formatUSD(total)}*`;
        window.open(`https://wa.me/584121927683?text=${encodeURIComponent(msg)}`, '_blank');
        carrito = []; localStorage.removeItem(CART_NAME);
        actualizarInterfazCarrito(); cerrarCarrito();
    };
}

/* ============================================================
   7. ADMIN Y OTROS
   ============================================================ */
window.borrarProducto = function(id) {
    if (confirm("¿Eliminar producto?")) {
        let productos = JSON.parse(localStorage.getItem(DB_NAME)) || [];
        productos = productos.filter(p => p.id != id);
        localStorage.setItem(DB_NAME, JSON.stringify(productos));
        document.getElementById(`post-${id}`)?.remove();
    }
};

window.toggleFilter = function(id) {
    const lista = document.getElementById(id);
    if (lista) lista.style.display = (lista.style.display === "none" || lista.style.display === "") ? "block" : "none";
};

function resetTransform() {
    zoomScale = 1; rotation = 0; translateX = 0; translateY = 0;
    if (modalImg) modalImg.style.transform = `translate(0,0) scale(1) rotate(0deg)`;
}

window.devReset = function() {
    // 1. Confirmación para evitar accidentes
    if (confirm("¿Deseas vaciar por completo tu carrito de compras?")) {
        
        // 2. Limpiar solo la memoria del carrito
        localStorage.removeItem('carrito_gyd');
        
        // 3. Sincronizar la variable global (si la usas)
        if (typeof carrito !== 'undefined') {
            carrito = [];
        }

        // 4. Actualizar la interfaz inmediatamente
        if (typeof actualizarInterfazCarrito === 'function') {
            actualizarInterfazCarrito();
        }

        // 5. Opcional: Cerrar el carrito si estaba abierto
        if (typeof cerrarCarrito === 'function') {
            cerrarCarrito();
        }

        console.log("Carrito vaciado con éxito.");
        
        // No es estrictamente necesario recargar la página ahora que 
        // la interfaz se actualiza sola, lo que lo hace más fluido.
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const isAdmin = params.get('admin');

    // Si el parámetro admin es 'true', mostramos el botón
    if (isAdmin === 'true') {
        const adminSection = document.getElementById('admin-tools');
        if (adminSection) {
            adminSection.style.display = 'block';
            console.log("Modo Administrador activado: Herramientas visibles.");
        }
    }
});