// ==========================================
// 1. CONFIGURACIÓN, MEMORIA Y SELECTORES
// ==========================================
let carrito = JSON.parse(localStorage.getItem('gyd_carrito')) || [];

const cartOverlay = document.getElementById('cartOverlay');
const cartContent = document.querySelector('.cart-content');
const totalElement = document.getElementById('cartTotal');
const cartCountElement = document.querySelector('.cart-count');

const sidebar = document.getElementById('sidebar');
const navLinks = document.getElementById('navLinks');

let zoomScale = 1;
let rotation = 0;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("imgFull");
const modalWrapper = document.getElementById("modalWrapper");
const imgPrincipal = document.getElementById("mainImage");
const captionText = document.getElementById("caption");

// --- HELPERS ---
const limpiarPrecio = (texto) => {
    if (!texto) return 0;
    let limpio = texto.replace('$', '').replace(/\s/g, '').replace(',', '.');
    return parseFloat(limpio) || 0;
};

const formatUSD = (num) => '$ ' + num.toFixed(2).replace('.', ',');

// ==========================================
// 2. FUNCIONES DE APERTURA Y CIERRE (Mejorado)
// ==========================================

const cerrarCarrito = () => {
    if (cartOverlay) {
        cartOverlay.style.display = 'none';
        document.body.classList.remove('no-scroll');
    }
};

const cerrarModalImagen = () => {
    if (modal) {
        modal.style.display = "none";
        document.body.classList.remove('no-scroll');
        resetTransform(); 
    }
};

const cerrarFiltros = () => {
    sidebar?.classList.remove('active');
    document.body.classList.remove('no-scroll');
};

function resetTransform() {
    zoomScale = 1; rotation = 0; translateX = 0; translateY = 0;
    if (modalImg) modalImg.style.transform = `translate(0,0) scale(1) rotate(0deg)`;
}

// --- ESCUCHADORES GLOBALES PARA CLIC AFUERA ---
// Sustituye tu bloque de window.addEventListener('click') por este:

window.addEventListener('click', (e) => {
    // 1. CERRAR MODAL DE IMAGEN (El botón X o el fondo)
    // Usamos e.target.closest para que si tocan el icono dentro del botón, también cierre
    if (e.target === modal || e.target === modalWrapper || e.target.closest('.close-modal')) {
        cerrarModalImagen();
    }
    
    // 2. CERRAR CARRITO
    if (e.target === cartOverlay || e.target.closest('#closeCart')) {
        cerrarCarrito();
    }
    
    // 3. CERRAR FILTROS (Clic fuera)
    if (sidebar?.classList.contains('active') && !sidebar.contains(e.target) && !e.target.closest('#openFilters')) {
        cerrarFiltros();
    }

    // Apertura del carrito
    if (e.target.closest('#openCartFloat')) {
        cartOverlay.style.display = 'flex';
        document.body.classList.add('no-scroll');
    }
});

// --- CONTROLES DE INTERFAZ ---
document.getElementById('openFilters')?.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita que el clic cierre el sidebar inmediatamente
    sidebar?.classList.add('active');
    document.body.classList.add('no-scroll');
});

document.getElementById('closeFilters')?.addEventListener('click', cerrarFiltros);

document.getElementById('menuToggle')?.addEventListener('click', () => {
    navLinks?.classList.toggle('active');
});

// ==========================================
// 3. LÓGICA DE GALERÍA Y LIGHTBOX
// ==========================================

window.cambiarFoto = function(miniatura) {
    if (!imgPrincipal) return;
    const nuevaImagen = window.getComputedStyle(miniatura).backgroundImage;
    imgPrincipal.style.opacity = '0';
    setTimeout(() => {
        imgPrincipal.style.backgroundImage = nuevaImagen;
        imgPrincipal.style.opacity = '1';
    }, 150);
    document.querySelectorAll('.thumb').forEach(m => m.classList.remove('active-thumb'));
    miniatura.classList.add('active-thumb');
};

