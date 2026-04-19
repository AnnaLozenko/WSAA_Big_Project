# Order Items Data Access Object (DAO) for managing ordered items in a MySQL database.
# Author: Anna Lozenko

import mysql.connector
import config as cfg


class Order_itemsDAO:
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

    def getAll(self):
        cursor = self.getcursor()
        sql = "SELECT * FROM order_items"
        cursor.execute(sql)
        results = cursor.fetchall()
        returnArray = []
        for result in results:
            returnArray.append(self.convertToDictionary(result))

        self.closeAll()
        return returnArray

    def findById(self, id):
        cursor = self.getcursor()
        sql = "select * from order_items where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        result = cursor.fetchone()
        returnvalue = self.convertToDictionary(result)
        self.closeAll()
        return returnvalue

    def create(self, order_items):
        cursor = self.getcursor()
        sql = "insert into order_items (order_id, inv_id, price, quantity) values (%s, %s, %s, %s)"
        values = (order_items.get('order_id'), order_items.get('inv_id'), order_items.get('price'),
                  order_items.get('quantity'))
        cursor.execute(sql, values)
        self.connection.commit()
        newid = cursor.lastrowid
        order_items["id"] = newid
        self.closeAll()
        return order_items

    def update(self, id, order_items):
        cursor = self.getcursor()
        sql = "update order_items set order_id = %s, inv_id = %s, price = %s, quantity = %s where id = %s"
        values = (order_items.get('order_id'), order_items.get('inv_id'), order_items.get('price'),
                  order_items.get('quantity'), id)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    def delete(self, id):
        cursor = self.getcursor()
        sql = "delete from order_items where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    def convertToDictionary(self, resultLine):
        attkeys = ['id', 'order_id', 'inv_id', 'price', 'quantity']
        order_items = {}
        currentkey = 0
        for attrib in resultLine:
            order_items[attkeys[currentkey]] = attrib
            currentkey = currentkey + 1
        return order_items


order_itemsDAO = Order_itemsDAO()
