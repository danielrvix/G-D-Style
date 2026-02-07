/* ============================================================
   1. CONFIGURACIÓN GLOBAL Y MEMORIA
   ============================================================ */
// El carrito es privado de cada usuario (LocalStorage)
if (typeof window.CART_NAME === 'undefined') window.CART_NAME = 'carrito_gyd';

// La fuente de verdad para todos los dispositivos
const PRODUCTOS_JSON = 'productos.json'; 

const cartOverlay = document.getElementById('cartOverlay');
const cartContent = document.getElementById('cartItems');
const totalElement = document.getElementById('cartTotal');
const cartCountElement = document.querySelector('.cart-count');
const navLinks = document.getElementById('navLinks');
const menuToggle = document.getElementById('menuToggle');

// Formato de moneda: $ 10,00 (Ajustado a tus preferencias)
const formatUSD = (num) => '$ ' + num.toFixed(2).replace('.', ',');

/* ============================================================
   2. INICIALIZACIÓN Y EVENTOS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const esPaginaTienda = document.getElementById('productsGrid') !== null;
    const esPaginaDetalles = window.location.pathname.includes('detalles.html');

    if (esPaginaTienda) cargarProductosTienda();
    
    // cargarDetallesProducto() suele estar en el HTML de detalles.html
    if (esPaginaDetalles && typeof cargarDetallesProducto === 'function') {
        cargarDetallesProducto();
    }

    actualizarInterfazCarrito();

    // Mostrar herramientas de Admin si hay sesión activa
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
   3. CARGA DE PRODUCTOS (GRID PRINCIPAL DESDE JSON)
   ============================================================ */
async function cargarProductosTienda() {
    const contenedor = document.getElementById('productsGrid');
    if (!contenedor) return;
    
    contenedor.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><i class="fas fa-circle-notch fa-spin" style="font-size:2rem; color:#f8b4b4;"></i><p>Sincronizando productos...</p></div>'; 

    try {
        const respuesta = await fetch(PRODUCTOS_JSON);
        if(!respuesta.ok) throw new Error("Error de conexión");
        const productos = await respuesta.json();

        contenedor.innerHTML = ''; 
        const isAdmin = sessionStorage.getItem('gd_admin_session') === 'true';

        if (productos.length === 0) {
            contenedor.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px; color: #999;">No hay productos disponibles actualmente.</p>`;
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

            // BOTONES DE ADMIN (Solo si hay sesión)
            let botonesAdmin = '';
            if (isAdmin) {
                botonesAdmin = `
                    <div style="display: flex; gap: 8px; margin-left: auto;">
                        <button onclick="window.borrarDesdeAdmin('${p.id}')" title="Eliminar producto" style="background:#ff4d4d; border:none; color:white; width:30px; height:30px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:0.8rem;"><i class="fas fa-trash"></i></button>
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
    } catch (e) {
        contenedor.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:red; padding:50px;">Error al cargar productos globales.</p>`;
    }
}

/* ============================================================
   4. GESTIÓN DEL CARRITO
   ============================================================ */
async function agregarAlCarritoSimple(id) {
    try {
        const respuesta = await fetch(PRODUCTOS_JSON);
        const productos = await respuesta.json();
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
    } catch (e) {
        console.error("Error al añadir al carrito:", e);
    }
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
                    <img src="${item.img}" style="width:60px; height:60px; border-radius:8px; object-fit:cover; border:1px solid #eee;">
                    <div style="flex-grow:1;">
                        <div style="font-weight:bold; font-size:0.9rem;">${item.nombre}</div>
                        <div style="font-size:0.8rem; color:#666;">
                            ${item.cantidad} x $ ${parseFloat(item.precio).toFixed(2).replace('.', ',')}
                        </div>
                    </div>
                    <button onclick="eliminarItem(${i})" style="color:#ff4d4d; background:none; border:none; cursor:pointer;">
                        <i class="fas fa-trash-alt"></i>
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
   6. FUNCIONES DE ADMINISTRADOR (BORRADO LÓGICO)
   ============================================================ */
window.borrarDesdeAdmin = async function(id) {
    if (sessionStorage.getItem('gd_admin_session') !== 'true') return;
    
    if (confirm("⚠️ Gemini IA, ¿seguro que quieres eliminar este producto?\n\nPara que desaparezca de GitHub, deberás actualizar tu archivo productos.json con el código que generaré ahora.")) {
        
        try {
            const respuesta = await fetch(PRODUCTOS_JSON);
            let productos = await respuesta.json();

            // Filtramos el producto
            productos = productos.filter(p => String(p.id) !== String(id));

            // Mostramos el nuevo JSON en consola
            console.log("%c NUEVO JSON PARA GITHUB: ", "background: #222; color: #bada55; font-size: 1.2rem;");
            console.log(JSON.stringify(productos, null, 2));

            alert("Producto ocultado localmente. Revisa la Consola (F12) para copiar el nuevo código JSON y pegarlo en GitHub.");
            
            // Ocultar de la vista actual
            const card = document.getElementById(`post-${id}`);
            if (card) card.style.display = 'none';

        } catch (e) {
            alert("No se pudo procesar la solicitud.");
        }
    }
};

/* ============================================================
   7. FINALIZAR COMPRA (ENVÍO A WHATSAPP)
   ============================================================ */
window.finalizarCompra = function() {
    const cart = JSON.parse(localStorage.getItem(window.CART_NAME)) || [];
    if (cart.length === 0) return alert("Tu carrito está vacío.");

    const telefono = "584121927683";
    let mensaje = "¡Hola G&D Style! ✨ Quisiera realizar este pedido:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `*${index + 1}. ${item.nombre}*\n`;
        mensaje += `   Cant: ${item.cantidad} x $ ${parseFloat(item.precio).toFixed(2).replace('.', ',')}\n\n`;
    });

    mensaje += `*TOTAL A PAGAR: ${formatUSD(total)}*`;

    localStorage.removeItem(window.CART_NAME);
    actualizarInterfazCarrito();
    cerrarCarrito();

    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
};

/* ============================================================
   8. UTILIDADES Y SCROLL
   ============================================================ */
window.toggleFilter = function(id) {
    const opts = document.getElementById(id);
    if (opts) opts.style.display = (opts.style.display === 'none') ? 'block' : 'none';
};

document.getElementById('openFilters')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.add('active');
});

document.getElementById('closeFilters')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('active');
});

const backToTopBtn = document.getElementById('backToTop');
window.onscroll = function() {
    if (backToTopBtn) {
        backToTopBtn.style.display = (document.documentElement.scrollTop > 300) ? "block" : "none";
    }
};
if (backToTopBtn) {
    backToTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
}
