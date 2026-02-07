/* ============================================================
   1. CONFIGURACIÓN GLOBAL Y MEMORIA
   ============================================================ */
if (typeof window.DB_NAME === 'undefined') window.DB_NAME = 'gyd_posts_admin';
if (typeof window.CART_NAME === 'undefined') window.CART_NAME = 'carrito_gyd';

const cartOverlay = document.getElementById('cartOverlay');
const cartContent = document.getElementById('cartItems');
const totalElement = document.getElementById('cartTotal');
const cartCountElement = document.querySelector('.cart-count');
const navLinks = document.getElementById('navLinks');
const menuToggle = document.getElementById('menuToggle');

// Formato de moneda: $ 10,00
const formatUSD = (num) => '$ ' + num.toFixed(2).replace('.', ',');

/* ============================================================
   2. INICIALIZACIÓN Y EVENTOS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Detectamos en qué página estamos
    const esPaginaTienda = document.getElementById('productsGrid') !== null;
    const esPaginaDetalles = window.location.pathname.includes('detalles.html');

    if (esPaginaTienda) cargarProductosTienda();
    if (esPaginaDetalles) cargarDetallesProducto();

    actualizarInterfazCarrito();

    // Mostrar herramientas de Admin si hay sesión
    const isAdmin = sessionStorage.getItem('gd_admin_session') === 'true';
    if (isAdmin && document.getElementById('admin-tools')) {
        document.getElementById('admin-tools').style.display = 'block';
    }

    // Menú Responsive
    if (menuToggle && navLinks) {
        menuToggle.onclick = (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
        };
    }

    // Cerrar elementos al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === cartOverlay) cerrarCarrito();
        if (navLinks?.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuToggle) {
            navLinks.classList.remove('active');
        }
    });

    // Eventos de Filtros
    document.getElementById('productSearch')?.addEventListener('input', filtrarProductos);
    document.getElementById('priceRange')?.addEventListener('input', filtrarProductos);
    document.querySelectorAll('.filter-check').forEach(cb => cb.addEventListener('change', filtrarProductos));

    // Carrito
    document.getElementById('openCartFloat')?.addEventListener('click', () => {
        if(cartOverlay) cartOverlay.style.display = 'flex';
    });
    document.getElementById('closeCart')?.addEventListener('click', cerrarCarrito);
});

const cerrarCarrito = () => { if(cartOverlay) cartOverlay.style.display = 'none'; };

/* ============================================================
   3. CARGA DE PRODUCTOS (GRID PRINCIPAL)
   ============================================================ */
