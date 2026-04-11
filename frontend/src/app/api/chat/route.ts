import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

type SalesRecord = {
  date: string;
  product_id: string;
  warehouse_id: string;
  units_sold: number;
  price: number;
  weather_condition: string;
  temperature: number;
  is_holiday: number;
  social_trend_score: number;
};

type InventoryRecord = {
  product_id: string;
  category: string;
  holding_cost: number;
  supplier_lead_time_days: number;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const DATA_ROOT = path.resolve(process.cwd(), '..');
const CITY_TO_WAREHOUSE: Record<string, string> = {
  mumbai: 'WH_01',
  delhi: 'WH_02',
  bangalore: 'WH_03',
  bengaluru: 'WH_03',
  kolkata: 'WH_04',
  hyderabad: 'WH_05',
  chennai: 'WH_06',
  ahmedabad: 'WH_07',
  pune: 'WH_08',
  surat: 'WH_09',
  jaipur: 'WH_10',
};
const WAREHOUSE_TO_CITY: Record<string, string> = Object.fromEntries(
  Object.entries(CITY_TO_WAREHOUSE).map(([city, warehouse]) => [warehouse, city])
);
const Z_SCORE_95 = 1.645;

let salesCache: SalesRecord[] | null = null;
let inventoryCache: InventoryRecord[] | null = null;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

async function readCsv<T>(
  filename: string,
  mapRow: (row: Record<string, string>) => T
): Promise<T[]> {
  const filePath = path.join(DATA_ROOT, filename);
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
    return mapRow(row);
  });
}

async function getSalesData(): Promise<SalesRecord[]> {
  if (!salesCache) {
    salesCache = await readCsv('supply_chain_sales_master.csv', (row) => ({
      date: row.date,
      product_id: row.product_id,
      warehouse_id: row.warehouse_id,
      units_sold: Number(row.units_sold),
      price: Number(row.price),
      weather_condition: row.weather_condition,
      temperature: Number(row.temperature),
      is_holiday: Number(row.is_holiday),
      social_trend_score: Number(row.social_trend_score),
    }));
  }

  return salesCache;
}

async function getInventoryData(): Promise<InventoryRecord[]> {
  if (!inventoryCache) {
    inventoryCache = await readCsv('supply_chain_inventory.csv', (row) => ({
      product_id: row.product_id,
      category: row.category,
      holding_cost: Number(row.holding_cost),
      supplier_lead_time_days: Number(row.supplier_lead_time_days),
    }));
  }

  return inventoryCache;
}

function normalizeProductId(input: string): string | null {
  const match = input.match(/PRD[_-]?(\d{3})/i);
  return match ? `PRD_${match[1]}` : null;
}

function normalizeWarehouseId(input: string): string | null {
  const whMatch = input.match(/WH[_-]?(\d{2})/i);
  if (whMatch) {
    return `WH_${whMatch[1]}`;
  }

  const lowered = input.toLowerCase();
  for (const [city, warehouse] of Object.entries(CITY_TO_WAREHOUSE)) {
    if (lowered.includes(city)) {
      return warehouse;
    }
  }

  return null;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }
  const mean = average(values);
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function getCurrentStock(records: SalesRecord[]): number {
  const recentUnits = records.slice(-3).map((record) => record.units_sold);
  return Math.max(0, Math.round(average(recentUnits) * 5));
}

function getMetrics(records: SalesRecord[], inventory: InventoryRecord | undefined) {
  const units = records.map((record) => record.units_sold);
  const avgDailyDemand = average(units);
  const demandStdDev = stdDev(units);
  const leadTime = inventory?.supplier_lead_time_days ?? 7;
  const safetyStock = Math.ceil(Z_SCORE_95 * demandStdDev * Math.sqrt(leadTime));
  const reorderPoint = Math.round(avgDailyDemand * leadTime + safetyStock);
  const currentStock = getCurrentStock(records);

  let status = 'OK';
  if (currentStock < safetyStock) {
    status = 'CRITICAL';
  } else if (currentStock < reorderPoint) {
    status = 'REORDER';
  }

  return {
    avgDailyDemand,
    safetyStock,
    reorderPoint,
    currentStock,
    leadTime,
    status,
  };
}

function formatWarehouse(warehouseId: string): string {
  const city = WAREHOUSE_TO_CITY[warehouseId];
  return city ? `${warehouseId} (${city})` : warehouseId;
}

