let cart = [];
let currentInventory = [];
let isUSD = false;
let itemsToShow = 12;
let currentCount = 0;
let filteredInventory = [];
let exchangeRate = 1.08; // Default fallback
let lastRateUpdate = "Checking...";

async function fetchExchangeRate() {
    // This is a static JSON file hosted on Cloudflare.
    // It's much harder for firewalls to block than a live API call.
    const url = `https://latest.currency-api.pages.dev/v1/currencies/eur.json`;

    try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("CDN Unreachable");

        const data = await response.json();

        // The structure here is data.eur.usd
        if (data && data.eur && data.eur.usd) {
            exchangeRate = data.eur.usd;
            lastRateUpdate = new Date().toLocaleTimeString();
            console.log("✅ Success! Rate loaded via CDN:", exchangeRate);
        } else {
            throw new Error("Data format unexpected");
        }

    } catch (error) {
        console.error("CDN Fetch failed:", error);
        // CRITICAL: Update the UI so it doesn't stay stuck on "Checking..."
        lastRateUpdate = "Last attempt: " + new Date().toLocaleTimeString() + " (Fixed Fallback)";
        exchangeRate = 1.08; // Reset to safe default
    }
}

// Run it immediately
fetchExchangeRate();

// ==========================================
// NAVIGATION & UI LOGIC
// ==========================================

function showSection(sectionId) {
    document.getElementById('role-selection').classList.add('hidden');
    document.getElementById('customer-view').classList.add('hidden');
    document.getElementById('cart-view').classList.add('hidden');
    document.getElementById('admin-view').classList.add('hidden');

    document.getElementById(sectionId).classList.remove('hidden');

    const isCustomer = sectionId === 'customer-view' || sectionId === 'cart-view';
    document.getElementById('navCartBtn').classList.toggle('hidden', !isCustomer);
    document.getElementById('switchRoleBtn').classList.toggle('hidden', sectionId === 'role-selection');
    document.getElementById('currencyToggleBtn').classList.toggle('hidden', !isCustomer);
}

function initCustomerView() {
    showSection('customer-view');
    fetchInventory();
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function showStatusModal(title, message, isSuccess) {
    const modalElement = document.getElementById('statusModal');
    const modal = new bootstrap.Modal(modalElement);
    const iconDiv = document.getElementById('modalIcon');

    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message || "";

    if (isSuccess) {
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-check fa-5x text-success"></i>';
    } else {
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-xmark fa-5x text-danger"></i>';
    }

    modal.show();
}

// Currency Toggle Logic
document.getElementById('currencyToggleBtn').addEventListener('click', function () {
    isUSD = !isUSD;
    this.innerHTML = isUSD ? '<i class="fa-solid fa-coins"></i> Show EUR' : '<i class="fa-solid fa-coins"></i> Show USD';

    // Refresh the view you are currently looking at
    if (!document.getElementById('customer-view').classList.contains('hidden')) {
        currentCount = 0; // Reset to recalculate from top
        displayProducts(false);
    } else if (!document.getElementById('cart-view').classList.contains('hidden')) {
        renderCartTable();
    }
});

// ==========================================
// CUSTOMER VIEW LOGIC (AJAX)
// ==========================================

function fetchInventory() {
    fetch('/inventory')
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch");
            return response.json();
        })
        .then(data => {
            currentInventory = data;
            filteredInventory = [...currentInventory]; // Initial list is everything
            displayProducts(false); // Initial load (clears grid)
        })
        .catch(error => console.error('Error fetching inventory:', error));
}

