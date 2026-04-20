let cart = [];
let currentInventory = [];
let isUSD = false;
let itemsToShow = 12;
let currentCount = 0;
let filteredInventory = [];
const exchangeRate = 1.08; // 1 EUR = 1.08 USD

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
document.getElementById('categoryFilter').addEventListener('change', function (e) {
    const selectedCategory = e.target.value.toLowerCase();

    if (selectedCategory === 'all') {
        filteredInventory = [...currentInventory];
    } else {
        filteredInventory = currentInventory.filter(
            item => item.category.toLowerCase() === selectedCategory
        );
    }

    displayProducts(false); // Reset to top and show first 12
});

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

function renderAdminInventoryTable(filterCategory = 'All') {
    const content = document.getElementById('admin-content-area');
    let filteredItems = adminInventory;

    if (filterCategory !== 'All') {
        filteredItems = adminInventory.filter(item => item.category.toLowerCase() === filterCategory.toLowerCase());
    }

    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
    const uniqueCategories = [...new Set(adminInventory.map(item => item.category.toLowerCase()))];

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center">
                <label class="fw-bold me-2">Filter Category:</label>
                <select class="form-select w-auto border-primary" onchange="renderAdminInventoryTable(this.value)">
                    <option value="All" ${filterCategory === 'All' ? 'selected' : ''}>All Categories</option>
                    ${uniqueCategories.map(cat => `
                        <option value="${cat}" class="text-capitalize" ${filterCategory === cat ? 'selected' : ''}>${cat}</option>
                    `).join('')}
                </select>
            </div>
            <button class="btn btn-success" onclick="openItemModal()"><i class="fa-solid fa-plus"></i> Add New Item</button>
        </div>
        <table class="table table-hover bg-white shadow-sm align-middle">
            <thead class="table-dark">
                <tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
            </thead>
            <tbody>
    `;

    if (filteredItems.length === 0) {
        html += `<tr><td colspan="6" class="text-center text-muted">No items found in this category.</td></tr>`;
    } else {
        filteredItems.forEach(item => {
            html += `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td class="text-capitalize">${item.category}</td>
                    <td>€${Number(item.price).toFixed(2)}</td>
                    <td class="${item.quantity < 5 ? 'text-danger fw-bold' : ''}">${item.quantity}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="openItemModal(${item.id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table>`;
    content.innerHTML = html;
}

function openItemModal(id = null) {
    const itemModal = new bootstrap.Modal(document.getElementById('itemModal'));

    if (id) {
        const item = adminInventory.find(i => i.id === id);
        document.getElementById('itemModalTitle').innerText = "Edit Item #" + id;
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category.toLowerCase();
        document.getElementById('itemPrice').value = Number(item.price).toFixed(2);
        document.getElementById('itemQuantity').value = item.quantity;
    } else {
        document.getElementById('itemModalTitle').innerText = "Add New Item";
        document.getElementById('itemId').value = "";
        document.getElementById('itemName').value = "";
        document.getElementById('itemCategory').value = "food";
        document.getElementById('itemPrice').value = "";
        document.getElementById('itemQuantity').value = "";
    }
    itemModal.show();
}

async function saveItem() {
    const id = document.getElementById('itemId').value;
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const quantity = parseInt(document.getElementById('itemQuantity').value);

    if (!name || isNaN(price) || isNaN(quantity)) {
        showStatusModal("Input Error", "Please fill in all fields with valid data.", false);
        return;
    }

    const payload = {
        name: name,
        category: category,
        price: price,
        quantity: quantity,
        created_date: "2026-04-02",
        last_updated: "2026-04-02"
    };

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `/inventory/${id}` : '/inventory';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('itemModal')).hide();
            showStatusModal("Success", `Item ${id ? 'updated' : 'created'} successfully!`, true);
            loadAdminInventory();
        } else {
            const errData = await res.json();
            showStatusModal("Error", errData.message || "Failed to save item.", false);
        }
    } catch (error) {
        showStatusModal("Error", "Server connection failed.", false);
    }
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
        <table class="table table-striped bg-white shadow-sm align-middle">
            <thead class="table-dark">
                <tr><th>Order ID</th><th>Customer ID</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
    `;

    if (filteredOrders.length === 0) {
        html += `<tr><td colspan="4" class="text-center text-muted">No orders found.</td></tr>`;
    } else {
        filteredOrders.forEach(order => {
            let badgeClass = order.status === 'Completed' ? 'bg-success' : (order.status === 'Failed' ? 'bg-danger' : 'bg-warning text-dark');
            const displayDate = new Date(order.order_date).toLocaleDateString();

            html += `
                <tr>
                    <td><strong>#${order.id}</strong></td>
                    <td>Cust_${order.cust_id}</td>
                    <td>${displayDate}</td>
                    <td><span class="badge ${badgeClass}">${order.status}</span></td>
                </tr>
            `;
        });
    }

    html += `</tbody></table>`;
    content.innerHTML = html;
}

// ------------------------------------------
// ANALYTICS TAB (CHART.JS)
// ------------------------------------------
async function loadAnalytics() {
    const content = document.getElementById('admin-content-area');

    content.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card bg-primary text-white text-center p-3 border-0">
                    <h6>Total Products</h6>
                    <h3 id="statTotalProducts">-</h3>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-success text-white text-center p-3 border-0">
                    <h6>Total Stock Units</h6>
                    <h3 id="statTotalUnits">-</h3>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-info text-white text-center p-3 border-0">
                    <h6>Total Orders</h6>
                    <h3 id="statTotalOrders">-</h3>
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

    try {
        const [ordersRes, invRes] = await Promise.all([
            fetch('/orders'),
            fetch('/inventory')
        ]);

        const orders = await ordersRes.json();
        const inventory = await invRes.json();

        document.getElementById('statTotalProducts').innerText = inventory.length;
        document.getElementById('statTotalUnits').innerText = inventory.reduce((sum, i) => sum + i.quantity, 0);
        document.getElementById('statTotalOrders').innerText = orders.length;

        const statusCounts = {Pending: 0, Completed: 0, Failed: 0};
        orders.forEach(o => {
            if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
        });

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
            options: {cutout: '60%'}
        });

        const categoryStock = {};
        inventory.forEach(item => {
            const cat = item.category.toLowerCase();
            categoryStock[cat] = (categoryStock[cat] || 0) + item.quantity;
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
            }
        });

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

    } catch (error) {
        console.error("Analytics Error:", error);
    }
}