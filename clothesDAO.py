# Shop Clothes DAO - Data Access Object for the shop database
# Author: Anna Lozenko

import mysql.connector
import config as cfg


class ClothesDAO:
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
# get all clothes from the database and return them as a list of dictionaries
    def getAll(self):
        cursor = self.getcursor()
        sql = "select * from clothes"
        cursor.execute(sql)
        results = cursor.fetchall()
        returnArray = []
        # print(results)
        for result in results:
            # print(result)
            returnArray.append(self.convertToDictionary(result))
        self.closeAll()
        return returnArray

# find a clothes item by its id and return it as a dictionary
    def findByID(self, id):
        cursor = self.getcursor()
        sql = "select * from clothes where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        result = cursor.fetchone()
        returnvalue = self.convertToDictionary(result)
        self.closeAll()
        return returnvalue

# create a new clothes item in the database and return the created item as a dictionary
    def create(self, clothes):
        cursor = self.getcursor()
        sql = "insert into clothes (name,category, size, gender, color, brand, style, price, discount, stock) values (%s,%s,%s, %s,%s,%s, %s,%s,%s, %s)"
        values = (clothes.get("title"), clothes.get("author"), clothes.get("price"))
        cursor.execute(sql, values)
        self.connection.commit()
        newid = cursor.lastrowid
        clothes["id"] = newid
        self.closeAll()
        return clothes

# update an existing clothes item in the database and return the updated item as a dictionary
    def update(self, id, clothes):
        cursor = self.getcursor()
        sql = "update clothes set name= %s,category=%s, size=%s, gender=%s, color=%s, brand=%s, style=%s, price=%s, discount=%s, stock=%s  where id = %s"
        print(f"update clothes {clothes}")
        values = (clothes.get("title"), clothes.get("author"), clothes.get("price"), id)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

# delete an existing clothes item in the database by its id
    def delete(self, id):
        cursor = self.getcursor()
        sql = "delete from clothes where id = %s"
        values = (id,)
        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

# convert a clothes item from a tuple to a dictionary
    def convertToDictionary(self, resultLine):
        attkeys = ['id', 'name', 'category, size, gender, color, brand, style, price, discount, stock']
        clothes = {}
        currentkey = 0
        for attrib in resultLine:
            clothes[attkeys[currentkey]] = attrib
            currentkey = currentkey + 1
        return clothes


clothesDAO = ClothesDAO()