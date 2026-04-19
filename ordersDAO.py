# Orders Data Access Object (DAO) for managing orders in a MySQL database.
# Author: Anna Lozenko

import mysql.connector
import config as cfg


class OrdersDAO:
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
        sql = "SELECT * FROM orders"
        cursor.execute(sql)
        results = cursor.fetchall()
        returnArray = []
        for result in results:
            returnArray.append(self.convertToDictionary(result))

        self.closeAll()
        return returnArray

    def findById(self, id):
        cursor = self.getcursor()
        sql = "select * from orders where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        result = cursor.fetchone()
        returnvalue = self.convertToDictionary(result)
        self.closeAll()
        return returnvalue

    def create(self, orders):
        cursor = self.getcursor()
        sql = "insert into orders (cust_id, order_date, status) values (%s, %s, %s)"
        values = (orders.get("cust_id"), orders.get("order_date"), orders.get("status"))
        cursor.execute(sql, values)
        self.connection.commit()
        newid = cursor.lastrowid
        orders["id"] = newid
        self.closeAll()
        return orders

    def update(self, id, orders):
        cursor = self.getcursor()
        sql = "update orders set cust_id = %s, order_date = %s, status = %s where id = %s"
        values = (orders.get("cust_id"), orders.get("order_date"), orders.get("status"), id)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    def delete(self, id):
        cursor = self.getcursor()
        sql = "delete from orders where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    def convertToDictionary(self, resultLine):
        attkeys = ['id', 'cust_id', 'order_date', 'status']
        orders = {}
        currentkey = 0
        for attrib in resultLine:
            orders[attkeys[currentkey]] = attrib
            currentkey = currentkey + 1
        return orders


ordersDAO = OrdersDAO()
