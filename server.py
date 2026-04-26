from flask import Flask, jsonify, request, abort, render_template  # Added render_template
from inventoryDAO import inventoryDAO
from customerDAO import customerDAO
from ordersDAO import ordersDAO
from order_itemsDAO import order_itemsDAO
import os

app = Flask(__name__)

basedir = os.path.abspath(os.path.dirname(__file__))


@app.route('/')
def home():
    # FIX 2: Use render_template to serve index.html from the /templates folder
    return render_template('index.html')


# ==========================================
# INVENTORY ENDPOINTS
# ==========================================

@app.route('/inventory', methods=['GET'])
def get_all_inventory():
    results = inventoryDAO.getAll()
    return jsonify(results)


@app.route('/inventory/<int:id>', methods=['GET'])
def get_inventory_by_id(id):
    result = inventoryDAO.findById(id)
    if not result:
        abort(404)
    return jsonify(result)


@app.route('/inventory', methods=['POST'])
def create_inventory():
    if not request.json:
        abort(400, description="Missing JSON body")

    inventory = {
        "name": request.json.get('name'),
        "category": request.json.get('category'),
        "price": request.json.get('price'),
        "quantity": request.json.get('quantity'),
        "created_date": request.json.get('created_date'),
        "last_updated": request.json.get('last_updated')
    }
    added_inventory = inventoryDAO.create(inventory)
    return jsonify(added_inventory), 201


@app.route('/inventory/<int:id>', methods=['PUT'])
def update_inventory_full(id):
    found = inventoryDAO.findById(id)
    if not found:
        abort(404)
    if not request.json:
        abort(400)

    req = request.json
    inventoryDAO.update(id, req)
    return jsonify({"message": "Inventory fully updated", "id": id})


@app.route('/inventory/<int:id>', methods=['PATCH'])
def update_inventory_partial(id):
    found = inventoryDAO.findById(id)
    if not found:
        abort(404)
    if not request.json:
        abort(400)

    req = request.json
    for key in req:
        if key in found:
            found[key] = req[key]

    inventoryDAO.update(id, found)
    return jsonify({"message": "Inventory partially updated", "inventory": found})


@app.route('/inventory/<int:id>', methods=['DELETE'])
def delete_inventory(id):
    found = inventoryDAO.findById(id)
    if not found:
        abort(404)
    inventoryDAO.delete(id)
    return jsonify({"message": "deleted", "id": id})


# ==========================================
# CUSTOMER ENDPOINTS
# ==========================================

@app.route('/customers', methods=['GET'])
def get_all_customers():
    return jsonify(customerDAO.getAll())


@app.route('/customers', methods=['POST'])
def create_customer():
    if not request.json:
        abort(400)
    customer = request.json
    return jsonify(customerDAO.create(customer)), 201


# ==========================================
# ORDERS ENDPOINTS
# ==========================================

@app.route('/orders', methods=['GET'])
def get_all_orders():
    return jsonify(ordersDAO.getAll())


@app.route('/orders', methods=['POST'])
def create_order():
    if not request.json:
        abort(400)
    req = request.json
    order = {
        "cust_id": req.get('cust_id'),
        "order_date": req.get('order_date'),
        "status": "Pending"
    }
    return jsonify(ordersDAO.create(order)), 201


# ==========================================
# CART / ORDER ITEMS ENDPOINTS
# ==========================================

@app.route('/order_items', methods=['GET'])
def get_all_order_items():
    return jsonify(order_itemsDAO.getAll())


@app.route('/order_items/<int:id>', methods=['GET'])
def get_order_item_by_id(id):
    result = order_itemsDAO.findById(id)
    if not result:
        abort(404)
    return jsonify(result)


@app.route('/order_items', methods=['POST'])
def add_to_cart():
    if not request.json:
        abort(400)
    return jsonify(order_itemsDAO.create(request.json)), 201


@app.route('/order_items/<int:id>', methods=['PATCH'])
def change_cart_quantity(id):
    found = order_itemsDAO.findById(id)
    if not found:
        abort(404)
    if 'quantity' in request.json:
        found['quantity'] = request.json['quantity']
        order_itemsDAO.update(id, found)
    return jsonify({"message": "Cart updated", "item": found})


# ==========================================
# CHECKOUT LOGIC
# ==========================================

@app.route('/orders/<int:order_id>/checkout', methods=['POST'])
def process_checkout(order_id):
    order = ordersDAO.findById(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    if order['status'] != 'Pending':
        return jsonify({"error": f"Order is already {order['status']}"}), 400

    all_order_items = order_itemsDAO.getAll()
    items_in_cart = [item for item in all_order_items if item['order_id'] == order_id]

    if not items_in_cart:
        return jsonify({"error": "No items in this order"}), 400

    for item in items_in_cart:
        inv_item = inventoryDAO.findById(item['inv_id'])
        if not inv_item or inv_item['quantity'] < item['quantity']:
            order['status'] = 'Failed'
            ordersDAO.update(order_id, order)
            return jsonify({
                "message": "Checkout failed due to insufficient stock",
                "failed_item_id": item['inv_id'],
                "order_status": "Failed"
            }), 409

    for item in items_in_cart:
        inv_item = inventoryDAO.findById(item['inv_id'])
        inv_item['quantity'] -= item['quantity']
        inventoryDAO.update(inv_item['id'], inv_item)

    order['status'] = 'Completed'
    ordersDAO.update(order_id, order)

    return jsonify({
        "message": "Order processed successfully!",
        "order_status": "Completed"
    }), 200


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=False)
