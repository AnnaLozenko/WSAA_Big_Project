# Customer Data Access Object (DAO) for managing customers in a MySQL database.
# Author: Anna Lozenko

import mysql.connector
import config as cfg


class CustomerDAO:
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
        sql = "SELECT * FROM customer"
        cursor.execute(sql)
        results = cursor.fetchall()
        returnArray = []
        for result in results:
            returnArray.append(self.convertToDictionary(result))

        self.closeAll()
        return returnArray

    def findById(self, id):
        cursor = self.getcursor()
        sql = "select * from customer where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        result = cursor.fetchone()
        returnvalue = self.convertToDictionary(result)
        self.closeAll()
        return returnvalue

    def create(self, customer):
        cursor = self.getcursor()
        sql = "insert into customer (first_name, last_name, city, country, sex) values (%s, %s, %s, %s, %s)"
        values = (customer.get("first_name"), customer.get("last_name"), customer.get("city"),
                  customer.get("country"), customer.get("sex"))
        cursor.execute(sql, values)
        self.connection.commit()
        newid = cursor.lastrowid
        customer["id"] = newid
        self.closeAll()
        return customer

    def update(self, id, customer):
        cursor = self.getcursor()
        sql = "update customer set first_name = %, last_name=%, city=%, country=%, sex=% where id=%s"
        values = (customer.get("first_name"), customer.get("last_name"), customer.get("city"), customer.get("country"),
                  customer.get("sex"), id)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    def delete(self, id):
        cursor = self.getcursor()
        sql = "delete from customer where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    def convertToDictionary(self, resultLine):
        attkeys = ['id', 'first_name', 'last_name', 'city', 'country', 'sex']
        customer = {}
        currentkey = 0
        for attrib in resultLine:
            customer[attkeys[currentkey]] = attrib
            currentkey = currentkey + 1
        return customer


customerDAO = CustomerDAO()