function cargarProductosTienda() {
    const contenedor = document.getElementById('productsGrid');
    if (!contenedor) return;
    
    contenedor.innerHTML = ''; 
    const isAdmin = sessionStorage.getItem('gd_admin_session') === 'true';
    const productos = JSON.parse(localStorage.getItem(window.DB_NAME)) || [];

    if (productos.length === 0) {
        contenedor.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px; color: #999;">No hay productos disponibles.</p>`;
        return;
    }

    productos.forEach(p => {
        const precioF = parseFloat(p.precio).toFixed(2).replace('.', ',');
        const aroma = (p.aroma || 'otros').toLowerCase();
        
        let htmlPrecio = `<p class="item-price" data-raw="${p.precio}" style="font-weight:bold; font-size:1.3rem; margin:5px 0; color:#2c3136;">$ ${precioF}</p>`;
        let labelOferta = '';
        
        if (p.precioOferta && parseFloat(p.precioOferta) > parseFloat(p.precio)) {
            const precioViejo = parseFloat(p.precioOferta).toFixed(2).replace('.', ',');
            labelOferta = `<span style="position:absolute; top:10px; left:10px; background:#e74c3c; color:white; padding:4px 8px; border-radius:4px; font-size:0.7rem; font-weight:bold; z-index:10;">OFERTA</span>`;
            htmlPrecio = `
                <div style="margin:5px 0;">
                    <span class="item-price" data-raw="${p.precio}" style="font-weight:bold; font-size:1.3rem; color:#e74c3c;">$ ${precioF}</span>
                    <span style="text-decoration:line-through; color:#999; font-size:0.9rem; margin-left:8px;">$ ${precioViejo}</span>
                </div>`;
        }

        let botonesAdmin = '';
        if (isAdmin) {
            botonesAdmin = `
                <div style="display: flex; gap: 8px; margin-left: auto;">
                    <a href="admin.html?edit=${p.id}" style="background:#007bff; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; text-decoration:none; font-size:0.8rem;"><i class="fas fa-edit"></i></a>
                    <button onclick="window.borrarDesdeAdmin('${p.id}')" style="background:#ff4d4d; border:none; color:white; width:30px; height:30px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:0.8rem;"><i class="fas fa-trash"></i></button>
                </div>`;
        }

        let opacidadAgotado = p.isAgotado ? 'filter: grayscale(0.8); opacity: 0.7;' : '';
        let btnCarrito = p.isAgotado 
            ? `<button disabled style="width:100%; padding:12px; background:#ccc; color:#666; border:none; border-radius:8px; font-weight:bold;">AGOTADO</button>`
            : `<button class="add-btn" onclick="agregarAlCarritoSimple('${p.id}')" style="width:100%; padding:12px; background:#f8b4b4; border:none; border-radius:8px; font-weight:bold; cursor:pointer;"><i class="fas fa-shopping-cart"></i> Agregar</button>`;

        const card = `
            <div class="product-card" data-category="${aroma}" id="post-${p.id}" style="border:1px solid #eee; border-radius:12px; background:#fff; position:relative; overflow:hidden; margin-bottom:20px; ${opacidadAgotado}">
                ${labelOferta}
                <div class="card-header" style="display:flex; align-items:center; padding:12px; border-bottom:1px solid #f9f9f9;">
                    <img src="img/logo.jpeg" style="width:30px; height:30px; border-radius:50%;" onerror="this.src='https://via.placeholder.com/30'">
                    <div style="flex-grow:1; margin-left:10px;"><strong style="font-size:0.85rem;">G&D Style</strong></div>
                    ${botonesAdmin}
                </div>
                <a href="detalles.html?id=${p.id}" style="text-decoration:none; color:inherit; display:block;">
                    <div style="background-image:url('${p.img}'); height:280px; background-size:cover; background-position:center;"></div>
                    <div style="padding:15px;">
                        <h4 style="margin:0; font-size:1rem; text-transform:uppercase; letter-spacing:1px;">${p.nombre}</h4>
                        ${htmlPrecio}
                    </div>
                </a>
                <div style="padding:0 15px 15px;">${btnCarrito}</div>
            </div>`;
        contenedor.insertAdjacentHTML('beforeend', card);
    });
}

/* ============================================================
   4. GESTIÓN DEL CARRITO
   ============================================================ */
function agregarAlCarritoSimple(id) {
    const productos = JSON.parse(localStorage.getItem(window.DB_NAME)) || [];
    const p = productos.find(item => String(item.id) === String(id));
    if (!p) return;

    let cart = JSON.parse(localStorage.getItem(window.CART_NAME)) || [];
    const index = cart.findIndex(item => String(item.id) === String(id));

    if (index !== -1) {
        cart[index].cantidad++;
    } else {
        cart.push({...p, cantidad: 1});
    }

    localStorage.setItem(window.CART_NAME, JSON.stringify(cart));
    actualizarInterfazCarrito();
    if(cartOverlay) cartOverlay.style.display = 'flex';
}

