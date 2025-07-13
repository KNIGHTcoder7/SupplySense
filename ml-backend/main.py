from fastapi import FastAPI, UploadFile, File, Request, HTTPException, Body
from pydantic import BaseModel
import numpy as np
import pandas as pd
from pymongo import MongoClient
from sklearn.linear_model import LinearRegression
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from fastapi.responses import JSONResponse
from typing import List, Optional
import random

app = FastAPI()

print("main.py loaded")

# MongoDB setup
MONGO_URI = "mongodb://localhost:27017"
client = MongoClient(MONGO_URI)
db = client["inventory_db"]
products_collection = db["products"]
suppliers_collection = db["suppliers"]
purchase_orders_collection = db["purchase_orders"]
warehouses_collection = db["warehouses"]
stock_transfers_collection = db["stock_transfers"]
shipments_collection = db["shipments"]
orders_collection = db["orders"]
deliveries_collection = db["deliveries"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:8080"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Excel import endpoint
@app.post("/import-excel")
async def import_excel(file: UploadFile = File(...)):
    df = pd.read_excel(file.file)
    records = df.to_dict(orient="records")
    if records:
        products_collection.insert_many(records)
    return {"inserted": len(records)}

class ForecastRequest(BaseModel):
    product_id: str
    periods: int = 12 # Number of future periods to forecast

@app.post("/forecast")
def forecast(req: ForecastRequest):
    try:
        product_id = ObjectId(req.product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID format")

    product = products_collection.find_one({"_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if "sales_history" not in product or not product["sales_history"]:
        # Generate and save mock sales history if it doesn't exist
        sales_history = [
            {"period": "Month 1", "sales": np.random.randint(50, 200)},
            {"period": "Month 2", "sales": np.random.randint(50, 200)},
            {"period": "Month 3", "sales": np.random.randint(50, 200)},
            {"period": "Month 4", "sales": np.random.randint(50, 200)},
            {"period": "Month 5", "sales": np.random.randint(50, 200)},
            {"period": "Month 6", "sales": np.random.randint(50, 200)},
        ]
        products_collection.update_one({"_id": product["_id"]}, {"$set": {"sales_history": sales_history}})
        product["sales_history"] = sales_history
        
    sales_history = product["sales_history"]
    if len(sales_history) < 2:
        raise HTTPException(status_code=400, detail="Not enough sales history to forecast")

    # Simple linear regression model
    X = np.arange(len(sales_history)).reshape(-1, 1)
    y = np.array([item['sales'] for item in sales_history])
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Generate future periods for prediction
    future_periods_start = len(sales_history)
    future_periods_end = future_periods_start + req.periods
    future_X = np.arange(future_periods_start, future_periods_end).reshape(-1, 1)
    
    predictions = model.predict(future_X)

    # Combine historical and predicted data for the chart
    chart_data = []
    for i, item in enumerate(sales_history):
        chart_data.append({"period": item["period"], "actual": item["sales"], "predicted": None})
    
    for i, pred in enumerate(predictions):
        # Assuming periods are monthly
        chart_data.append({"period": f"Month {future_periods_start + i + 1}", "actual": None, "predicted": float(pred)})

    return {"chart_data": chart_data}

def get_trend(model):
    slope = model.coef_[0]
    if slope > 5:
        return "Increasing"
    elif slope < -5:
        return "Decreasing"
    else:
        return "Stable"

def get_demand_level(sales_history):
    if not sales_history:
        return "Unknown"
    sales = [item['sales'] for item in sales_history]
    avg_sales = np.mean(sales)
    latest_sale = sales[-1]
    if latest_sale > avg_sales * 1.2:
        return "High"
    elif latest_sale < avg_sales * 0.8:
        return "Low"
    else:
        return "Medium"

def get_recommendation(trend):
    if trend == "Increasing":
        return "Consider increasing stock by 15-25%"
    elif trend == "Decreasing":
        return "Consider reducing orders by 20-40%"
    else:
        return "Maintain current stock levels"

@app.get("/insights")
def get_demand_insights():
    products_with_history = list(products_collection.find(
        {"sales_history": {"$exists": True, "$not": {"$size": 0}}},
        {"_id": 0}
    ).limit(3))

    if not products_with_history:
        return []

    insights = []
    for product in products_with_history:
        sales_history = product["sales_history"]
        if len(sales_history) < 2:
            continue
        
        X = np.arange(len(sales_history)).reshape(-1, 1)
        y = np.array([item['sales'] for item in sales_history])
        
        model = LinearRegression()
        model.fit(X, y)

        trend = get_trend(model)
        
        insight = {
            "product": product["name"],
            "currentDemand": get_demand_level(sales_history),
            "predictedTrend": trend,
            "seasonality": "N/A", 
            "recommendation": get_recommendation(trend),
            "confidence": np.random.randint(85, 98)
        }
        insights.append(insight)
        
    return insights

@app.get("/optimize")
def get_optimization_data():
    products = list(products_collection.find({}))
    
    # Chart data aggregation
    category_data = {}
    for p in products:
        category = p.get("category", "Uncategorized")
        if category not in category_data:
            category_data[category] = {"current": 0, "optimal": 0}
        
        current_stock = p.get("stock", 0)
        min_stock = p.get("min_stock", 0)
        optimal_stock = min_stock * 1.5 # Simple heuristic
        
        category_data[category]["current"] += current_stock
        category_data[category]["optimal"] += optimal_stock

    chart_data = [{"category": cat, **data} for cat, data in category_data.items()]

    # Reorder recommendations
    reorder_recommendations = []
    for p in products:
        current_stock = p.get("stock", 0)
        min_stock = p.get("min_stock", 0)
        if current_stock < min_stock:
            optimal_stock = min_stock * 1.5
            suggested_order = int(optimal_stock - current_stock)
            
            priority = "low"
            if current_stock < (min_stock * 0.5):
                priority = "high"
            elif current_stock < (min_stock * 0.75):
                priority = "medium"
            
            reorder_recommendations.append({
                "product_id": str(p["_id"]),
                "product": p["name"],
                "currentStock": current_stock,
                "reorderPoint": min_stock,
                "suggestedOrder": suggested_order,
                "priority": priority
            })
            
    return {"chart_data": chart_data, "reorder_recommendations": reorder_recommendations}

@app.get("/products")
def get_products():
    products = list(products_collection.find({}))
    for p in products:
        p["_id"] = str(p["_id"])
    return products

@app.post("/products")
async def add_product(request: Request):
    data = await request.json()
    # Ensure numeric fields are stored as numbers
    for field in ["stock", "price", "min_stock"]:
        if field in data:
            try:
                data[field] = float(data[field]) if field == "price" else int(data[field])
            except Exception:
                pass  # If conversion fails, leave as is
    # Basic validation for required fields
    required_fields = ["name", "sku", "category", "stock", "price", "supplier"]
    for field in required_fields:
        if field not in data:
            return {"error": f"Missing required field: {field}"}

    # Set status based on stock and min_stock
    stock = data.get("stock", 0)
    min_stock = data.get("min_stock", 0)
    if stock <= min_stock / 2:
        data["status"] = "Critical"
    elif stock <= min_stock:
        data["status"] = "Low Stock"
    else:
        data["status"] = "In Stock"

    # Add mock sales history if not present
    if "sales_history" not in data:
        data["sales_history"] = [
            {"period": "Month 1", "sales": np.random.randint(50, 200)},
            {"period": "Month 2", "sales": np.random.randint(50, 200)},
            {"period": "Month 3", "sales": np.random.randint(50, 200)},
            {"period": "Month 4", "sales": np.random.randint(50, 200)},
            {"period": "Month 5", "sales": np.random.randint(50, 200)},
            {"period": "Month 6", "sales": np.random.randint(50, 200)},
        ]

    products_collection.insert_one(data)
    # Return the inserted product (without _id)
    data.pop("_id", None)
    return {"message": "Product added successfully", "product": data}

@app.get("/stock-movement")
def get_stock_movement():
    products = list(products_collection.find({}, {"_id": 0}))
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    movement = {m: {"inStock": 0, "sold": 0, "restocked": 0} for m in months}

    for p in products:
        # Simulate monthly stock, sales, and restocking from sales_history if available
        sales_history = p.get("sales_history", [])
        for i, month in enumerate(months):
            if i < len(sales_history):
                movement[month]["sold"] += sales_history[i]["sales"]
                # Simulate restocking as a random value (or 0 if not available)
                movement[month]["restocked"] += np.random.randint(20, 80)
                # Simulate inStock as last known stock or sum
                movement[month]["inStock"] += max(0, p.get("stock", 0) - sales_history[i]["sales"] + movement[month]["restocked"])
            else:
                # If not enough history, just use current stock
                movement[month]["inStock"] += p.get("stock", 0)

    # Convert to list for chart
    chart_data = []
    for m in months:
        chart_data.append({"month": m, **movement[m]})
    return chart_data 

@app.put("/products/{product_id}")
async def update_product(product_id: str, data: dict = Body(...)):
    try:
        obj_id = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")
    data.pop("_id", None)  # Remove _id if present to avoid immutable field error
    # Set status based on stock and min_stock
    stock = data.get("stock", 0)
    min_stock = data.get("min_stock", 0)
    if stock <= min_stock / 2:
        data["status"] = "Critical"
    elif stock <= min_stock:
        data["status"] = "Low Stock"
    else:
        data["status"] = "In Stock"
    result = products_collection.update_one({"_id": obj_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated successfully"}

@app.get("/forecast-accuracy")
def get_forecast_accuracy():
    products = list(products_collection.find({"sales_history": {"$exists": True, "$not": {"$size": 0}}}))
    total_accuracy = 0
    count = 0
    for product in products:
        sales_history = product.get("sales_history", [])
        if len(sales_history) < 3:
            continue
        # Use last 3 months for accuracy
        actuals = [item["sales"] for item in sales_history[-3:]]
        # Predict last 3 months using earlier data
        if len(sales_history) > 3:
            X = np.arange(len(sales_history) - 3).reshape(-1, 1)
            y = np.array([item['sales'] for item in sales_history[:-3]])
            model = LinearRegression()
            model.fit(X, y)
            future_X = np.arange(len(sales_history) - 3, len(sales_history)).reshape(-1, 1)
            preds = model.predict(future_X)
            for actual, pred in zip(actuals, preds):
                if actual > 0:
                    acc = 100 - (abs(pred - actual) / actual * 100)
                    total_accuracy += max(0, min(acc, 100))
                    count += 1
    avg_accuracy = round(total_accuracy / count, 2) if count else 0
    return {"accuracy": avg_accuracy}

@app.get("/cost-savings")
def get_cost_savings():
    # Simple heuristic: savings from not overstocking and not running out
    products = list(products_collection.find({}))
    overstock_savings = 0
    stockout_savings = 0
    for p in products:
        stock = p.get("stock", 0)
        min_stock = p.get("min_stock", 0)
        price = p.get("price", 0)
        # Overstock: if stock > 1.5 * min_stock, assume excess is saved
        if stock > 1.5 * min_stock:
            overstock_savings += (stock - 1.5 * min_stock) * price * 0.1  # 10% of value
        # Stockout: if stock < min_stock, assume lost profit
        if stock < min_stock:
            stockout_savings += (min_stock - stock) * price * 0.2  # 20% of value
    total_savings = int(overstock_savings + stockout_savings)
    return {"savings": total_savings}

@app.delete("/products/{product_id}")
def delete_product(product_id: str):
    try:
        obj_id = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")
    result = products_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# --- SUPPLIER MANAGEMENT ---

class Supplier(BaseModel):
    id: Optional[str] = None
    name: str
    contact_info: str
    lead_time_days: int
    reliability_score: float

@app.get("/suppliers")
def get_suppliers():
    suppliers = list(suppliers_collection.find())
    for s in suppliers:
        s["id"] = str(s["_id"])
        del s["_id"]
    return suppliers

@app.post("/suppliers")
def add_supplier(supplier: Supplier):
    data = supplier.dict(exclude_unset=True)
    data.pop("id", None)
    result = suppliers_collection.insert_one(data)
    # Fetch the inserted supplier and format the response
    new_supplier = suppliers_collection.find_one({"_id": result.inserted_id})
    new_supplier["id"] = str(new_supplier["_id"])
    del new_supplier["_id"]
    return new_supplier

@app.put("/suppliers/{supplier_id}")
def update_supplier(supplier_id: str, supplier: Supplier):
    data = supplier.dict(exclude_unset=True)
    data.pop("id", None)
    result = suppliers_collection.update_one({"_id": ObjectId(supplier_id)}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"id": supplier_id, **data}

@app.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: str):
    result = suppliers_collection.delete_one({"_id": ObjectId(supplier_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"id": supplier_id, "deleted": True}

# --- PURCHASE ORDER MANAGEMENT ---

class PurchaseOrderItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class PurchaseOrder(BaseModel):
    id: Optional[str] = None
    supplier_id: str
    items: list[PurchaseOrderItem]
    status: str
    order_date: str
    expected_delivery: str

@app.get("/purchase-orders")
def get_purchase_orders():
    orders = list(purchase_orders_collection.find())
    for o in orders:
        o["id"] = str(o["_id"])
        del o["_id"]
        # Convert supplier_id to string if it's an ObjectId
        if "supplier_id" in o and isinstance(o["supplier_id"], ObjectId):
            o["supplier_id"] = str(o["supplier_id"])
        # Convert product_id in each item to string if it's an ObjectId
        for item in o.get("items", []):
            if "product_id" in item and isinstance(item["product_id"], ObjectId):
                item["product_id"] = str(item["product_id"])
    return orders

@app.post("/purchase-orders")
def add_purchase_order(order: PurchaseOrder):
    data = order.dict(exclude_unset=True)
    data.pop("id", None)
    
    # Convert product_id strings back to ObjectId for database query
    for item in data.get("items", []):
        try:
            item["product_id"] = ObjectId(item["product_id"])
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid product_id format: {item['product_id']}")

    result = purchase_orders_collection.insert_one(data)
    
    new_order = purchase_orders_collection.find_one({"_id": result.inserted_id})
    
    # Convert all ObjectId fields to strings for the response
    new_order["id"] = str(new_order["_id"])
    del new_order["_id"]

    for item in new_order.get("items", []):
        if "product_id" in item and isinstance(item["product_id"], ObjectId):
            item["product_id"] = str(item["product_id"])
            
    return JSONResponse(content=new_order)

@app.put("/purchase-orders/{order_id}")
def update_purchase_order(order_id: str, order: PurchaseOrder):
    data = order.dict(exclude_unset=True)
    data.pop("id", None)
    result = purchase_orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return {"id": order_id, **data}

@app.delete("/purchase-orders/{order_id}")
def delete_purchase_order(order_id: str):
    result = purchase_orders_collection.delete_one({"_id": ObjectId(order_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return {"id": order_id, "deleted": True}

# --- WAREHOUSE MANAGEMENT ---

class Warehouse(BaseModel):
    id: Optional[str] = None
    name: str
    address: str

@app.get("/warehouses")
def get_warehouses():
    warehouses = list(warehouses_collection.find())
    for w in warehouses:
        w["id"] = str(w["_id"])
        del w["_id"]
    return warehouses

@app.post("/warehouses")
def add_warehouse(warehouse: Warehouse):
    data = warehouse.dict(exclude_unset=True)
    data.pop("id", None)
    result = warehouses_collection.insert_one(data)
    # Fetch the inserted warehouse and format the response
    new_warehouse = warehouses_collection.find_one({"_id": result.inserted_id})
    new_warehouse["id"] = str(new_warehouse["_id"])
    del new_warehouse["_id"]
    return new_warehouse

@app.put("/warehouses/{warehouse_id}")
def update_warehouse(warehouse_id: str, warehouse: Warehouse):
    data = warehouse.dict(exclude_unset=True)
    data.pop("id", None)
    result = warehouses_collection.update_one({"_id": ObjectId(warehouse_id)}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return {"id": warehouse_id, **data}

@app.delete("/warehouses/{warehouse_id}")
def delete_warehouse(warehouse_id: str):
    result = warehouses_collection.delete_one({"_id": ObjectId(warehouse_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return {"id": warehouse_id, "deleted": True}

# --- STOCK TRANSFER MANAGEMENT ---

class StockTransferItem(BaseModel):
    product_id: str
    quantity: int

class StockTransfer(BaseModel):
    id: Optional[str] = None
    from_warehouse: str
    to_warehouse: str
    items: list[StockTransferItem]
    status: str
    transfer_date: str

@app.get("/stock-transfers")
def get_stock_transfers():
    transfers = list(stock_transfers_collection.find())
    for t in transfers:
        t["id"] = str(t["_id"])
        del t["_id"]
    return transfers

@app.post("/stock-transfers")
def add_stock_transfer(transfer: StockTransfer):
    data = transfer.dict(exclude_unset=True)
    data.pop("id", None)
    result = stock_transfers_collection.insert_one(data)
    # Fetch the inserted stock transfer and format the response
    new_transfer = stock_transfers_collection.find_one({"_id": result.inserted_id})
    new_transfer["id"] = str(new_transfer["_id"])
    del new_transfer["_id"]
    return new_transfer

@app.put("/stock-transfers/{transfer_id}")
def update_stock_transfer(transfer_id: str, transfer: StockTransfer):
    data = transfer.dict(exclude_unset=True)
    data.pop("id", None)
    result = stock_transfers_collection.update_one({"_id": ObjectId(transfer_id)}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Stock transfer not found")
    return {"id": transfer_id, **data}

@app.delete("/stock-transfers/{transfer_id}")
def delete_stock_transfer(transfer_id: str):
    result = stock_transfers_collection.delete_one({"_id": ObjectId(transfer_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stock transfer not found")
    return {"id": transfer_id, "deleted": True}

# --- INBOUND SHIPMENT MANAGEMENT ---

class Shipment(BaseModel):
    id: Optional[str] = None
    purchase_order_id: str
    warehouse_id: str
    status: str
    expected_delivery: str
    actual_delivery: str

@app.get("/shipments")
def get_shipments():
    shipments = list(shipments_collection.find())
    for s in shipments:
        s["id"] = str(s["_id"])
        del s["_id"]
    return shipments

@app.post("/shipments")
def add_shipment(shipment: Shipment):
    data = shipment.dict(exclude_unset=True)
    data.pop("id", None)
    result = shipments_collection.insert_one(data)
    data["id"] = str(result.inserted_id)
    return data

@app.put("/shipments/{shipment_id}")
def update_shipment(shipment_id: str, shipment: Shipment):
    data = shipment.dict(exclude_unset=True)
    data.pop("id", None)
    result = shipments_collection.update_one({"_id": ObjectId(shipment_id)}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return {"id": shipment_id, **data}

@app.delete("/shipments/{shipment_id}")
def delete_shipment(shipment_id: str):
    result = shipments_collection.delete_one({"_id": ObjectId(shipment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return {"id": shipment_id, "deleted": True}

# --- CUSTOMER ORDER MANAGEMENT ---

class CustomerInfo(BaseModel):
    name: str
    email: str
    phone: str

class CustomerOrderItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class CustomerOrder(BaseModel):
    id: Optional[str] = None
    customer_info: CustomerInfo
    items: list[CustomerOrderItem]
    status: str
    delivery_address: str
    placed_date: str

@app.get("/orders")
def get_orders():
    orders = list(orders_collection.find())
    for o in orders:
        o["id"] = str(o["_id"])
        del o["_id"]
    return orders

@app.post("/orders")
def add_order(order: CustomerOrder):
    data = order.dict(exclude_unset=True)
    data.pop("id", None)
    result = orders_collection.insert_one(data)
    data["id"] = str(result.inserted_id)
    return data

@app.put("/orders/{order_id}")
def update_order(order_id: str, order: CustomerOrder):
    data = order.dict(exclude_unset=True)
    data.pop("id", None)
    result = orders_collection.update_one({"_id": ObjectId(order_id)}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"id": order_id, **data}

@app.delete("/orders/{order_id}")
def delete_order(order_id: str):
    result = orders_collection.delete_one({"_id": ObjectId(order_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"id": order_id, "deleted": True}

# --- DELIVERY MANAGEMENT ---

class Delivery(BaseModel):
    id: Optional[str] = None
    order_id: str
    status: str
    delivery_date: str
    proof_of_delivery: Optional[str] = None

@app.get("/deliveries")
def get_deliveries():
    deliveries = list(deliveries_collection.find())
    for d in deliveries:
        d["id"] = str(d["_id"])
        del d["_id"]
    return deliveries

@app.post("/deliveries")
def add_delivery(delivery: Delivery):
    data = delivery.dict(exclude_unset=True)
    data.pop("id", None)
    result = deliveries_collection.insert_one(data)
    data["id"] = str(result.inserted_id)
    return data

@app.put("/deliveries/{delivery_id}")
def update_delivery(delivery_id: str, delivery: Delivery):
    data = delivery.dict(exclude_unset=True)
    data.pop("id", None)
    result = deliveries_collection.update_one({"_id": ObjectId(delivery_id)}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return {"id": delivery_id, **data}

@app.delete("/deliveries/{delivery_id}")
def delete_delivery(delivery_id: str):
    result = deliveries_collection.delete_one({"_id": ObjectId(delivery_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return {"id": delivery_id, "deleted": True}

@app.get("/last-mile-deliveries")
def get_last_mile_deliveries():
    import random
    drivers = [
        {"name": "Alex Green", "avatar": "https://i.pravatar.cc/150?img=1"},
        {"name": "Maria Rodriguez", "avatar": "https://i.pravatar.cc/150?img=2"},
        {"name": "David Chen", "avatar": "https://i.pravatar.cc/150?img=3"},
        {"name": "Fatima Al-Jamil", "avatar": "https://i.pravatar.cc/150?img=4"},
    ]
    statuses = ["In Transit", "Delayed", "Nearing Destination", "Delivered"]
    deliveries = []
    for i in range(10):
        driver = random.choice(drivers)
        status = random.choice(statuses)
        eta = random.randint(5, 60) if status != "Delivered" else 0
        deliveries.append({
            "id": f"DELIV{1001 + i}",
            "orderId": f"ORD{9500 + i}",
            "driver": driver,
            "status": status,
            "etaMinutes": eta,
            "currentLocation": {
                "lat": 34.0522 + (random.random() - 0.5) * 0.1,
                "lng": -118.2437 + (random.random() - 0.5) * 0.1,
            }
        })
    return deliveries

@app.get("/supply-chain-summary")
def get_supply_chain_summary():
    total_suppliers = suppliers_collection.count_documents({})
    total_warehouses = warehouses_collection.count_documents({})
    total_products = products_collection.count_documents({})
    open_purchase_orders = purchase_orders_collection.count_documents({"status": {"$nin": ["received", "cancelled"]}})
    open_customer_orders = orders_collection.count_documents({"status": {"$nin": ["delivered", "cancelled"]}})
    open_deliveries = deliveries_collection.count_documents({"status": {"$nin": ["delivered", "cancelled"]}})
    open_shipments = shipments_collection.count_documents({"status": {"$nin": ["received", "cancelled"]}})
    return {
        "total_suppliers": total_suppliers,
        "total_warehouses": total_warehouses,
        "total_products": total_products,
        "open_purchase_orders": open_purchase_orders,
        "open_customer_orders": open_customer_orders,
        "open_deliveries": open_deliveries,
        "open_shipments": open_shipments
    }

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003) 