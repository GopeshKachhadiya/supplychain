"use client";

import React, { useState } from 'react';
import { Database, UploadCloud, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DatasetUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleUpload = async () => {
    setIsUploading(true);
    setStatusMsg("");

    const formData = new FormData();
    if (salesFile) formData.append("sales_file", salesFile);
    if (inventoryFile) formData.append("inventory_file", inventoryFile);
    if (externalFile) formData.append("external_file", externalFile);

    if (!salesFile && !inventoryFile && !externalFile) {
      setStatusMsg("Select at least one file to upload.");
      setIsUploading(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/dataset/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setStatusMsg("Successfully uploaded datasets. Refresh page to see changes.");

      // Auto-clear success message and close after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setStatusMsg("");
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatusMsg("Upload failed. Ensure backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = async () => {
    setIsUploading(true);
    setStatusMsg("");
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/dataset/reset`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Reset failed");
      setStatusMsg("Reset to standard datasets. Refresh page to see changes.");
      setTimeout(() => {
        setIsOpen(false);
        setStatusMsg("");
      }, 3000);
    } catch (e) {
      console.error(e);
      setStatusMsg("Reset failed. Ensure backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 px-4 py-2 w-full text-[#7b41b3] hover:bg-[#7b41b3]/10 font-medium rounded-xl transition-colors"
      >
        <Database className="w-5 h-5" />
        <span>Manage Datasets</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#2d3339]">Data Management</h2>
              <p className="text-[#596067] text-sm">Upload custom scenario datasets (e.g., Hurricane Data) or revert to the standard datasets.</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[#2d3339] mb-1">Demand (Sales Data)</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSalesFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2d3339] mb-1">Inventory (Inventory Status Data)</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setInventoryFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2d3339] mb-1">External (External Factors Data)</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setExternalFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            {statusMsg && (
              <div className={cn("p-3 rounded-xl mb-4 text-sm font-medium",
                statusMsg.includes("failed") ? "bg-[#9e3f4e]/10 text-[#9e3f4e]" : "bg-green-100 text-green-800"
              )}>
                {statusMsg}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-[#7b41b3] hover:bg-[#6f34a5] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
              >
                <UploadCloud className="w-5 h-5" /> {isUploading ? "Uploading..." : "Upload Data"}
              </button>
              <button
                onClick={handleReset}
                disabled={isUploading}
                className="px-6 border border-[#2d3339] text-[#2d3339] hover:bg-gray-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-5 h-5" /> Reset
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