window.actualizarInterfazCarrito = function() {
    const cart = JSON.parse(localStorage.getItem(window.CART_NAME)) || [];
    if (!cartContent) return;
    
    cartContent.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartContent.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Tu carrito está vacío</p>';
    } else {
        cart.forEach((item, i) => {
            const subtotal = parseFloat(item.precio) * item.cantidad;
            total += subtotal;

            cartContent.insertAdjacentHTML('beforeend', `
                <div class="cart-item" style="display:flex; align-items:center; gap:12px; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
                    <a href="detalles.html?id=${item.id}" style="display:block;">
                        <img src="${item.img}" style="width:60px; height:60px; border-radius:8px; object-fit:cover; border:1px solid #eee;">
                    </a>
                    
                    <div style="flex-grow:1;">
                        <a href="detalles.html?id=${item.id}" style="text-decoration:none; color:inherit;">
                            <div style="font-weight:bold; font-size:0.9rem; line-height:1.2;">${item.nombre}</div>
                        </a>
                        <div style="font-size:0.8rem; color:#666; margin-top:4px;">
                            ${item.cantidad} x $ ${parseFloat(item.precio).toFixed(2)}
                        </div>
                    </div>

                    <button onclick="eliminarItem(${i})" style="color:#ff4d4d; background:#fff0f0; border:none; width:30px; height:30px; border-radius:50%; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center;">
                        <i class="fas fa-trash-alt" style="font-size:0.8rem;"></i>
                    </button>
                </div>
            `);
        });
    }

    if (totalElement) totalElement.innerText = formatUSD(total);
    
    const unidades = cart.reduce((s, i) => s + i.cantidad, 0);
    if (cartCountElement) {
        cartCountElement.innerText = unidades;
        cartCountElement.style.display = unidades > 0 ? 'flex' : 'none';
    }
};

window.eliminarItem = (index) => {
    let cart = JSON.parse(localStorage.getItem(window.CART_NAME)) || [];
    cart.splice(index, 1);
    localStorage.setItem(window.CART_NAME, JSON.stringify(cart));
    actualizarInterfazCarrito();
};

/* ============================================================
   5. FILTROS DE BÚSQUEDA
   ============================================================ */
function filtrarProductos() {
    const busqueda = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const maxP = parseFloat(document.getElementById('priceRange')?.value) || 0;
    
    const checkboxes = document.querySelectorAll('.filter-check:checked');
    const categoriasSeleccionadas = Array.from(checkboxes).map(cb => cb.value.toLowerCase());

    if(document.getElementById('currentMaxLabel')) {
        document.getElementById('currentMaxLabel').innerText = `$ ${maxP}`;
    }

    document.querySelectorAll('.product-card').forEach(card => {
        const nombre = card.querySelector('h4')?.innerText.toLowerCase() || '';
        const precioElem = card.querySelector('.item-price');
        const precio = precioElem ? parseFloat(precioElem.getAttribute('data-raw')) : 0;
        const categoriaCard = card.getAttribute('data-category') || '';

        const cumpleNombre = nombre.includes(busqueda);
        const cumplePrecio = precio <= maxP;
        const cumpleCategoria = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(categoriaCard);

        card.style.display = (cumpleNombre && cumplePrecio && cumpleCategoria) ? '' : 'none';
    });
}

/* ============================================================
   6. FUNCIONES DE ADMINISTRADOR
   ============================================================ */
window.borrarDesdeAdmin = function(id) {
    if (sessionStorage.getItem('gd_admin_session') !== 'true') return;
    if (!confirm("¿Seguro que deseas eliminar este producto permanentEMente?")) return;
    
    let productos = JSON.parse(localStorage.getItem(window.DB_NAME)) || [];
    productos = productos.filter(p => String(p.id) !== String(id));
    localStorage.setItem(window.DB_NAME, JSON.stringify(productos));
    
    // Si estamos en la tienda, recargamos el grid
    if (document.getElementById('productsGrid')) {
        cargarProductosTienda();
    } else {
        window.location.href = "index.html";
    }
};

/* ============================================================
   7. UTILIDADES (SIDEBAR / SCROLL)
   ============================================================ */
