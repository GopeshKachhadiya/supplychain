import axios from 'axios';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: BACKEND,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const fetchForecast = async (productId: string, warehouseId: string, days: number = 7) => {
    const res = await api.post('/api/forecast/predict', {
        product_id: productId,
        warehouse_id: warehouseId,
        start_date: "2025-06-01",
        days
    });
    return res.data.forecasts;
};

export const fetchInventoryStatus = async (warehouseId: string) => {
    const res = await api.get(`/api/inventory/status/${warehouseId}`);
    return res.data;
};

export const fetchAlerts = async () => {
    const res = await api.get('/api/alerts/active');
    return res.data;
};

export const fetchProducts = async () => {
    const res = await api.get('/api/forecast/products');
    return res.data.products;
};

export const fetchWarehouses = async () => {
    const res = await api.get('/api/routing/warehouses');
    return res.data.warehouses;
};

export const fetchRoute = async (startWarehouse: string, stops: string[]) => {
    const res = await api.post('/api/routing/optimize', {
        start_warehouse: startWarehouse,
        stops: stops
    });
    return res.data.route;
};

export default api;
