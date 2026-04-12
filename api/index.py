import sys
import os
from pathlib import Path

# Add root directory to sys.path so we can import 'main' and 'routers'
root_path = str(Path(__file__).resolve().parent.parent)
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from main import app as application

app = application

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