function displayProducts(append = false) {
    const grid = document.getElementById('productGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const allLoadedMsg = document.getElementById('allLoadedMsg');

    if (!append) {
        grid.innerHTML = '';
        currentCount = 0;
    }

    // Slice the next 12 items
    const nextSlice = filteredInventory.slice(currentCount, currentCount + itemsToShow);

    if (nextSlice.length === 0 && !append) {
        grid.innerHTML = '<p class="text-center text-muted">No items found.</p>';
        loadMoreBtn.classList.add('hidden');
        return;
    }

    nextSlice.forEach(item => {
        const rawPrice = Number(item.price);
        const displayPrice = isUSD ? (rawPrice * exchangeRate).toFixed(2) : rawPrice.toFixed(2);
        const symbol = isUSD ? "$" : "€";

        const cardHTML = `
            <div class="col-md-4 mb-4">
                <div class="card h-100 shadow-sm product-card border-0">
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <h6 class="card-subtitle mb-2 text-muted text-capitalize">${item.category}</h6>
                        <p class="card-text fs-4 text-success fw-bold">${symbol}${displayPrice}</p>
                        <p class="card-text small text-muted">Stock: ${item.quantity}</p>
                    </div>
                    <div class="card-footer bg-white border-0 pb-3">
                        <button class="btn btn-outline-primary w-100" onclick="addToCart(${item.id})">
                            <i class="fa-solid fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });

    currentCount += nextSlice.length;

    if (currentCount < filteredInventory.length) {
        loadMoreBtn.classList.remove('hidden');
        allLoadedMsg.classList.add('hidden');
    } else {
        loadMoreBtn.classList.add('hidden');
        if (filteredInventory.length > 0) {
            allLoadedMsg.classList.remove('hidden');
        }
    }
}

// Triggered by the button at the bottom of the page
function loadMore() {
    displayProducts(true);
}

// Category filter reset
function applyFilters() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value.toLowerCase();
    const sort = document.getElementById('sortFilter').value;

    // 1. Start with the full inventory
    let result = [...currentInventory];

    // 2. Filter by Category
    if (category !== 'all') {
        result = result.filter(item => item.category.toLowerCase() === category);
    }

    // 3. Filter by Search Term
    if (searchTerm) {
        result = result.filter(item => item.name.toLowerCase().includes(searchTerm));
    }

    // 4. Sort
    if (sort === 'price-asc') {
        result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
        result.sort((a, b) => b.price - a.price);
    } else {
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    filteredInventory = result;
    displayProducts(false); // Re-render from the first 12
}

// ==========================================
// CART LOGIC
// ==========================================

function addToCart(itemId) {
    const product = currentInventory.find(item => item.id === itemId);
    const existingItem = cart.find(item => item.inv_id === itemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            inv_id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1
        });
    }
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').innerText = totalItems;
    renderCartTable();
}

function renderCartTable() {
    const tbody = document.getElementById('cartTableBody');
    const totalDisplay = document.getElementById('cartTotalDisplay');
    if (!tbody) return;

    tbody.innerHTML = '';
    let grandTotal = 0;
    const symbol = isUSD ? "$" : "€";

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Your cart is empty</td></tr>';
        totalDisplay.innerText = `Total: ${symbol}0.00`;
        return;
    }

    cart.forEach((item, index) => {
        const itemPrice = isUSD ? item.price * exchangeRate : item.price;
        const itemTotal = itemPrice * item.quantity;
        grandTotal += itemTotal;

        tbody.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${symbol}${itemPrice.toFixed(2)}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-danger" onclick="changeQty(${index}, -1)">
                            <i class="fa-solid fa-minus"></i>
                        </button>
                        <span class="mx-3 fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-success" onclick="changeQty(${index}, 1)">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </td>
                <td>${symbol}${itemTotal.toFixed(2)}</td>
            </tr>
        `;
    });
    totalDisplay.innerText = `Total: ${symbol}${grandTotal.toFixed(2)}`;
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

// ==========================================
// CHECKOUT PROCESS
// ==========================================

async function checkoutOrder() {
    if (cart.length === 0) {
        showStatusModal("Empty Cart", "Please add some items before checking out.", false);
        return;
    }

    try {
        const custRes = await fetch('/customers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({first_name: "Guest", last_name: "User", city: "Online", country: "Web", sex: "F"})
        });
        const customer = await custRes.json();

        const orderRes = await fetch('/orders', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                cust_id: customer.id,
                order_date: new Date().toISOString().split('T')[0],
                status: 'Pending'
            })
        });
        const order = await orderRes.json();

        for (const item of cart) {
            await fetch('/order_items', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    order_id: order.id,
                    inv_id: item.inv_id,
                    price: item.price,
                    quantity: item.quantity
                })
            });
        }

        const finalRes = await fetch(`/orders/${order.id}/checkout`, {method: 'POST'});
        const finalData = await finalRes.json();

        if (finalRes.ok) {
            showStatusModal("Success!", "Order #" + order.id + " completed successfully.", true);
            cart = [];
            updateCartUI();
            showSection('role-selection');
        } else {
            showStatusModal("Checkout Failed", finalData.error || finalData.message, false);
        }

    } catch (error) {
        console.error("Checkout Failed:", error);
        showStatusModal("System Error", "Could not connect to the database.", false);
    }
}