function formatStockAnswer(
  productId: string,
  warehouseId: string | null,
  sales: SalesRecord[],
  inventoryRows: InventoryRecord[]
): string {
  const productInventory = inventoryRows.find((row) => row.product_id === productId);
  const productSales = sales.filter((row) => row.product_id === productId);

  if (productSales.length === 0) {
    return `I could not find sales or inventory data for ${productId}. Please check the product ID.`;
  }

  if (warehouseId) {
    const filtered = productSales.filter((row) => row.warehouse_id === warehouseId);
    if (filtered.length === 0) {
      return `I found ${productId}, but there is no data for ${formatWarehouse(warehouseId)}.`;
    }

    const metrics = getMetrics(filtered, productInventory);
    return [
      `${productId} stock in ${formatWarehouse(warehouseId)}: ${metrics.currentStock} units.`,
      `Category: ${productInventory?.category ?? 'Unknown'}.`,
      `Safety stock: ${metrics.safetyStock}. Reorder point: ${metrics.reorderPoint}.`,
      `Status: ${metrics.status}. Avg daily demand: ${metrics.avgDailyDemand.toFixed(1)} units/day.`,
    ].join('\n');
  }

  const byWarehouse = Array.from(
    productSales.reduce<Map<string, SalesRecord[]>>((acc, record) => {
      const existing = acc.get(record.warehouse_id) ?? [];
      existing.push(record);
      acc.set(record.warehouse_id, existing);
      return acc;
    }, new Map())
  )
    .map(([currentWarehouseId, records]) => {
      const metrics = getMetrics(records, productInventory);
      return { warehouseId: currentWarehouseId, ...metrics };
    })
    .sort((a, b) => b.currentStock - a.currentStock);

  const totalStock = byWarehouse.reduce((sum, row) => sum + row.currentStock, 0);
  const criticalCount = byWarehouse.filter((row) => row.status !== 'OK').length;
  const topWarehouses = byWarehouse
    .slice(0, 5)
    .map((row) => `${formatWarehouse(row.warehouseId)}: ${row.currentStock} units (${row.status})`)
    .join('\n');

  return [
    `${productId} total estimated stock across all warehouses: ${totalStock} units.`,
    `Category: ${productInventory?.category ?? 'Unknown'}. Warehouses needing attention: ${criticalCount}/${byWarehouse.length}.`,
    'Top warehouse availability:',
    topWarehouses,
  ].join('\n');
}

function formatReorderAnswer(
  warehouseId: string | null,
  sales: SalesRecord[],
  inventoryRows: InventoryRecord[],
  productId?: string | null
): string {
  const filteredSales = warehouseId ? sales.filter((row) => row.warehouse_id === warehouseId) : sales;

  const grouped = Array.from(
    filteredSales.reduce<Map<string, SalesRecord[]>>((acc, row) => {
      if (productId && row.product_id !== productId) {
        return acc;
      }
      const existing = acc.get(row.product_id) ?? [];
      existing.push(row);
      acc.set(row.product_id, existing);
      return acc;
    }, new Map())
  );

  const results = grouped
    .map(([currentProductId, records]) => {
      const inventory = inventoryRows.find((row) => row.product_id === currentProductId);
      const metrics = getMetrics(records, inventory);
      return {
        productId: currentProductId,
        category: inventory?.category ?? 'Unknown',
        ...metrics,
      };
    })
    .filter((row) => row.status !== 'OK')
    .sort((a, b) => {
      if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
      if (a.status !== 'CRITICAL' && b.status === 'CRITICAL') return 1;
      return a.currentStock - b.currentStock;
    });

  if (results.length === 0) {
    return warehouseId
      ? `No products are currently below reorder thresholds in ${formatWarehouse(warehouseId)}.`
      : 'No products are currently below reorder thresholds across the network.';
  }

  const scope = warehouseId ? `in ${formatWarehouse(warehouseId)}` : 'across all warehouses';
  const lines = results
    .slice(0, 5)
    .map(
      (row) =>
        `${row.productId} (${row.category}): stock ${row.currentStock}, reorder point ${row.reorderPoint}, status ${row.status}`
    );

  return [`Products needing reorder ${scope}:`, ...lines].join('\n');
}

function formatDemandAnswer(
  productId: string | null,
  warehouseId: string | null,
  sales: SalesRecord[]
): string {
  if (!productId) {
    return 'Please include a product ID like PRD_016 so I can check the demand trend.';
  }

  const filtered = sales.filter(
    (row) => row.product_id === productId && (!warehouseId || row.warehouse_id === warehouseId)
  );

  if (filtered.length < 14) {
    return `There is not enough demand history to compare recent demand for ${productId}.`;
  }

  const last14 = filtered.slice(-14);
  const previousWeek = last14.slice(0, 7);
  const currentWeek = last14.slice(7);
  const previousAvg = average(previousWeek.map((row) => row.units_sold));
  const currentAvg = average(currentWeek.map((row) => row.units_sold));
  const deltaPct = previousAvg === 0 ? 0 : ((currentAvg - previousAvg) / previousAvg) * 100;
  const holidayDays = currentWeek.filter((row) => row.is_holiday === 1).length;
  const trendScore = average(currentWeek.map((row) => row.social_trend_score));

  const scope = warehouseId ? `in ${formatWarehouse(warehouseId)}` : 'across all warehouses';
  return [
    `Demand trend for ${productId} ${scope}:`,
    `Last 7-day average: ${currentAvg.toFixed(1)} units/day.`,
    `Previous 7-day average: ${previousAvg.toFixed(1)} units/day.`,
    `Change: ${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%.`,
    `Holiday days in recent week: ${holidayDays}. Avg social trend score: ${trendScore.toFixed(1)}.`,
  ].join('\n');
}

function haversineDistanceKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.asin(Math.sqrt(a));
}

function formatRouteAnswer(message: string): string {
  const warehouses = Array.from(
    new Set(
      [
        ...Array.from(message.matchAll(/WH[_-]?\d{2}/gi)).map((match) => normalizeWarehouseId(match[0])),
        ...Object.keys(CITY_TO_WAREHOUSE)
          .filter((city) => message.toLowerCase().includes(city))
          .map((city) => CITY_TO_WAREHOUSE[city]),
      ].filter(Boolean)
    )
  ) as string[];

  if (warehouses.length < 2) {
    return "Please include both origin and destination, like 'Best route Mumbai to Delhi' or 'Best route WH_01 to WH_02'.";
  }

  const coordinates: Record<string, [number, number]> = {
    WH_01: [19.076, 72.8777],
    WH_02: [28.7041, 77.1025],
    WH_03: [12.9716, 77.5946],
    WH_04: [22.5726, 88.3639],
    WH_05: [17.385, 78.4867],
    WH_06: [13.0827, 80.2707],
    WH_07: [23.0225, 72.5714],
    WH_08: [18.5204, 73.8567],
    WH_09: [21.1702, 72.8311],
    WH_10: [26.9124, 75.7873],
  };

  const start = warehouses[0];
  const end = warehouses[1];
  const distance = haversineDistanceKm(coordinates[start], coordinates[end]);

  return [
    `Best direct route: ${formatWarehouse(start)} to ${formatWarehouse(end)}.`,
    `Estimated distance: ${distance.toFixed(1)} km.`,
    `Estimated drive time: ${(distance / 60).toFixed(1)} hours at 60 km/h average speed.`,
  ].join('\n');
}

function formatFallback(productId: string | null, warehouseId: string | null): string {
  if (productId) {
    const warehouseText = warehouseId ? ` in ${formatWarehouse(warehouseId)}` : '';
    return `I can help with ${productId}${warehouseText}. Try asking:
- How many stock available for ${productId}?
- Does ${productId} need reorder?
- Is demand spiking for ${productId}?`;
  }

  return `I can answer supply chain questions from the local data. Try:
- How many stock available for PRD_016?
- Which product needs reorder in WH_01?
- Why is demand spiking for PRD_005?
- Best route Mumbai to Delhi?`;
}

async function generateReply(messages: ChatMessage[]): Promise<string> {
  const latestMessage = messages[messages.length - 1]?.content ?? '';
  const productId = normalizeProductId(latestMessage);
  const warehouseId = normalizeWarehouseId(latestMessage);
  const lowered = latestMessage.toLowerCase();
  const sales = await getSalesData();
  const inventoryRows = await getInventoryData();

  if (lowered.includes('stock') || lowered.includes('inventory') || lowered.includes('available')) {
    if (!productId) {
      return 'Please include a product ID like PRD_016 so I can check stock availability.';
    }
    return formatStockAnswer(productId, warehouseId, sales, inventoryRows);
  }

  if (lowered.includes('reorder') || lowered.includes('low stock')) {
    return formatReorderAnswer(warehouseId, sales, inventoryRows, productId);
  }

  if (lowered.includes('demand') || lowered.includes('spiking') || lowered.includes('spike')) {
    return formatDemandAnswer(productId, warehouseId, sales);
  }

  if (lowered.includes('route')) {
    return formatRouteAnswer(latestMessage);
  }

  if (lowered.includes('supplier disruption') || lowered.includes('disruption')) {
    const riskyProducts = formatReorderAnswer(warehouseId, sales, inventoryRows, productId);
    return [
      'If a supplier disruption happens, prioritize stock protection for the most constrained items first.',
      riskyProducts,
      'Suggested actions: expedite replenishment, rebalance stock across warehouses, and reduce promotions on critical SKUs.',
    ].join('\n\n');
  }

  return formatFallback(productId, warehouseId);
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages?: ChatMessage[] };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const content = await generateReply(messages);
    return NextResponse.json({ role: 'assistant', content });
  } catch (error) {
    console.error('Chat Error:', error);
    return NextResponse.json(
      {
        role: 'assistant',
        content: 'I hit an error while reading the local supply chain data. Please try again.',
      },
      { status: 200 }
    );
  }
}
