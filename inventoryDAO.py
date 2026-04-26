# Inventory Data Access Object (DAO) for managing inventory items in a MySQL database.
# Author: Anna Lozenko

import mysql.connector
import config as cfg


class InventoryDAO:
    connection = ""
    cursor = ''
    host = ''
    user = ''
    password = ''
    database = ''

    def __init__(self):
        self.host = cfg.mysql['host']
        self.port = cfg.mysql['port']
        self.user = cfg.mysql['user']
        self.password = cfg.mysql['password']
        self.database = cfg.mysql['database']

    def getcursor(self):
        self.connection = mysql.connector.connect(
            host=self.host,
            port=self.port,
            user=self.user,
            password=self.password,
            database=self.database,
        )
        self.cursor = self.connection.cursor()
        return self.cursor

    def closeAll(self):
        self.connection.close()
        self.cursor.close()

    def getAll(self):
        cursor = self.getcursor()
        sql = "SELECT * FROM inventory"
        cursor.execute(sql)
        results = cursor.fetchall()
        returnArray = []
        for result in results:
            returnArray.append(self.convertToDictionary(result))

        self.closeAll()
        return returnArray

    def findById(self, id):
        cursor = self.getcursor()
        sql = "select * from inventory where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        result = cursor.fetchone()
        returnvalue = self.convertToDictionary(result)
        self.closeAll()
        return returnvalue

    def create(self, inventory):
        cursor = self.getcursor()
        sql = "insert into inventory (name, category, price, quantity, created_date, last_updated) values (%s, %s, %s, %s, %s, %s)"
        values = (inventory.get("name"), inventory.get("category"), inventory.get("price"), inventory.get("quantity"),
                  inventory.get("created_date"), inventory.get("last_updated"))
        cursor.execute(sql, values)
        self.connection.commit()
        newid = cursor.lastrowid
        inventory["id"] = newid
        self.closeAll()
        return inventory

    def update(self, id, inventory):
        cursor = self.getcursor()
        sql = "update inventory set name= %s, category=%s, price=%s, quantity=%s, created_date=%s, last_updated=%s where id = %s"
        values = (inventory.get("name"), inventory.get("category"), inventory.get("price"), inventory.get("quantity"),
                  inventory.get("created_date"), inventory.get("last_updated"), id)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    def delete(self, id):
        cursor = self.getcursor()
        sql = "delete from inventory where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    def convertToDictionary(self, resultLine):
        attkeys = ['id', 'name', 'category', 'price', 'quantity', 'created_date', 'last_updated']
        inventory = {}
        currentkey = 0
        for attrib in resultLine:
            inventory[attkeys[currentkey]] = attrib
            currentkey = currentkey + 1
        return inventory


inventoryDAO = InventoryDAO()