// ==========================================
// ADMIN VIEW LOGIC
// ==========================================
let adminInventory = [];
let allOrders = [];

function initAdminView() {
    showSection('admin-view');
    switchAdminTab('inventory', document.querySelector('#adminTabs .nav-link'));
}

function switchAdminTab(tab, element) {
    document.querySelectorAll('#adminTabs .nav-link').forEach(link => link.classList.remove('active'));
    if (element) element.classList.add('active');

    const contentArea = document.getElementById('admin-content-area');
    contentArea.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-primary"></div></div>';

    if (tab === 'inventory') {
        loadAdminInventory();
    } else if (tab === 'orders') {
        loadAdminOrders();
    } else if (tab === 'analytics') {
        loadAnalytics();
    }
}

// ------------------------------------------
// INVENTORY TAB (CRUD)
// ------------------------------------------
async function loadAdminInventory() {
    try {
        const res = await fetch('/inventory');
        adminInventory = await res.json();
        renderAdminInventoryTable();
    } catch (e) {
        showStatusModal("Error", "Could not load inventory.", false);
    }
}

function renderAdminInventoryTable(filterCategory = 'All', searchTerm = '') {
    const content = document.getElementById('admin-content-area');

    // 1. Filter Logic
    let filteredItems = adminInventory.filter(item => {
        const matchesCategory = (filterCategory === 'All' || item.category.toLowerCase() === filterCategory.toLowerCase());
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // 2. Sort items alphabetically
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));

    // 3. Get unique categories for the dropdown
    const uniqueCategories = [...new Set(adminInventory.map(item => item.category.toLowerCase()))];

    // 4. Generate HTML
    let html = `
        <div class="row mb-3 g-2 align-items-center">
            <div class="col-md-4">
                <div class="input-group">
                    <span class="input-group-text bg-white border-primary text-primary">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input type="text" id="adminSearch" class="form-control border-primary" 
                           placeholder="Search inventory..." value="${searchTerm}"
                           oninput="renderAdminInventoryTable(document.getElementById('adminCategoryFilter').value, this.value)">
                </div>
            </div>
            <div class="col-md-3">
                <select id="adminCategoryFilter" class="form-select border-primary" 
                        onchange="renderAdminInventoryTable(this.value, document.getElementById('adminSearch').value)">
                    <option value="All" ${filterCategory === 'All' ? 'selected' : ''}>All Categories</option>
                    ${uniqueCategories.map(cat => `
                        <option value="${cat}" class="text-capitalize" ${filterCategory === cat ? 'selected' : ''}>${cat}</option>
                    `).join('')}
                </select>
            </div>
            <div class="col-md-5 text-end">
                <button class="btn btn-success" onclick="openItemModal(null)">
                    <i class="fa-solid fa-plus me-1"></i> Add New Item
                </button>
            </div>
        </div>
        
        <div class="table-responsive">
            <table class="table table-hover bg-white shadow-sm align-middle">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock Status</th>
                        <th class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (filteredItems.length === 0) {
        html += `<tr><td colspan="6" class="text-center py-4 text-muted">No items match your search.</td></tr>`;
    } else {
        filteredItems.forEach(item => {
            const lowStock = item.quantity < 5;
            html += `
                <tr>
                    <td><span class="badge bg-light text-dark border">${item.id}</span></td>
                    <td class="fw-bold">${item.name}</td>
                    <td><span class="badge bg-secondary text-capitalize">${item.category}</span></td>
                    <td>€${Number(item.price).toFixed(2)}</td>
                    <td>
                        <span class="${lowStock ? 'text-danger fw-bold' : 'text-success'}">
                            <i class="fa-solid ${lowStock ? 'fa-triangle-exclamation' : 'fa-check-circle'} me-1"></i>
                            ${item.quantity} units
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="openItemModal(${item.id})" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${item.id})" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;

    // 5. Update the DOM
    content.innerHTML = html;

    // 6. FIX FOCUS
    if (searchTerm !== "") {
        const searchInput = document.getElementById('adminSearch');
        searchInput.focus();
        searchInput.setSelectionRange(searchTerm.length, searchTerm.length);
    }
}

