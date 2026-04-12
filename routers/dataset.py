from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data_loader import override_dataset, reset_datasets

router = APIRouter()

@router.post("/upload")
async def upload_dataset(
    sales_file: UploadFile = File(None), 
    inventory_file: UploadFile = File(None), 
    external_file: UploadFile = File(None)
):
    results = {}
    
    if sales_file:
        content = await sales_file.read()
        success = override_dataset('sales', content)
        results['sales'] = "Uploaded" if success else "Failed to parse"
        
    if inventory_file:
        content = await inventory_file.read()
        success = override_dataset('inventory', content)
        results['inventory'] = "Uploaded" if success else "Failed to parse"
        
    if external_file:
        content = await external_file.read()
        success = override_dataset('external', content)
        results['external'] = "Uploaded" if success else "Failed to parse"
        
    if not results:
        raise HTTPException(status_code=400, detail="No files provided")
        
    return {"status": "success", "results": results}

@router.post("/reset")
async def reset_to_standard():
    success = reset_datasets()
    if success:
        return {"status": "success", "message": "Datasets reset to standard files"}
    raise HTTPException(status_code=500, detail="Failed to reset datasets")
