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
    // 1. Detección de página y carga inicial
    const esPaginaTienda = document.getElementById('productsGrid') !== null;
    const esPaginaDetalles = window.location.pathname.includes('detalles.html');

    if (esPaginaTienda) cargarProductosTienda();
    actualizarInterfazCarrito();

    // 2. Gestión de Herramientas de Usuario/Admin (Estética G&D)
    const adminTools = document.getElementById('admin-tools');

    if (adminTools) {
        const isAdmin = sessionStorage.getItem('gd_admin_session') === 'true';
        const isUser = sessionStorage.getItem('gd_user_session') === 'true';

        if (isAdmin) {
            adminTools.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <a href="admin.html" class="btn-nav-auth admin-highlight">
                        <i class="fas fa-tools"></i> PANEL ADMIN
                    </a>
                    <button onclick="logoutUniversal()" class="btn-logout-icon" title="Cerrar Sesión">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>`;
        } else if (isUser) {
            adminTools.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <a href="perfil.html" class="btn-nav-auth user"><i class="fas fa-user-circle"></i> PERFIL</a>
                    <button onclick="logoutUniversal()" class="btn-logout-icon" title="Cerrar Sesión">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>`;
        } else {
            adminTools.innerHTML = `<a href="login.html" class="btn-nav-auth"><i class="fas fa-lock"></i> ENTRAR</a>`;
        }

        // Inyección de Estilos Dinámicos
        if (!document.getElementById('nav-auth-styles')) {
            const style = document.createElement('style');
            style.id = 'nav-auth-styles';
            style.innerHTML = `
                .btn-nav-auth {
                    display: flex; align-items: center; gap: 5px; padding: 4px 12px;
                    border-radius: 20px; font-size: 0.7rem; font-weight: bold;
                    text-decoration: none; text-transform: uppercase; transition: 0.3s;
                    border: 1px solid #f8b4b4; color: #f8b4b4; background: rgba(248, 180, 180, 0.05);
                }
                .btn-nav-auth:hover { background: #f8b4b4; color: #2c3136; }
                .btn-nav-auth.admin-highlight { background: #2c3136; color: #f8b4b4; border-color: #f8b4b4; }
                .btn-logout-icon { background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; transition: 0.3s; padding: 5px; }
                .btn-logout-icon:hover { transform: scale(1.1); }
                .btn-reset-cart { width: 100%; background: none; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 8px; border-radius: 8px; font-size: 0.75rem; font-weight: bold; cursor: pointer; margin-top: 10px; transition: 0.3s; }
                .btn-reset-cart:hover { background: #ff4d4d; color: white; }
                @media (max-width: 600px) { .btn-nav-auth { padding: 4px 8px; font-size: 0.6rem; } }
            `;
            document.head.appendChild(style);
        }
    }

    /* ============================================================
       3. INTERACCIÓN MÓVIL (MENÚ Y FILTROS)
       ============================================================ */
    const sidebar = document.getElementById('sidebar');
    const btnOpenFilters = document.getElementById('openFilters');
    const btnCloseFilters = document.getElementById('closeFilters');

    // Menú Tres Rayitas
    if (menuToggle && navLinks) {
        menuToggle.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            navLinks.classList.toggle('active');
        };
    }

    // Botón Abrir Filtros
    if (btnOpenFilters && sidebar) {
        btnOpenFilters.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            sidebar.classList.add('active');
        };
    }

    // Botón Cerrar Filtros
    if (btnCloseFilters && sidebar) {
        btnCloseFilters.onclick = (e) => {
            e.preventDefault();
            sidebar.classList.remove('active');
        };
    }

    /* ============================================================
       4. LÓGICA DE FILTROS EN VIVO (CON FIX DE PRECIO 0)
       ============================================================ */
    const productSearch = document.getElementById('productSearch');
    const priceRange = document.getElementById('priceRange');
    const currentMaxLabel = document.getElementById('currentMaxLabel');

    // Buscador de texto
    productSearch?.addEventListener('input', filtrarProductos);

    // Rango de precio con actualización de etiqueta y filtrado inmediato
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (currentMaxLabel) currentMaxLabel.innerText = `$ ${val}`;
            filtrarProductos(); // Dispara el filtro mientras mueves el slider
        });
    }

    // Checkboxes de categorías
    document.querySelectorAll('.filter-check').forEach(cb => {
        cb.addEventListener('change', filtrarProductos);
    });

    /* ============================================================
       5. EVENTOS DE CARRITO Y CIERRE GLOBAL
       ============================================================ */
    // Botón para resetear carrito
    document.getElementById('btnVaciarCarrito')?.addEventListener('click', () => {
        if (confirm("¿Seguro que quieres vaciar todo el carrito?")) {
            localStorage.removeItem(window.CART_NAME);
            actualizarInterfazCarrito();
        }
    });

    document.getElementById('openCartFloat')?.addEventListener('click', () => {
        if(cartOverlay) cartOverlay.style.display = 'flex';
    });
    
    document.getElementById('closeCart')?.addEventListener('click', () => {
        if(cartOverlay) cartOverlay.style.display = 'none';
    });

    // Cierre al hacer clic fuera de cualquier panel (Overlay dinámico)
    window.addEventListener('click', (e) => {
        if (e.target === cartOverlay) cartOverlay.style.display = 'none';
        
        if (navLinks?.classList.contains('active') && !navLinks.contains(e.target) && e.target !== menuToggle) {
            navLinks.classList.remove('active');
        }
        
        if (sidebar?.classList.contains('active') && !sidebar.contains(e.target) && e.target !== btnOpenFilters) {
            sidebar.classList.remove('active');
        }
    });
});
// Función auxiliar para categorías (el toggle que tienes en el aside)
function toggleFilter(id) {
    const opts = document.getElementById(id);
    if (opts) {
        opts.style.display = opts.style.display === 'none' ? 'block' : 'none';
    }
}