function openItemModal(id = null) {
    // Failsafe: if the browser passed a MouseEvent, treat it as null
    if (typeof id === 'object') {
        id = null;
    }

    const modalElement = document.getElementById('itemModal');
    const modal = new bootstrap.Modal(modalElement);

    if (id) {
        // Edit mode logic here
        const item = adminInventory.find(i => i.id === id);
        if (document.getElementById('itemId')) document.getElementById('itemId').value = item.id;
        if (document.getElementById('itemName')) document.getElementById('itemName').value = item.name;
        if (document.getElementById('itemPrice')) document.getElementById('itemPrice').value = item.price;
        if (document.getElementById('itemQuantity')) document.getElementById('itemQuantity').value = item.quantity;
        if (document.getElementById('itemCategory')) document.getElementById('itemCategory').value = item.category;
    } else {
        // Add mode: Clear the fields
        if (document.getElementById('itemId')) document.getElementById('itemId').value = '';
        if (document.getElementById('itemName')) document.getElementById('itemName').value = '';
        if (document.getElementById('itemPrice')) document.getElementById('itemPrice').value = '';
        if (document.getElementById('itemQuantity')) document.getElementById('itemQuantity').value = '';
        if (document.getElementById('itemCategory')) document.getElementById('itemCategory').value = '';
    }
    modal.show();
}

async function deleteItem(id) {
    if (!confirm(`Are you absolutely sure you want to delete item #${id}?`)) return;

    try {
        const res = await fetch(`/inventory/${id}`, {method: 'DELETE'});
        if (res.ok) {
            showStatusModal("Deleted", `Item #${id} removed.`, true);
            loadAdminInventory();
        } else {
            showStatusModal("Error", "Could not delete item.", false);
        }
    } catch (error) {
        showStatusModal("Error", "Server connection failed.", false);
    }
}

