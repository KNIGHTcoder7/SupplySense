import pymongo
from datetime import datetime, timedelta
import random

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["inventory_db"]

# Sample Suppliers
db.suppliers.insert_many([
    {"name": "Acme Corp", "contact_info": "acme@example.com", "lead_time_days": 5, "reliability_score": 0.95},
    {"name": "Global Widgets", "contact_info": "widgets@example.com", "lead_time_days": 7, "reliability_score": 0.9},
    {"name": "SupplyCo", "contact_info": "supplyco@example.com", "lead_time_days": 3, "reliability_score": 0.98},
])

# Sample Warehouses
db.warehouses.insert_many([
    {"name": "Central Warehouse", "address": "123 Main St"},
    {"name": "East Warehouse", "address": "456 East Ave"},
    {"name": "West Warehouse", "address": "789 West Blvd"},
])

# Sample Products
db.products.insert_many([
    {"name": "Widget A", "sku": "WIDGET-A", "category": "Widgets", "stock": 120, "min_stock": 30, "price": 10.5},
    {"name": "Widget B", "sku": "WIDGET-B", "category": "Widgets", "stock": 80, "min_stock": 20, "price": 12.0},
    {"name": "Gadget X", "sku": "GADGET-X", "category": "Gadgets", "stock": 200, "min_stock": 50, "price": 8.75},
])

# Sample Purchase Orders
db["purchase_orders"].insert_many([
    {"supplier_id": str(db.suppliers.find_one({"name": "Acme Corp"})["_id"]),
     "items": [{"product_id": str(db.products.find_one({"name": "Widget A"})["_id"]), "quantity": 50, "price": 10.5}],
     "status": "pending", "order_date": datetime.now().isoformat(), "expected_delivery": (datetime.now() + timedelta(days=5)).isoformat()},
])

# Sample Stock Transfers
db["stock_transfers"].insert_many([
    {"from_warehouse": str(db.warehouses.find_one({"name": "Central Warehouse"})["_id"]),
     "to_warehouse": str(db.warehouses.find_one({"name": "East Warehouse"})["_id"]),
     "items": [{"product_id": str(db.products.find_one({"name": "Widget B"})["_id"]), "quantity": 10}],
     "status": "in transit", "transfer_date": datetime.now().isoformat()},
])

# Sample Shipments
db["shipments"].insert_many([
    {"purchase_order_id": str(db.purchase_orders.find_one()["_id"]),
     "warehouse_id": str(db.warehouses.find_one({"name": "Central Warehouse"})["_id"]),
     "status": "shipped", "expected_delivery": (datetime.now() + timedelta(days=3)).isoformat(), "actual_delivery": ""},
])

# Sample Orders
db["orders"].insert_many([
    {"customer_info": {"name": "John Doe", "email": "john@example.com", "phone": "1234567890"},
     "items": [{"product_id": str(db.products.find_one({"name": "Gadget X"})["_id"]), "quantity": 2, "price": 8.75}],
     "status": "processing", "delivery_address": "789 Customer Rd", "placed_date": datetime.now().isoformat()},
])

# Sample Deliveries
db["deliveries"].insert_many([
    {"order_id": str(db.orders.find_one()["_id"]),
     "status": "pending", "delivery_date": (datetime.now() + timedelta(days=2)).isoformat(), "proof_of_delivery": ""},
])

print("Sample data inserted successfully!") 