# Shop Appliances DAO - Data Access Object for the shop database
# Author: Anna Lozenko

import mysql.connector
import config as cfg


class AppliancesDAO:
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

    # get all appliances from the database and return them as a list of dictionaries
    def getAll(self):
        cursor = self.getcursor()
        sql = "select * from appliances"
        cursor.execute(sql)
        results = cursor.fetchall()
        returnArray = []
        for result in results:
            returnArray.append(self.convertToDictionary(result))
        self.closeAll()
        return returnArray

    # find an appliance by its id and return it as a dictionary
    def findByID(self, id):
        cursor = self.getcursor()
        sql = "select * from appliances where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        result = cursor.fetchone()
        returnvalue = self.convertToDictionary(result)
        if result is None:
            self.closeAll()
            return None
        self.closeAll()
        return returnvalue

    # create a new appliance in the database and return the created item as a dictionary
    def create(self, appliances):
        cursor = self.getcursor()
        sql = "insert into appliances (name, category, brand, power_rating, energy_class, color, price, discount, stock, warranty_years) values (%s,%s,%s, %s,%s,%s, %s,%s,%s, %s)"
        values = (appliances.get("name"), appliances.get("category"), appliances.get("brand"),
                  appliances.get("power_rating"), appliances.get("energy_class"), appliances.get("color"),
                  appliances.get("price"), appliances.get("discount"), appliances.get("stock"),
                  appliances.get("warranty_years"))
        cursor.execute(sql, values)
        self.connection.commit()
        newid = cursor.lastrowid
        appliances["id"] = newid
        self.closeAll()
        return appliances

    # update an existing appliance in the database and return the updated item as a dictionary
    def update(self, id, appliances):
        cursor = self.getcursor()
        sql = "update appliances set name= %s,category=%s, brand=%s, power_rating=%s, energy_class=%s, color=%s, price=%s, discount=%s, stock=%s, warranty_years=%s  where id = %s"
        print(f"update appliances {appliances}")
        values = (
            appliances.get("name"),
            appliances.get("category"),
            appliances.get("brand"),
            appliances.get("power_rating"),
            appliances.get("energy_class"),
            appliances.get("color"),
            appliances.get("price"),
            appliances.get("discount"),
            appliances.get("stock"),
            appliances.get("warranty_years"),
            id
        )
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    # delete an appliance from the database by its id
    def delete(self, id):
        cursor = self.getcursor()
        sql = "delete from appliances where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    # convert a result line from the database into a dictionary with the appropriate keys
    def convertToDictionary(self, resultLine):
        attkeys = ['id', 'name', 'category', "brand", "power_rating", "energy_class", "color", "price", "discount",
                   "stock", "warranty_years"]
        appliances = {}
        currentkey = 0
        for attrib in resultLine:
            appliances[attkeys[currentkey]] = attrib
            currentkey = currentkey + 1
        return appliances


appliancesDAO = AppliancesDAO()
