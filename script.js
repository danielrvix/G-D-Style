// 1. MEMORIA Y SELECTORES
let carrito = JSON.parse(localStorage.getItem('gyd_carrito')) || [];

const cartOverlay = document.getElementById('cartOverlay');
const cartContent = document.querySelector('.cart-content');
const totalElement = document.getElementById('cartTotal');
const cartCountElement = document.querySelector('.cart-count');
const priceRange = document.getElementById('priceRange');
const productSearch = document.getElementById('productSearch');

// 2. LÓGICA DE FILTRADO (Tienda)
function aplicarFiltros() {
    if (!priceRange && !productSearch) return; 

    const precioMax = priceRange ? parseFloat(priceRange.value) : 1000;
    const busqueda = productSearch ? productSearch.value.toLowerCase() : "";
    
    const coloresActivos = Array.from(document.querySelectorAll('#color-opts input:checked')).map(c => c.value);
    const aromasActivos = Array.from(document.querySelectorAll('#aroma-opts input:checked')).map(a => a.value);

    const productos = document.querySelectorAll('.product-card');

    productos.forEach(producto => {
        const nombre = producto.querySelector('h4').innerText.toLowerCase();
        const precioText = producto.querySelector('.price').innerText;
        const precioNum = parseFloat(precioText.replace('Bs.S.', '').replace(/\./g, '').replace(',', '.').trim());
        
        const pColor = producto.getAttribute('data-color');
        const pAroma = producto.getAttribute('data-aroma');

        const cumplePrecio = precioNum <= precioMax;
        const cumpleNombre = nombre.includes(busqueda);
        const cumpleColor = coloresActivos.length === 0 || coloresActivos.includes(pColor);
        const cumpleAroma = aromasActivos.length === 0 || aromasActivos.includes(pAroma);

        producto.style.display = (cumplePrecio && cumpleNombre && cumpleColor && cumpleAroma) ? 'block' : 'none';
    });
}

// Listeners de filtros
if (priceRange) {
    priceRange.addEventListener('input', () => {
        const label = document.getElementById('currentMaxLabel');
        if (label) label.innerText = `${priceRange.value} VES`;
        aplicarFiltros();
    });
}
if (productSearch) productSearch.addEventListener('input', aplicarFiltros);
document.querySelectorAll('.filter-check').forEach(check => check.addEventListener('change', aplicarFiltros));

// 3. ACORDEÓN DE FILTROS
window.toggleFilter = function(id) {
    const panel = document.getElementById(id);
    if (!panel) return;
    const icon = panel.previousElementSibling.querySelector('span');
    if (panel.style.display === "none") {
        panel.style.display = "block";
        if (icon) icon.innerText = "−";
    } else {
        panel.style.display = "none";
        if (icon) icon.innerText = "+";
    }
};

// 4. CARRITO: ACTUALIZAR INTERFAZ
function actualizarCarritoUI() {
    if (!cartContent) return;
    cartContent.innerHTML = '';
    let total = 0;

    const unidades = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    if (cartCountElement) {
        cartCountElement.innerText = unidades;
        cartCountElement.style.display = unidades > 0 ? 'flex' : 'none';
    }

    if (carrito.length === 0) {
        cartContent.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Tu carrito está vacío</p>';
    } else {
        carrito.forEach((item, i) => {
            const sub = item.precio * item.cantidad;
            total += sub;
            cartContent.insertAdjacentHTML('beforeend', `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <div>
                        <span style="font-weight:bold; font-size:0.9rem; display:block;">${item.nombre}</span>
                        <small>${item.cantidad} x Bs.S. ${item.precio.toLocaleString('de-DE', {minimumFractionDigits:2})}</small>
                    </div>
                    <div style="text-align:right;">
                        <span style="display:block; font-weight:bold;">Bs.S. ${sub.toLocaleString('de-DE', {minimumFractionDigits:2})}</span>
                        <button onclick="eliminarItem(${i})" style="color:red; background:none; border:none; cursor:pointer; font-size:1.2rem;">&times;</button>
                    </div>
                </div>
            `);
        });
    }
    if (totalElement) {
        totalElement.innerText = `Bs.S. ${total.toLocaleString('de-DE', {minimumFractionDigits:2})}`;
    }
}

