# SupplySense

*AI-powered supply chain optimization*

A modern web application for managing inventory, forecasting product demand, and optimizing stock levels using a React frontend and a FastAPI + MongoDB backend.

---

## Features

- **Dashboard**: Real-time overview of total products, low stock alerts, forecast accuracy, and cost savings.
- **Product Management**: Add, edit, and manage products with stock, minimum stock, price, and supplier info.
- **Demand Forecasting**: Predict future sales for each product using historical data and ML models.
- **Stock Optimization**: Get reorder recommendations and insights to minimize overstock and stockouts.
- **Inventory Trends**: Visualize stock movement, sales, and restocking trends over time.
- **Dynamic Insights**: See actionable insights based on your inventory and sales data.
- **Accessibility**: UI is accessible and responsive.
- **API-first**: All data is fetched from a FastAPI backend with MongoDB.

---

## Technologies Used

- **Frontend**: React, TypeScript, Vite, shadcn-ui, Tailwind CSS, @tanstack/react-query, Recharts
- **Backend**: FastAPI (Python), MongoDB, Uvicorn, Pydantic, pymongo
- **ML/Analytics**: Simple forecasting and optimization logic (can be extended)

### ML/Analytics (Extended)

- **Demand Forecasting:**  
  The backend uses time series analysis and statistical models to predict future product demand based on historical sales data. For each product, the `/forecast` endpoint generates a forecast for upcoming periods, helping you anticipate stock needs and avoid shortages or overstocking. The current implementation uses simple moving averages and can be upgraded to more advanced models (e.g., ARIMA, Prophet, or machine learning regressors) for improved accuracy.

- **Stock Optimization:**  
  The `/optimize` endpoint analyzes current inventory, sales velocity, and minimum stock thresholds to recommend optimal reorder quantities. It helps minimize holding costs and reduces the risk of stockouts. The logic can be extended to include supplier lead times, dynamic safety stock calculations, and multi-product optimization.

- **Forecast Accuracy:**  
  The `/forecast-accuracy` endpoint compares past forecasts to actual sales, providing a real-time accuracy metric. This helps you monitor and improve the reliability of your demand predictions.

- **Cost Savings Estimation:**  
  The `/cost-savings` endpoint estimates the financial benefits gained from optimized stock levels, such as reduced overstock, fewer lost sales, and lower holding costs.

- **Dynamic Insights:**  
  The `/insights` endpoint provides actionable recommendations based on trends in your inventory and sales data, such as identifying top-performing products, low stock alerts, and demand spikes.

- **Extending the ML Logic:**  
  - You can enhance the forecasting logic in `ml-backend/main.py` by integrating more sophisticated models (e.g., Facebook Prophet, XGBoost, LSTM neural networks).
  - Add features like seasonality, promotions, or external factors to improve forecast accuracy.
  - Implement ABC/XYZ analysis, clustering, or anomaly detection for deeper inventory insights.
  - Integrate with external data sources (e.g., weather, events) for even smarter predictions.

---

## Populating the Database with Sample Data

To quickly add sample/mock data for all main entities (products, suppliers, purchase orders, warehouses, stock transfers, shipments, orders, deliveries):

1. Make sure MongoDB is running locally (default: `mongodb://localhost:27017/`).
2. Install the required Python package:
   ```sh
   pip install pymongo
   ```
3. Run the sample data script:
   ```sh
   cd ml-backend
   python populate_sample_data.py
   ```
4. Your MongoDB database (`inventory_db`) will be populated with sample data for all collections.

---

## Uploading to GitHub

1. Initialize git (if not already):
   ```sh
   git init
   ```
2. Add all files:
   ```sh
   git add .
   ```
3. Commit your changes:
   ```sh
   git commit -m "Initial commit with sample data script and project files"
   ```
4. Create a new repository on GitHub and follow the instructions to add the remote and push:
   ```sh
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git branch -M main
   git push -u origin main
   ```

---

## Getting Started

### 1. Clone the Repository

```sh
git clone <YOUR_GIT_URL>
cd swift-make-magic-happen-main
```

### 2. Start the Backend

Requires Python 3.8+ and MongoDB running locally or remotely.

```sh
cd ml-backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- The backend runs at [http://127.0.0.1:8000](http://127.0.0.1:8000)

### 3. Start the Frontend

In a new terminal:

```sh
npm install
npm run dev
```
- The frontend runs at [http://localhost:8085](http://localhost:8085)

### 4. Use the App

- Open [http://localhost:8085](http://localhost:8085) in your browser.
- Add products, view forecasts, and manage your inventory!

---

## API Endpoints (Backend)

- `GET /products` — List all products
- `POST /products` — Add a new product
- `PUT /products/{id}` — Update a product
- `DELETE /products/{id}` — Delete a product
- `POST /forecast` — Get demand forecast for a product
- `GET /stock-movement` — Inventory, sales, and restocking trends
- `GET /optimize` — Stock optimization and reorder suggestions
- `GET /insights` — Dynamic demand and inventory insights
- `GET /forecast-accuracy` — Real forecast accuracy based on sales history
- `GET /cost-savings` — Estimated cost savings from optimization

---

## Customization & Extending

- **ML Logic**: Extend forecasting and optimization in `ml-backend/main.py`.
- **UI**: All components are in `src/components/` and can be customized with Tailwind CSS.
- **Add More Features**: You can add authentication, notifications, or more advanced analytics.

---

## Troubleshooting

- **Frontend cannot connect to backend**: Make sure the backend is running on port 8000 and MongoDB is available.
- **Proxy errors**: The frontend expects the backend at `localhost:8000`. Adjust the Vite proxy if needed.
- **Python errors**: Ensure all dependencies are installed (`pip install -r requirements.txt`).
- **Windows PowerShell**: Use `;` instead of `&&` to chain commands, or run each command separately.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a new Pull Request

---

## License

MIT (or your preferred license)

