
// Cart state management
let cartData = {
    items: [],
    original_total_price: 0,
    currency: 'INR'
};

// Sample product data
const products = [
    {
        id: 49839206859071,
        title: "Asgaard sofa",
        price: 25000000,
        image: "https://cdn.shopify.com/s/files/1/0883/2188/4479/files/Asgaardsofa3.png",
        product_description: "The Asgaard sofa offers unparalleled comfort and style with its sleek design and high-quality materials."
    }
];

// Initialize cart from localStorage
const initializeCart = () => {
    const savedCart = localStorage.getItem('cartData');
    if (savedCart) {
        cartData = JSON.parse(savedCart);
    }
    updateCartCount();

    // Only initialize cart page elements if we're on the cart page
    if (window.location.pathname.includes('cart.html')) {
        initializeCartPage();
    }
};

// Update cart count in header - works on all pages
const updateCartCount = () => {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
};

// Save cart to localStorage
const saveCartToLocalStorage = () => {
    localStorage.setItem('cartData', JSON.stringify(cartData));
    updateCartCount();
};

// Format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount / 100);
};

// Add to cart functionality - for index and shop pages
const addToCart = () => {
    const product = products[0];
    const existingItem = cartData.items.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.line_price = existingItem.price * existingItem.quantity;
        existingItem.final_line_price = existingItem.line_price;
    } else {
        cartData.items.push({
            ...product,
            quantity: 1,
            line_price: product.price,
            final_line_price: product.price
        });
    }
    
    saveCartToLocalStorage();
    showNotification('Product added to cart successfully!');
};

// Show notification
const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
};

// Update specific cart item in the DOM
const updateCartItemDOM = (itemId) => {
    const item = cartData.items.find(item => item.id === itemId);
    if (!item) return;

    const cartItemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
    if (cartItemElement) {
        // Update quantity
        const quantitySpan = cartItemElement.querySelector('.quantity-control span');
        if (quantitySpan) {
            quantitySpan.textContent = item.quantity;
        }

        // Update price
        const priceDiv = cartItemElement.querySelector('.item-price');
        if (priceDiv) {
            priceDiv.textContent = formatCurrency(item.line_price);
        }

        // Update quantity buttons
        const minusBtn = cartItemElement.querySelector('.quantity-btn:first-child');
        const plusBtn = cartItemElement.querySelector('.quantity-btn:last-child');
        if (minusBtn && plusBtn) {
            minusBtn.onclick = () => updateQuantity(itemId, item.quantity - 1);
            plusBtn.onclick = () => updateQuantity(itemId, item.quantity + 1);
        }
    }
};

// Update cart totals in the DOM
const updateCartTotalsDOM = () => {
    const subtotal = cartData.items.reduce((sum, item) => sum + item.line_price, 0);
    cartData.original_total_price = subtotal;
    
    const subtotalAmount = document.querySelector('.subtotal-amount');
    const totalAmount = document.querySelector('.total-amount');
    
    if (subtotalAmount) subtotalAmount.textContent = formatCurrency(subtotal);
    if (totalAmount) totalAmount.textContent = formatCurrency(subtotal);

    // Show/hide empty cart message
    const cartEmptyMessage = document.querySelector('.cart-empty');
    if (cartEmptyMessage) {
        cartEmptyMessage.style.display = cartData.items.length === 0 ? 'block' : 'none';
    }
};

// Remove item from DOM
const removeItemFromDOM = (itemId) => {
    const cartItem = document.querySelector(`.cart-item[data-id="${itemId}"]`);
    if (cartItem) {
        cartItem.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            cartItem.remove();
            updateCartTotalsDOM();
        }, 300);
    }
};

// Cart page specific functionality
const initializeCartPage = () => {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartEmptyMessage = document.querySelector('.cart-empty');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const successModal = document.querySelector('.success-modal');
    const removeItemModal = document.getElementById('removeItemModal');
    const loadingOverlay = document.querySelector('.loading-overlay');

    if (!cartItemsContainer) return;

    // Render cart
    const renderCart = () => {
        if (cartData.items.length === 0) {
            cartEmptyMessage.style.display = 'block';
            cartItemsContainer.innerHTML = '';
            return;
        }

        cartEmptyMessage.style.display = 'none';
        cartItemsContainer.innerHTML = cartData.items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.title}">
                <div class="item-details">
                    <h3>${item.title}</h3>
                    <p>Unit Price: ${formatCurrency(item.price)}</p>
                </div>
                <div class="quantity-control">
                    <button class="quantity-btn">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn">+</button>
                </div>
                <div class="item-price">${formatCurrency(item.line_price)}</div>
                <i class="fas fa-times remove-item" onclick="showRemoveItemModal(${item.id})"></i>
            </div>
        `).join('');

        // Add event listeners after rendering
        cartData.items.forEach(item => {
            const cartItem = cartItemsContainer.querySelector(`.cart-item[data-id="${item.id}"]`);
            if (cartItem) {
                const minusBtn = cartItem.querySelector('.quantity-btn:first-child');
                const plusBtn = cartItem.querySelector('.quantity-btn:last-child');
                
                minusBtn.onclick = () => updateQuantity(item.id, item.quantity - 1);
                plusBtn.onclick = () => updateQuantity(item.id, item.quantity + 1);
            }
        });

        updateCartTotalsDOM();
    };

    // Initialize cart page events
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cartData.items.length === 0) return;

            loadingOverlay.style.display = 'flex';
            
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                successModal.style.display = 'flex';
                
                cartData.items = [];
                saveCartToLocalStorage();
                renderCart();
            }, 1500);
        });
    }

    if (removeItemModal) {
        const cancelBtn = removeItemModal.querySelector('.cancel-btn');
        const confirmBtn = removeItemModal.querySelector('.confirm-btn');
        
        if (cancelBtn) cancelBtn.addEventListener('click', hideRemoveItemModal);
        if (confirmBtn) confirmBtn.addEventListener('click', removeItem);
    }

    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.style.display = 'none';
            }
        });
    }

    // Render initial cart state
    renderCart();
};

// Make these functions available globally
window.addToCart = addToCart;
window.updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const item = cartData.items.find(item => item.id === itemId);
    if (item) {
        item.quantity = newQuantity;
        item.line_price = item.price * item.quantity;
        item.final_line_price = item.line_price;
        
        saveCartToLocalStorage();
        
        // Directly update the DOM without full page reload
        updateCartItemDOM(itemId);
        updateCartTotalsDOM();
    }
};

let itemToRemove = null;

window.showRemoveItemModal = (id) => {
    itemToRemove = id;
    const removeItemModal = document.getElementById('removeItemModal');
    if (removeItemModal) {
        removeItemModal.style.display = 'flex';
        
        // Add animation class
        const modalContent = removeItemModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.animation = 'slideIn 0.3s ease-out';
        }
    }
};

window.hideRemoveItemModal = () => {
    const removeItemModal = document.getElementById('removeItemModal');
    if (removeItemModal) {
        const modalContent = removeItemModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                removeItemModal.style.display = 'none';
                modalContent.style.animation = '';
            }, 300);
        } else {
            removeItemModal.style.display = 'none';
        }
    }
    itemToRemove = null;
};

window.removeItem = () => {
    if (itemToRemove !== null) {
        // Remove from data
        cartData.items = cartData.items.filter(item => item.id !== itemToRemove);
        saveCartToLocalStorage();

        // Remove from DOM
        removeItemFromDOM(itemToRemove);
        
        // Hide modal
        hideRemoveItemModal();

        // Show notification
        showNotification('Item removed from cart');
    }
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-20px); }
    }
    
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(20px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', initializeCart);





