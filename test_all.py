import urllib.request, json

BASE = 'http://localhost:8000'
PASS = []
FAIL = []

def test(name, url, method='GET', body=None):
    try:
        if body:
            data = json.dumps(body).encode()
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        else:
            req = urllib.request.Request(url)
        res = json.loads(urllib.request.urlopen(req, timeout=30).read())
        print(f'  PASS  {name}')
        PASS.append(name)
        return res
    except Exception as e:
        print(f'  FAIL  {name} => {e}')
        FAIL.append((name, str(e)))
        return None

print('=== HEALTH ===')
test('GET /health', f'{BASE}/health')

print()
print('=== FORECAST ===')
test('GET /api/forecast/products', f'{BASE}/api/forecast/products')
test('GET /api/forecast/warehouses', f'{BASE}/api/forecast/warehouses')
r = test('POST /api/forecast/predict', f'{BASE}/api/forecast/predict',
         body={'product_id': 'PRD_001', 'warehouse_id': 'WH_01', 'start_date': '2025-06-01', 'days': 7})
if r:
    print(f'         -> {len(r["forecasts"])} forecast entries returned')

print()
print('=== INVENTORY ===')
for wh in ['WH_01', 'WH_05', 'WH_10']:
    r = test(f'GET /api/inventory/status/{wh}', f'{BASE}/api/inventory/status/{wh}')
    if r:
        print(f'         -> {r["total_products"]} products | {r["alerts"]} alerts | holiday={r.get("upcoming_holiday")}')

print()
print('=== ALERTS ===')
r = test('GET /api/alerts/active', f'{BASE}/api/alerts/active')
if r:
    print(f'         -> {r["total_alerts"]} total alerts')
    for a in r['alerts'][:3]:
        print(f'            [{a["severity"]}] {a["type"]}')

print()
print('=== ROUTING ===')
r = test('GET /api/routing/warehouses', f'{BASE}/api/routing/warehouses')
if r:
    print(f'         -> {len(r["warehouses"])} warehouses registered')

r = test('POST /api/routing/optimize (4 stops)',
         f'{BASE}/api/routing/optimize',
         body={'start_warehouse': 'WH_01', 'stops': ['WH_02', 'WH_03', 'WH_04', 'WH_05']})
if r:
    print(f'         -> Route: {" -> ".join(r["route"]["route"])}')
    print(f'         -> Distance: {r["route"]["total_distance_km"]} km | ETA: {r["route"]["estimated_time_hrs"]} hrs')

r = test('POST /api/routing/optimize (all 10 warehouses)',
         f'{BASE}/api/routing/optimize',
         body={'start_warehouse': 'WH_01',
               'stops': ['WH_02', 'WH_03', 'WH_04', 'WH_05', 'WH_06', 'WH_07', 'WH_08', 'WH_09', 'WH_10']})
if r:
    print(f'         -> Full Route: {" -> ".join(r["route"]["route"])}')

r = test('POST /api/routing/optimize (Gandhinagar locations)',
         f'{BASE}/api/routing/optimize',
         body={'start_warehouse': 'WH_01', 
               'stops': ['GN_01', 'GN_02', 'GN_03', 'WH_07']})
if r:
    print(f'         -> GN Route: {" -> ".join(r["route"]["route"])}')

# Test invalid warehouse — expects a 400 error (this IS the correct behavior)
try:
    data = json.dumps({'start_warehouse': 'WH_99', 'stops': ['WH_01']}).encode()
    req = urllib.request.Request(f'{BASE}/api/routing/optimize', data=data, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(req, timeout=10)
    print('  FAIL  POST /api/routing/optimize (invalid WH_99) => Should have returned 400 but got 200!')
    FAIL.append(('invalid WH_99 test', 'expected 400 but got 200'))
except urllib.error.HTTPError as e:
    if e.code == 400:
        print('  PASS  POST /api/routing/optimize (invalid WH_99) => Correctly returned HTTP 400')
        PASS.append('invalid WH_99 -> 400')
    else:
        print(f'  FAIL  POST /api/routing/optimize (invalid WH_99) => Got {e.code}, expected 400')
        FAIL.append(('invalid WH_99 test', f'expected 400 got {e.code}'))

print()
print('=' * 45)
print(f'RESULTS: {len(PASS)} passed | {len(FAIL)} failed')
if FAIL:
    print('FAILURES:')
    for name, err in FAIL:
        print(f'  - {name}: {err}')
else:
    print('ALL TESTS PASSED - EVERYTHING IS WORKING!')