// 5. CARRITO: AGREGAR PRODUCTOS (TIENDA Y DETALLE)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-btn') || e.target.classList.contains('add-btn-large')) {
        let nombre, precioStr, cantidad = 1;

        const infoAside = e.target.closest('.product-info-aside');
        if (infoAside) {
            nombre = infoAside.querySelector('h1').innerText;
            precioStr = infoAside.querySelector('.price-detail').innerText;
            const inputQty = infoAside.querySelector('.qty-input');
            cantidad = inputQty ? parseInt(inputQty.value) : 1;
        } else {
            const card = e.target.closest('.product-card');
            if (!card) return;
            nombre = card.querySelector('h4').innerText;
            precioStr = card.querySelector('.price').innerText;
            cantidad = 1;
        }

        const precio = parseFloat(precioStr.replace('Bs.S.', '').replace(/\./g, '').replace(',', '.').trim());

        const exist = carrito.find(p => p.nombre === nombre);
        if (exist) {
            exist.cantidad += cantidad;
        } else {
            carrito.push({ nombre, precio, cantidad });
        }

        localStorage.setItem('gyd_carrito', JSON.stringify(carrito));
        actualizarCarritoUI();
        cartOverlay.style.display = 'flex';
    }
});

window.eliminarItem = (index) => {
    carrito.splice(index, 1);
    localStorage.setItem('gyd_carrito', JSON.stringify(carrito));
    actualizarCarritoUI();
};

// Abrir/Cerrar Carrito
const openBtn = document.getElementById('openCartFloat');
const closeBtn = document.getElementById('closeCart');
if (openBtn) openBtn.onclick = () => cartOverlay.style.display = 'flex';
if (closeBtn) closeBtn.onclick = () => cartOverlay.style.display = 'none';
window.onclick = (e) => { if (e.target === cartOverlay) cartOverlay.style.display = 'none'; };

// 6. FINALIZAR COMPRA
const checkoutBtn = document.querySelector('.checkout-btn');
if (checkoutBtn) {
    checkoutBtn.onclick = () => {
        if (carrito.length === 0) return alert("Carrito vacío");
        let msg = "¡Hola! Quisiera realizar el siguiente pedido en G&D Style:\n\n";
        let totalPedido = 0;
        carrito.forEach((item, index) => {
            const sub = item.precio * item.cantidad;
            msg += `${index + 1}. *${item.nombre}*\n   Cant: ${item.cantidad} - Bs.S. ${sub.toLocaleString('de-DE', {minimumFractionDigits:2})}\n`;
            totalPedido += sub;
        });
        msg += `\n*Total a pagar: Bs.S. ${totalPedido.toLocaleString('de-DE', {minimumFractionDigits:2})}*`;
        msg += "\n\n¿Me podrían indicar los métodos de pago? 🙏";
        window.open(`https://wa.me/584121927683?text=${encodeURIComponent(msg)}`, '_blank');
        carrito = []; 
        localStorage.removeItem('gyd_carrito');
        actualizarCarritoUI(); 
        cartOverlay.style.display = 'none'; 
    };
}

// 7. LÓGICA DEL MENÚ HAMBURGUESA
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.replace('fa-bars', 'fa-times');
        } else {
            icon.classList.replace('fa-times', 'fa-bars');
        }
    });
}

// 8. SCROLL: BOTÓN VOLVER ARRIBA (Única función de scroll)
const backToTopBtn = document.getElementById('backToTop');

window.onscroll = function() {
    // Controlar botón volver arriba
    if (backToTopBtn) {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            backToTopBtn.style.display = "flex";
        } else {
            backToTopBtn.style.display = "none";
        }
    }
};

if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Inicialización
actualizarCarritoUI();