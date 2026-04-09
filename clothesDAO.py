# Shop Clothes DAO - Data Access Object for the shop database
# Author: Anna Lozenko

import mysql.connector
import config as cfg


class ClothesDAO:
    def __init__(self):
        self.host = cfg.mysql['host']
        self.user = cfg.mysql['user']
        self.password = cfg.mysql['password']
        self.database = cfg.mysql['database']
        self.connection = None
        self.cursor = None

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
        if self.connection:
            self.connection.close()
        if self.cursor:
            self.cursor.close()

    # =====================================================
    # GET ALL
    # =====================================================
    def getAll(self):
        cursor = self.getcursor()
        cursor.execute("SELECT * FROM clothes")
        results = cursor.fetchall()

        returnArray = []
        for result in results:
            returnArray.append(self.convertToDictionary(result))

        self.closeAll()
        return returnArray

    # =====================================================
    # GET BY ID
    # =====================================================
    def findByID(self, id):
        cursor = self.getcursor()
        cursor.execute("SELECT * FROM clothes WHERE id = %s", (id,))
        result = cursor.fetchone()

        if result is None:
            self.closeAll()
            return None

        returnvalue = self.convertToDictionary(result)
        self.closeAll()
        return returnvalue

    # =====================================================
    # CREATE
    # =====================================================
    def create(self, clothes):
        cursor = self.getcursor()

        sql = """
              INSERT INTO clothes
              (name, category, size, gender, color, brand, style, price, discount, stock)
              VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) \
              """

        values = (
            clothes.get("name"),
            clothes.get("category"),
            clothes.get("size"),
            clothes.get("gender"),
            clothes.get("color"),
            clothes.get("brand"),
            clothes.get("style"),
            clothes.get("price"),
            clothes.get("discount"),
            clothes.get("stock")
        )

        cursor.execute(sql, values)
        self.connection.commit()

        clothes["id"] = cursor.lastrowid
        self.closeAll()
        return clothes

    # =====================================================
    # UPDATE
    # =====================================================
    def update(self, id, clothes):
        cursor = self.getcursor()

        sql = """
              UPDATE clothes
              SET name=%s,
                  category=%s,
                  size=%s,
                  gender=%s,
                  color=%s,
                  brand=%s,
                  style=%s,
                  price=%s,
                  discount=%s,
                  stock=%s
              WHERE id = %s \
              """

        values = (
            clothes.get("name"),
            clothes.get("category"),
            clothes.get("size"),
            clothes.get("gender"),
            clothes.get("color"),
            clothes.get("brand"),
            clothes.get("style"),
            clothes.get("price"),
            clothes.get("discount"),
            clothes.get("stock"),
            id
        )

        cursor.execute(sql, values)
        self.connection.commit()
        self.closeAll()

    # =====================================================
    # DELETE
    # =====================================================
    def delete(self, id):
        cursor = self.getcursor()
        cursor.execute("DELETE FROM clothes WHERE id = %s", (id,))
        self.connection.commit()
        self.closeAll()

    # =====================================================
    # CONVERT
    # =====================================================
    def convertToDictionary(self, resultLine):
        keys = [
            'id', 'name', 'category', 'size', 'gender',
            'color', 'brand', 'style', 'price', 'discount', 'stock'
        ]

        clothes = {}
        for i in range(len(keys)):
            clothes[keys[i]] = resultLine[i]

        return clothes


clothesDAO = ClothesDAO()