async function saveItem() {
    // 1. Grab the values from the modal inputs
    const id = document.getElementById('itemId').value;
    const name = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const quantity = parseInt(document.getElementById('itemQuantity').value);

    // 2. Basic Validation: Ensure nothing is blank or invalid
    if (!name || !category || isNaN(price) || isNaN(quantity)) {
        alert("Please fill in all fields correctly before saving.");
        return;
    }

    // 3. Package the data into a JSON object
    const itemData = {
        name: name,
        category: category.toLowerCase(),
        price: price,
        quantity: quantity
    };

    try {
        let response;

        // 4. Decide if we are ADDING (POST) or EDITING (PUT)
        if (id) {
            // If there is an ID, we are updating an existing item
            response = await fetch(`/inventory/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(itemData)
            });
        } else {
            // If there is no ID, we are creating a brand new item
            response = await fetch('/inventory', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(itemData)
            });
        }

        if (response.ok) {
            // 5. Hide the modal on success
            const modalElement = document.getElementById('itemModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // 6. Show success message and reload the table
            showStatusModal("Success!", `Item successfully ${id ? 'updated' : 'added'}.`, true);
            loadAdminInventory();
        } else {
            const errorData = await response.json();
            showStatusModal("Save Failed", errorData.error || "Could not save the item.", false);
        }

    } catch (error) {
        console.error("Save Error:", error);
        showStatusModal("System Error", "Could not connect to the server to save.", false);
    }
}

// ------------------------------------------
// ORDERS TAB (READ & FILTER)
// ------------------------------------------
async function loadAdminOrders() {
    try {
        const res = await fetch('/orders');
        allOrders = await res.json();
        renderAdminOrdersTable('All');
    } catch (e) {
        showStatusModal("Error", "Could not load orders.", false);
    }
}

function renderAdminOrdersTable(filterStatus) {
    const content = document.getElementById('admin-content-area');
    const filteredOrders = filterStatus === 'All' ? allOrders : allOrders.filter(o => o.status === filterStatus);

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4>Order History</h4>
            <select class="form-select w-auto border-info" onchange="renderAdminOrdersTable(this.value)">
                <option value="All" ${filterStatus === 'All' ? 'selected' : ''}>All Orders</option>
                <option value="Pending" ${filterStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Completed" ${filterStatus === 'Completed' ? 'selected' : ''}>Completed</option>
                <option value="Failed" ${filterStatus === 'Failed' ? 'selected' : ''}>Failed</option>
            </select>
        </div>
        <table class="table table-hover bg-white shadow-sm align-middle">
            <thead class="table-dark">
                <tr><th>ID</th><th>Customer</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody id="ordersTbody">
    `;

    filteredOrders.forEach(order => {
        let badgeClass;
        if (order.status === 'Completed') {
            badgeClass = 'bg-success';
        } else if (order.status === 'Failed') {
            badgeClass = 'bg-danger';
        } else {
            badgeClass = 'bg-warning text-dark'; // Pending
        }

        html += `
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>Cust_${order.cust_id}</td>
                <td>${new Date(order.order_date).toLocaleDateString()}</td>
                <td><span class="badge ${badgeClass}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails(${order.id}, this)">
                        View Items
                    </button>
                </td>
            </tr>
            <tr id="details-${order.id}" class="hidden bg-light">
                <td colspan="5">
                    <div class="p-3" id="details-content-${order.id}">Loading...</div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    content.innerHTML = html;
}

async function viewOrderDetails(orderId, btn) {
    const detailsRow = document.getElementById(`details-${orderId}`);
    const contentDiv = document.getElementById(`details-content-${orderId}`);

    if (!detailsRow.classList.contains('hidden')) {
        detailsRow.classList.add('hidden');
        btn.innerText = "View Items";
        return;
    }

    detailsRow.classList.remove('hidden');
    btn.innerText = "Hide Items";

    try {
        const res = await fetch(`/order_items`);
        const allItems = await res.json();
        const orderItems = allItems.filter(item => item.order_id === orderId);

        if (orderItems.length === 0) {
            contentDiv.innerHTML = "<em>No items found for this order.</em>";
            return;
        }

        let itemsHtml = `<ul class="list-group">`;
        orderItems.forEach(item => {
            const product = adminInventory.find(p => p.id === item.inv_id) || currentInventory.find(p => p.id === item.inv_id);
            const name = product ? product.name : `Product #${item.inv_id}`;
            itemsHtml += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${name} (x${item.quantity})
                    <span>€${(item.price * item.quantity).toFixed(2)}</span>
                </li>`;
        });
        itemsHtml += `</ul>`;
        contentDiv.innerHTML = itemsHtml;
    } catch (e) {
        contentDiv.innerHTML = "Error loading details.";
    }
}

// ==========================================
// ANALYTICS TAB (CHART.JS + LIVE API)
// ==========================================

async function loadAnalytics() {
    const content = document.getElementById('admin-content-area');

    content.innerHTML = '<div class="text-center mt-5"><div class="spinner-border text-primary"></div><p>Calculating live analytics...</p></div>';

    try {
        // FIX: We now fetch order_items as well to calculate true Sales volume
        const [ordersRes, invRes, itemsRes] = await Promise.all([
            fetch('/orders'),
            fetch('/inventory'),
            fetch('/order_items')
        ]);

        const orders = await ordersRes.json();
        const inventory = await invRes.json();
        const orderItems = await itemsRes.json();

        // Stock Value Calculation
        const totalValueEUR = inventory.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        const totalValueUSD = totalValueEUR * exchangeRate;

        // Sales Calculation (Only summing up orders that were successfully 'Completed')
        const completedOrderIds = orders.filter(o => o.status === 'Completed').map(o => o.id);
        const totalSalesEUR = orderItems
            .filter(item => completedOrderIds.includes(item.order_id))
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);

        content.innerHTML = `
            <div class="row mb-4 g-3">
                <div class="col-md-3">
                    <div class="card bg-primary text-white text-center p-3 border-0 shadow-sm h-100">
                        <h6 class="text-uppercase small opacity-75">Total Products</h6>
                        <h3 class="mb-0">${inventory.length}</h3>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white text-center p-3 border-0 shadow-sm h-100">
                        <h6 class="text-uppercase small opacity-75">Stock Units</h6>
                        <h3 class="mb-0">${inventory.reduce((sum, i) => sum + i.quantity, 0)}</h3>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-dark text-white p-3 border-0 shadow-sm h-100">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-uppercase small opacity-75 text-info">Financial Overview</h6>
                                <div class="mb-1">
                                    <span class="text-muted small">Live Inventory Value:</span>
                                    <h4 class="mb-0">€${totalValueEUR.toLocaleString(undefined, {minimumFractionDigits: 2})} <span class="small text-warning fs-6">≈ $${totalValueUSD.toLocaleString(undefined, {minimumFractionDigits: 2})} USD</span></h4>
                                </div>
                                <div>
                                    <span class="text-muted small">Total Sales (Completed):</span>
                                    <h5 class="text-success mb-0">+ €${totalSalesEUR.toLocaleString(undefined, {minimumFractionDigits: 2})}</h5>
                                </div>
                            </div>
                            <div class="text-end">
                                <i class="fa-solid fa-scale-balanced fa-2x opacity-25"></i>
                                <div class="small mt-2" style="font-size: 0.7rem; line-height: 1.2;">
                                    Rate: 1.00 : ${exchangeRate.toFixed(4)}<br>
                                    <span class="text-info">Updated: ${lastRateUpdate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-6 mb-4">
                    <div class="card shadow-sm h-100 border-0">
                        <div class="card-body">
                            <h5 class="card-title text-center text-muted">Order Status Distribution</h5>
                            <canvas id="orderStatusChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card shadow-sm h-100 border-0">
                        <div class="card-body">
                            <h5 class="card-title text-center text-muted">Stock Quantity by Category</h5>
                            <canvas id="inventoryCategoryChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12 mb-4">
                    <div class="card shadow-sm border-0">
                        <div class="card-body">
                            <h5 class="card-title text-muted"><i class="fa-solid fa-arrow-down-9-1"></i> Lowest Stock Items (Top 10)</h5>
                            <canvas id="stockLevelsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        renderAnalyticsCharts(orders, inventory);

    } catch (error) {
        console.error("Analytics Error:", error);
        content.innerHTML = `<div class="alert alert-danger">Error loading analytics: ${error.message}</div>`;
    }
}

function renderAnalyticsCharts(orders, inventory) {
    // --- 1. Order Status Doughnut Chart ---
    const statusCounts = {Pending: 0, Completed: 0, Failed: 0};
    orders.forEach(o => {
        if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    });
    const totalOrders = orders.length;

    new Chart(document.getElementById('orderStatusChart'), {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Completed', 'Failed'],
            datasets: [{
                data: [statusCounts.Pending, statusCounts.Completed, statusCounts.Failed],
                backgroundColor: ['#ffc107', '#198754', '#dc3545'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '60%',
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const val = context.raw;
                            const perc = totalOrders > 0 ? ((val / totalOrders) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${val} orders (${perc}%)`;
                        }
                    }
                }
            }
        }
    });

    // --- 2. Inventory Category Pie Chart ---
    const categoryStock = {};
    let totalStock = 0;
    inventory.forEach(item => {
        const cat = item.category.toLowerCase();
        categoryStock[cat] = (categoryStock[cat] || 0) + item.quantity;
        totalStock += item.quantity;
    });

    new Chart(document.getElementById('inventoryCategoryChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(categoryStock).map(c => c.charAt(0).toUpperCase() + c.slice(1)),
            datasets: [{
                data: Object.values(categoryStock),
                backgroundColor: ['#0dcaf0', '#6f42c1', '#fd7e14', '#20c997'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const val = context.raw;
                            const perc = totalStock > 0 ? ((val / totalStock) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${val} units (${perc}%)`;
                        }
                    }
                }
            }
        }
    });

    // --- 3. Lowest Stock Bar Chart ---
    const sortedInv = [...inventory].sort((a, b) => a.quantity - b.quantity).slice(0, 10);
    new Chart(document.getElementById('stockLevelsChart'), {
        type: 'bar',
        data: {
            labels: sortedInv.map(i => i.name),
            datasets: [{
                label: 'Units in Stock',
                data: sortedInv.map(i => i.quantity),
                backgroundColor: sortedInv.map(i => i.quantity < 5 ? '#dc3545' : '#0d6efd'),
                borderRadius: 4
            }]
        },
        options: {
            scales: {y: {beginAtZero: true}},
            plugins: {legend: {display: false}}
        }
    });
}