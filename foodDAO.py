# Shop Food DAO - Data Access Object for the shop database
# Author: Anna Lozenko

import mysql.connector
import config as cfg


class FoodDAO:
    connection = ""
    cursor = ''
    host = ''
    user = ''
    password = ''
    database = ''

    def __init__(self):
        self.host = cfg.mysql['host']
        self.user = cfg.mysql['user']
        self.password = cfg.mysql['password']
        self.database = cfg.mysql['database']

    def getcursor(self):
        self.connection = mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database,
        )
        self.cursor = self.connection.cursor()
        return self.cursor

    def closeAll(self):
        self.connection.close()
        self.cursor.close()

    # get all food items from the database and return them as a list of dictionaries
    """
    getAll method retrieves all food items from the database, with optional filtering based on query parameters. It constructs a dynamic SQL query based on the provided filters, executes it, and returns the results as a list of dictionaries representing each food item.
    """

    def getAll(self, filters=None):
        cursor = self.getcursor()

        sql = "SELECT * FROM food"
        values = []

        # Build WHERE clause dynamically. Items can be filtered based on parameters.
        if filters:
            conditions = []

            if 'category' in filters:
                # add conditions dynamically
                conditions.append("category = %s")
                values.append(filters['category'])
            # price less than
            if 'price_lt' in filters:
                conditions.append("price < %s")
                values.append(filters['price_lt'])
            # price greater than
            if 'price_gt' in filters:
                conditions.append("price > %s")
                values.append(filters['price_gt'])
            # stock less than
            if 'stock_lt' in filters:
                conditions.append("stock < %s")
                values.append(filters['stock_lt'])
            # stock greater than
            if 'stock_gt' in filters:
                conditions.append("stock > %s")
                values.append(filters['stock_gt'])
            # filter by name with partial match
            if 'name' in filters:
                conditions.append("name LIKE %s")
                values.append(f"%{filters['name']}%")
            #
            if conditions:
                sql += " WHERE " + " AND ".join(conditions)

        print("SQL:", sql)
        print("VALUES:", values)

        cursor.execute(sql, tuple(values))
        results = cursor.fetchall()

        returnArray = []
        for result in results:
            returnArray.append(self.convertToDictionary(result))

        self.closeAll()
        return returnArray

    # find a food item by its id and return it as a dictionary
    def findByID(self, id):
        cursor = self.getcursor()
        sql = "select * from food where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        result = cursor.fetchone()
        returnvalue = self.convertToDictionary(result)
        self.closeAll()
        return returnvalue

    #  create a new food item in the database and return the created item as a dictionary
    def create(self, food):
        cursor = self.getcursor()
        sql = "insert into food (name,category, weight, brand, price, discount, stock, expiration_date) values (%s,%s,%s, %s,%s,%s, %s,%s)"
        values = (food.get("name"), food.get("category"), food.get("weight"), food.get("brand"), food.get("price"),
                  food.get("discount"), food.get("stock"), food.get("expiration_date"))
        cursor.execute(sql, values)
        self.connection.commit()
        newid = cursor.lastrowid
        food["id"] = newid
        self.closeAll()
        return food

    # update an existing food item in the database by its id and return the updated item as a dictionary
    def update(self, id, food):
        cursor = self.getcursor()
        sql = "update food set name= %s,category=%s, weight=%s, brand=%s, price=%s, discount=%s, stock=%s, expiration_date=%s  where id = %s"
        print(f"update food {food}")
        values = (food.get("name"), food.get("category"), food.get("weight"), food.get("brand"), food.get("price"),
                  food.get("discount"), food.get("stock"), food.get("expiration_date"), id)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    # delete a food item from the database by its id
    def delete(self, id):
        cursor = self.getcursor()
        sql = "delete from food where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    # convert a database result line (tuple) into a dictionary with appropriate keys for the food item attributes
    def convertToDictionary(self, resultLine):
        attkeys = ['id', 'name', 'category', "weight", "brand", "price", "discount", "stock", "expiration_date"]
        food = {}
        currentkey = 0
        for attrib in resultLine:
            food[attkeys[currentkey]] = attrib
            currentkey = currentkey + 1
        return food


foodDAO = FoodDAO()