if (imgPrincipal) {
    imgPrincipal.onclick = function() {
        if (!modal) return;
        modal.style.display = "flex";
        document.body.classList.add('no-scroll');
        let bgUrl = window.getComputedStyle(this).backgroundImage;
        modalImg.src = bgUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        const nombreProd = document.querySelector(".product-info-aside h1");
        if(nombreProd) captionText.innerText = nombreProd.innerText;
    };
}

function updateTransform() {
    if (modalImg) modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomScale}) rotate(${rotation}deg)`;
}

document.getElementById("zoomIn")?.addEventListener('click', (e) => { e.stopPropagation(); zoomScale += 0.2; updateTransform(); });
document.getElementById("zoomOut")?.addEventListener('click', (e) => { e.stopPropagation(); if(zoomScale > 0.5) zoomScale -= 0.2; updateTransform(); });
document.getElementById("rotateImg")?.addEventListener('click', (e) => { e.stopPropagation(); rotation += 90; updateTransform(); });
document.getElementById("zoomReset")?.addEventListener('click', (e) => { e.stopPropagation(); resetTransform(); });

const startDrag = (x, y) => { if (zoomScale > 1) { isDragging = true; startX = x - translateX; startY = y - translateY; } };
const moveDrag = (x, y) => { if (isDragging) { translateX = x - startX; translateY = y - startY; updateTransform(); } };

if (modalWrapper) {
    modalWrapper.onmousedown = (e) => startDrag(e.clientX, e.clientY);
    window.onmousemove = (e) => moveDrag(e.clientX, e.clientY);
    window.onmouseup = () => isDragging = false;
}

// ==========================================
// 4. LÓGICA DEL CARRITO
// ==========================================

function actualizarCarritoUI() {
    if (!cartContent) return;
    cartContent.innerHTML = '';
    let total = 0;
    const unidades = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    
    if (cartCountElement) {
        cartCountElement.innerText = unidades;
        cartCountElement.style.display = unidades > 0 ? 'flex' : 'none';
        cartCountElement.classList.add('bump');
        setTimeout(() => cartCountElement.classList.remove('bump'), 300);
    }

    if (carrito.length === 0) {
        cartContent.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Tu carrito está vacío</p>';
    } else {
        carrito.forEach((item, i) => {
            const p = parseFloat(item.precio) || 0;
            const sub = p * item.cantidad;
            total += sub;
            cartContent.insertAdjacentHTML('beforeend', `
                <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <div><span style="font-weight:bold; font-size:0.9rem; display:block;">${item.nombre}</span>
                    <small>${item.cantidad} x ${formatUSD(p)}</small></div>
                    <div style="text-align:right;"><span style="font-weight:bold;">${formatUSD(sub)}</span>
                    <button onclick="eliminarItem(${i})" style="color:red; background:none; border:none; cursor:pointer; font-size:1.2rem;">&times;</button></div>
                </div>
            `);
        });
    }
    if (totalElement) totalElement.innerText = formatUSD(total);
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-btn, .add-btn-large');
    if (!btn || btn.hasAttribute('disabled')) return;

    let nombre, precio, cantidad = 1;
    const infoAside = btn.closest('.product-info-aside');
    
    if (infoAside) {
        nombre = infoAside.querySelector('h1').innerText;
        precio = limpiarPrecio(infoAside.querySelector('.price-detail').innerText);
        cantidad = parseInt(infoAside.querySelector('.qty-input')?.value || 1);
    } else {
        const card = btn.closest('.product-card');
        nombre = card.querySelector('h4').innerText;
        precio = limpiarPrecio(card.querySelector('.price').innerText);
    }

    const exist = carrito.find(p => p.nombre === nombre);
    if (exist) exist.cantidad += cantidad;
    else carrito.push({ nombre, precio, cantidad });

    localStorage.setItem('gyd_carrito', JSON.stringify(carrito));
    actualizarCarritoUI();
    if (cartOverlay) { cartOverlay.style.display = 'flex'; document.body.classList.add('no-scroll'); }
});

window.eliminarItem = (index) => {
    carrito.splice(index, 1);
    localStorage.setItem('gyd_carrito', JSON.stringify(carrito));
    actualizarCarritoUI();
};

const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
    checkoutBtn.onclick = () => {
        if (carrito.length === 0) return alert("Tu carrito está vacío");

        // Encabezado con estilo
        let msg = " *NUEVO PEDIDO - GyD Store* \n";
        msg += "------------------------------------------\n\n";
        msg += " ¡Hola! Me gustaría realizar el siguiente pedido:\n\n";

        // Cuerpo del mensaje (Productos)
        carrito.forEach((item, idx) => {
            const subtotal = item.precio * item.cantidad;
            msg += ` *${item.cantidad}x* ${item.nombre}\n`;
            msg += `     : ${formatUSD(subtotal)}\n\n`;
        });

        // Totales y cierre
        const totalFinal = carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
        msg += "------------------------------------------\n";
        msg += ` *TOTAL A PAGAR: ${formatUSD(totalFinal)}*\n`;
        msg += "------------------------------------------\n\n";
        msg += " *Estado:* Esperando datos para realizar el pago.";

        // Abrir WhatsApp con el mensaje codificado
        const whatsappUrl = `https://wa.me/584121927683?text=${encodeURIComponent(msg)}`;
        window.open(whatsappUrl, '_blank');

        // Limpiar carrito después de enviar
        carrito = []; 
        localStorage.removeItem('gyd_carrito');
        actualizarCarritoUI(); 
        cerrarCarrito();
    };
}

