from flask import Flask, request, jsonify
from foodDAO import foodDAO
from clothesDAO import clothesDAO
from appliancesDAO import appliancesDAO

app = Flask(__name__)


# ===========================================
# Food endpoints
# ===========================================
@app.route('/food', methods=['GET'])
def get_all_food():
    return jsonify(foodDAO.getAll())


@app.route('/food/<int:id>', methods=['GET'])
def get_food_by_id(id):
    result = foodDAO.findByID(id)
    if result is None:
        return jsonify({"error": "Food item not found"}), 404
    return jsonify(result)


@app.route('/food', methods=['POST'])
def create_food():
    if not request.json:
        return jsonify({"error": "Invalid input"}), 400
    created = foodDAO.create(request.json)
    return jsonify(created), 201


@app.route('/food/<int:id>', methods=['PUT'])
def update_food(id):
    if not request.json:
        return jsonify({"error": "Invalid input"}), 400

    if foodDAO.findByID(id) is None:
        return jsonify({"error": "Food item not found"}), 404

    foodDAO.update(id, request.json)
    return jsonify({"message": "Food updated successfully"})


@app.route('/food/<int:id>', methods=['DELETE'])
def delete_food(id):
    if foodDAO.findByID(id) is None:
        return jsonify({"error": "Food item not found"}), 404

    foodDAO.delete(id)
    return jsonify({"message": "Food deleted successfully"})


# =====================================================
# CLOTHES ENDPOINTS
# =====================================================

@app.route('/clothes', methods=['GET'])
def get_all_clothes():
    return jsonify(clothesDAO.getAll())


@app.route('/clothes/<int:id>', methods=['GET'])
def get_clothes_by_id(id):
    result = clothesDAO.findByID(id)
    if result is None:
        return jsonify({"error": "Clothes item not found"}), 404
    return jsonify(result)


@app.route('/clothes', methods=['POST'])
def create_clothes():
    if not request.json:
        return jsonify({"error": "Invalid input"}), 400
    created = clothesDAO.create(request.json)
    return jsonify(created), 201


@app.route('/clothes/<int:id>', methods=['PUT'])
def update_clothes(id):
    if not request.json:
        return jsonify({"error": "Invalid input"}), 400

    if clothesDAO.findByID(id) is None:
        return jsonify({"error": "Clothes item not found"}), 404

    clothesDAO.update(id, request.json)
    return jsonify({"message": "Clothes updated successfully"})


@app.route('/clothes/<int:id>', methods=['DELETE'])
def delete_clothes(id):
    if clothesDAO.findByID(id) is None:
        return jsonify({"error": "Clothes item not found"}), 404

    clothesDAO.delete(id)
    return jsonify({"message": "Clothes deleted successfully"})


# =====================================================
#  APPLIANCES ENDPOINTS
# =====================================================

@app.route('/appliances', methods=['GET'])
def get_all_appliances():
    return jsonify(appliancesDAO.getAll())


@app.route('/appliances/<int:id>', methods=['GET'])
def get_appliance_by_id(id):
    result = appliancesDAO.findByID(id)
    if result is None:
        return jsonify({"error": "Appliance not found"}), 404
    return jsonify(result)


@app.route('/appliances', methods=['POST'])
def create_appliance():
    if not request.json:
        return jsonify({"error": "Invalid input"}), 400
    created = appliancesDAO.create(request.json)
    return jsonify(created), 201


@app.route('/appliances/<int:id>', methods=['PUT'])
def update_appliance(id):
    if not request.json:
        return jsonify({"error": "Invalid input"}), 400

    if appliancesDAO.findByID(id) is None:
        return jsonify({"error": "Appliance not found"}), 404

    appliancesDAO.update(id, request.json)
    return jsonify({"message": "Appliance updated successfully"})


@app.route('/appliances/<int:id>', methods=['DELETE'])
def delete_appliance(id):
    if appliancesDAO.findByID(id) is None:
        return jsonify({"error": "Appliance not found"}), 404

    appliancesDAO.delete(id)
    return jsonify({"message": "Appliance deleted successfully"})


# =========================
# API HOME Endpoint
# ==========================
@app.route('/')
def home():
    return jsonify({
        "message": "Welcome to your Shop API",
        "endpoints": [
            "/food",
            "/clothes",
            "/appliances"
        ]
    })


# =====================================================
# RUN SERVER
# =====================================================

if __name__ == '__main__':
    app.run(debug=True)