window.toggleFilter = function(id) {
    const opts = document.getElementById(id);
    const span = opts.previousElementSibling.querySelector('span');
    if (opts.style.display === 'none' || opts.style.display === '') {
        opts.style.display = 'block';
        span.innerText = '-';
    } else {
        opts.style.display = 'none';
        span.innerText = '+';
    }
};

document.getElementById('openFilters')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('active');
});

document.getElementById('closeFilters')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('active');
});

const backToTopBtn = document.getElementById('backToTop');
window.onscroll = function() {
    if (backToTopBtn) {
        backToTopBtn.style.display = (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) ? "block" : "none";
    }
};

if (backToTopBtn) {
    backToTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Función global para el botón de reset del área de Staff
window.devReset = function() {
    // Verificamos si hay algo que borrar para no trabajar en vano
    const carritoActual = localStorage.getItem('carrito_gyd');
    
    if (!carritoActual || JSON.parse(carritoActual).length === 0) {
        alert("El carrito ya está vacío.");
        return;
    }

    if (confirm("🛠️ MODO STAFF: ¿Deseas vaciar por completo el carrito de compras?")) {
        // Borramos la base de datos del carrito
        localStorage.removeItem('carrito_gyd');
        
        // Forzamos la actualización de la interfaz
        if (typeof actualizarInterfazCarrito === "function") {
            actualizarInterfazCarrito();
        }
        
        // Feedback visual
        console.log("Sistema: Carrito reseteado con éxito.");
        alert("Carrito vaciado correctamente.");
        
        // Cerramos el panel del carrito si estuviera abierto
        const overlay = document.getElementById('cartOverlay');
        if(overlay) overlay.style.display = 'none';
    }
};

/* ==========================================
   CERRAR FILTROS AL TOCAR FUERA (MÓVIL)
   ========================================== */
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('openFilters');
    
    // Si el sidebar está activo (clase 'active')
    if (sidebar && sidebar.classList.contains('active')) {
        
        // Verificamos si el clic NO fue dentro del sidebar Y NO fue en el botón de abrir
        // Esto evita que el menú se cierre y se abra al mismo tiempo
        if (!sidebar.contains(e.target) && !openBtn.contains(e.target)) {
            sidebar.classList.remove('active');
            
            // Si usas un overlay oscuro de fondo, también lo ocultamos aquí
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) overlay.classList.remove('active');
            
            console.log("Filtros cerrados al tocar fuera por Gemini IA");
        }
    }
});

/* ============================================================
   8. FINALIZAR COMPRA (ENVÍO A WHATSAPP)
   ============================================================ */
window.finalizarCompra = function() {
    const cart = JSON.parse(localStorage.getItem(window.CART_NAME)) || [];
    
    if (cart.length === 0) {
        alert("Tu carrito está vacío, Gemini IA.");
        return;
    }

    const telefono = "584121927683";
    let mensaje = "¡Hola G&D Style! ✨ Quisiera realizar el siguiente pedido:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const precioItem = parseFloat(item.precio);
        const subtotal = precioItem * item.cantidad;
        total += subtotal;
        mensaje += `*${index + 1}. ${item.nombre}*\n`;
        mensaje += `   Cant: ${item.cantidad} x $ ${precioItem.toFixed(2).replace('.', ',')}\n\n`;
    });

    mensaje += `*TOTAL A PAGAR: $ ${total.toFixed(2).replace('.', ',')}*`;

    // --- AQUÍ ESTÁ EL TRUCO ---
    // 1. Borramos el carrito de la memoria
    localStorage.removeItem(window.CART_NAME);
    
    // 2. Actualizamos la visual para que salga "Carrito vacío" y el contador sea 0
    actualizarInterfazCarrito();
    
    // 3. Cerramos el panel del carrito
    cerrarCarrito();

    // 4. Enviamos al cliente a WhatsApp
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
};
