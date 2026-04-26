CREATE DATABASE IF NOT EXISTS shop;
USE shop;

CREATE TABLE IF NOT EXISTS shop.customer (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  first_name varchar(250) NOT NULL,
  last_name varchar(250) NOT NULL,
  city varchar(250) DEFAULT NULL,
  country varchar(250) DEFAULT NULL,
  sex enum('M','F') DEFAULT NULL
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS shop.inventory (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name varchar(255) NOT NULL,
  category varchar(255) DEFAULT NULL,
  price decimal(10,2) DEFAULT NULL,
  quantity int DEFAULT NULL,
  created_date date DEFAULT NULL,
  last_updated date DEFAULT NULL
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS shop.orders (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cust_id int NOT NULL,
  order_date date DEFAULT NULL,
  status enum('Pending','Completed','Failed') DEFAULT NULL,
  CONSTRAINT fk_cust_id FOREIGN KEY (cust_id) REFERENCES shop.customer (id)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS shop.order_items (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id int NOT NULL,
  inv_id int NOT NULL,
  price decimal(10,2) DEFAULT NULL,
  quantity int DEFAULT NULL,
  CONSTRAINT fk_inv_id FOREIGN KEY (inv_id) REFERENCES shop.inventory (id),
  CONSTRAINT fk_order_id FOREIGN KEY (order_id) REFERENCES shop.orders (id)
) ENGINE=InnoDB;