// ==========================================
// 5. FILTRADO Y LISTENERS
// ==========================================
function filtrarProductos() {
    const textoBusqueda = document.getElementById('productSearch')?.value.toLowerCase() || "";
    const precioMaximo = parseFloat(document.getElementById('priceRange')?.value || 50);
    
    // Actualizar el texto del precio máximo
    const labelPrecio = document.getElementById('currentMaxLabel');
    if (labelPrecio) labelPrecio.innerText = `$ ${precioMaximo}`;

    // Obtener valores de aromas y colores seleccionados
    const aromas = Array.from(document.querySelectorAll('#aroma-opts .filter-check:checked')).map(cb => cb.value);
    const colores = Array.from(document.querySelectorAll('#color-opts .filter-check:checked')).map(cb => cb.value);

    document.querySelectorAll('.product-card').forEach(card => {
        const nombre = card.querySelector('h4').innerText.toLowerCase();
        const precio = limpiarPrecio(card.querySelector('.price').innerText);
        
        // Obtener atributos de datos del HTML
        const aromaDoc = card.getAttribute('data-aroma');
        const colorDoc = card.getAttribute('data-color');

        const coincideNombre = nombre.includes(textoBusqueda);
        const coincidePrecio = precio <= precioMaximo;
        const coincideAroma = aromas.length === 0 || aromas.includes(aromaDoc);
        const coincideColor = colores.length === 0 || colores.includes(colorDoc);

        // Mostrar solo si cumple TODAS las condiciones
        if (coincideNombre && coincidePrecio && coincideAroma && coincideColor) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// Escuchar cambios en todos los checkboxes de filtro
document.querySelectorAll('.filter-check').forEach(cb => {
    cb.addEventListener('change', filtrarProductos);
});

// Función para limpiar TODO (Carrito y Preferencias)
window.devReset = function() {
    if(confirm("Reiniciar Datos")) {
        localStorage.clear(); // Borra el carrito guardado
        location.reload();    // Recarga la página para aplicar cambios
    }
};

window.toggleFilter = function(id) {
    const lista = document.getElementById(id);
    if (!lista) return;
    
    const estaCerrado = lista.style.display === "none" || lista.style.display === "";
    lista.style.display = estaCerrado ? "block" : "none";
    
    // Cambiar el signo + por -
    const span = lista.previousElementSibling.querySelector('span');
    if (span) span.innerText = estaCerrado ? "−" : "+";
};

document.getElementById('productSearch')?.addEventListener('input', filtrarProductos);
document.getElementById('priceRange')?.addEventListener('input', filtrarProductos);

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") { cerrarCarrito(); cerrarModalImagen(); cerrarFiltros(); }
});

// Inicialización
actualizarCarritoUI();