window.verificarAcceso = function() {
    const isAdmin = localStorage.getItem('gd_admin_session') === 'true';
    const adminTools = document.getElementById('admin-tools');

    if (adminTools) {
        if (isAdmin) {
            adminTools.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="color:#f8b4b4; font-size:0.8rem;">Hola, Daniel</span>
                    <button onclick="logoutUniversal()" class="btn-logout-icon">
                        <i class="fas fa-sign-out-alt"></i> Salir
                    </button>
                </div>`;
        } else {
            adminTools.innerHTML = `<button onclick="loginAdmin()" class="btn-nav-auth"><i class="fas fa-lock"></i> ENTRAR</button>`;
        }
    }
};

window.loginAdmin = function() {
    const pass = prompt("Introduce la clave:");
    if (pass === "DaniGene09") {
        // GUARDADO PERSISTENTE
        localStorage.setItem('gd_admin_session', 'true');
        location.reload();
    } else if (pass !== null) {
        alert("Clave incorrecta");
    }
};

/* ============================================================
   FUNCIÓN GLOBAL DE LOGOUT
   ============================================================ */
window.logoutUniversal = function() {
    if (confirm("¿Cerrar sesión?")) {
        // Borramos en AMBOS sitios para no dejar rastro
        localStorage.removeItem('gd_admin_session');
        localStorage.removeItem('gd_user_session');
        sessionStorage.removeItem('gd_admin_session');
        sessionStorage.removeItem('gd_user_session');
        
        // Limpieza total
        sessionStorage.clear();
        
        // Redirigir forzando recarga limpia
        window.location.href = 'index.html?v=' + Date.now();
    }
};

const cerrarCarrito = () => { if(cartOverlay) cartOverlay.style.display = 'none'; };

/* ============================================================
   3. CARGA DE PRODUCTOS (FIREBASE REAL-TIME)
   ============================================================ */
function cargarProductosTienda() {
    const contenedor = document.getElementById('productsGrid');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
            <i class="fas fa-circle-notch fa-spin" style="font-size: 2rem; color: #f8b4b4;"></i>
            <p>Cargando productos...</p>
        </div>`;

    const esAdmin = sessionStorage.getItem('gd_admin_session') === 'true';

    db.ref('productos').on('value', (snapshot) => {
        const data = snapshot.val();
        contenedor.innerHTML = ''; 

        if (!data) {
            contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay productos disponibles por ahora.</p>';
            return;
        }

        const listaProductos = Object.values(data).reverse();

        listaProductos.forEach(p => {
            const precioActual = parseFloat(p.precio) || 0;
            const precioViejo = parseFloat(p.precioOferta) || 0;
            const esOferta = precioViejo > precioActual;
            const precioFormateado = precioActual.toFixed(2);
            const precioViejoFormateado = precioViejo.toFixed(2);

            const card = `
                <div class="product-card" ${p.isAgotado ? 'style="filter: grayscale(0.8); opacity: 0.8;"' : ''} 
                     data-category="${(p.aroma || '').toLowerCase()}" data-price="${precioActual}">
                    
                    ${esAdmin ? `
                        <div class="admin-card-header">
                            <div class="shop-info">
                                <div class="shop-logo-mini"></div>
                                <span>G&D Style</span>
                            </div>
                            <div class="admin-btn-group">
                                <button class="btn-admin-action btn-admin-edit" onclick="irAEditar('${p.id}')" title="Editar">
                                    <i class="fas fa-pencil-alt"></i>
                                </button>
                                <button class="btn-admin-action btn-admin-delete" onclick="borrarDesdeTiendaDirecto('${p.id}')" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    ${esOferta && !p.isAgotado ? '<span class="badge-oferta">OFERTA</span>' : ''}
                    ${p.isAgotado ? '<span class="badge-agotado">AGOTADO</span>' : ''}
                    
                    <div class="product-img-container" onclick="location.href='detalles.html?id=${p.id}'">
                        <img src="${p.img}" alt="${p.nombre}" class="product-img">
                    </div>
                    
                    <div class="product-info">
                        <span class="product-category">${p.aroma || 'Colección'}</span>
                        <h3 class="product-title">${p.nombre}</h3>
                        
                        <div class="product-price-row">
                            <div class="prices">
                                ${esOferta ? `<span class="old-price">$ ${precioViejoFormateado}</span>` : ''}
                                <span class="current-price">$ ${precioFormateado}</span>
                            </div>
                        </div>

                        ${!p.isAgotado ? `
                            <button class="add-to-cart-btn" onclick="agregarAlCarritoRapido('${p.id}', '${p.nombre}', ${precioActual}, '${p.img}')">
                                <i class="fas fa-shopping-basket"></i> AGREGAR
                            </button>
                        ` : `
                            <button class="add-to-cart-btn" disabled style="background: #ccc; cursor: not-allowed;">
                                AGOTADO
                            </button>
                        `}
                    </div>
                </div>
            `;
            contenedor.insertAdjacentHTML('beforeend', card);
        });
    });
}

/* ============================================================
   4. GESTIÓN DEL CARRITO
   ============================================================ */
window.agregarAlCarritoRapido = function(id, nombre, precio, img) {
    let carrito = JSON.parse(localStorage.getItem(window.CART_NAME)) || [];
    const index = carrito.findIndex(item => String(item.id) === String(id));

    if (index !== -1) {
        carrito[index].cantidad++;
    } else {
        carrito.push({ id: String(id), nombre, precio: parseFloat(precio), img, cantidad: 1 });
    }

    localStorage.setItem(window.CART_NAME, JSON.stringify(carrito));
    actualizarInterfazCarrito();
    
    // Abrir carrito automáticamente al agregar
    if(cartOverlay) cartOverlay.style.display = 'flex';
};

window.actualizarInterfazCarrito = function() {
    const cart = JSON.parse(localStorage.getItem(window.CART_NAME)) || [];
    if (!cartContent) return;
    
    cartContent.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartContent.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Tu carrito está vacío</p>';
    } else {
        cart.forEach((item, i) => {
            const precioNum = parseFloat(item.precio) || 0;
            const subtotal = precioNum * item.cantidad;
            total += subtotal;

            // Mantenemos EXACTAMENTE tu estructura y estilos anteriores
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
                            ${item.cantidad} x $ ${precioNum.toFixed(2).replace('.', ',')}
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
/* ============================================================
   FUNCIÓN DE FILTRADO (OPTIMIZADA PARA PRECIO 0)
   ============================================================ */
function filtrarProductos() {
    // 1. Capturamos los valores de los inputs
    const busqueda = document.getElementById('productSearch')?.value.toLowerCase() || '';
    
    // Captura el valor del slider. Si no existe, por defecto mostramos hasta 1000
    const maxP = parseFloat(document.getElementById('priceRange')?.value);
    
    // 2. Capturamos categorías seleccionadas
    const checkboxes = document.querySelectorAll('.filter-check:checked');
    const categoriasSeleccionadas = Array.from(checkboxes).map(cb => cb.value.toLowerCase());

    // 3. Iteramos sobre cada tarjeta de producto
    document.querySelectorAll('.product-card').forEach(card => {
        // Extraemos datos de la tarjeta
        const nombre = card.querySelector('.product-title')?.innerText.toLowerCase() || '';
        const precio = parseFloat(card.getAttribute('data-price')) || 0;
        const categoriaCard = (card.getAttribute('data-category') || '').toLowerCase();

        // LÓGICA DE VALIDACIÓN
        // Filtro de texto: ¿El nombre incluye lo buscado?
        const cumpleNombre = nombre.includes(busqueda);
        
        // Filtro de precio: ¿El precio es menor o IGUAL al máximo del slider?
        // Si el slider es 0 y el precio es 1, esto da FALSE y se oculta.
        const cumplePrecio = precio <= maxP;
        
        // Filtro de categoría: ¿No hay nada marcado o la categoría coincide?
        const cumpleCategoria = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(categoriaCard);

        // 4. Aplicamos el resultado visual
        if (cumpleNombre && cumplePrecio && cumpleCategoria) {
            card.style.display = ''; // Muestra (estética original)
        } else {
            card.style.display = 'none'; // Oculta
        }
    });
}

/* ============================================================
   6. FUNCIONES DE ADMINISTRADOR (PUENTE)
   ============================================================ */
window.irAEditar = function(id) {
    window.location.href = `admin.html?edit=${id}`;
};

window.borrarDesdeTiendaDirecto = function(id) {
    if (confirm("¿Seguro que deseas eliminar este producto permanentemente de la nube?")) {
        db.ref('productos/' + id).remove()
            .then(() => alert("Producto eliminado con éxito."))
            .catch(err => alert("Error: " + err.message));
    }
};

/* ============================================================
   7. FINALIZAR COMPRA
   ============================================================ */
window.finalizarCompra = function() {
    const cart = JSON.parse(localStorage.getItem(window.CART_NAME)) || [];
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    const telefono = "584121927683";
    let mensaje = "¡Hola G&D Style! ✨ Pedido solicitado:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `*${index + 1}. ${item.nombre}*\nCant: ${item.cantidad} - $ ${subtotal.toFixed(2)}\n\n`;
    });

    mensaje += `*TOTAL: $ ${total.toFixed(2)}*`;

    localStorage.removeItem(window.CART_NAME);
    actualizarInterfazCarrito();
    cerrarCarrito();

    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
};

// Sidebar utilidades
window.toggleFilter = function(id) {
    const opts = document.getElementById(id);
    const span = opts.previousElementSibling.querySelector('span');
    opts.style.display = (opts.style.display === 'none' || opts.style.display === '') ? 'block' : 'none';
    span.innerText = opts.style.display === 'block' ? '-' : '+';
};
