import React, { useCallback, useEffect, useState } from "react";
import MobileScanner from "../components/MobileScanner";
import api from "../services/apiClient";

export default function ScannerDevicePage() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, warehousesRes, inventoryRes] = await Promise.all([
        api.get("/stock/items"),
        api.get("/warehouses"),
        api.get("/stock/inventory")
      ]);
      setItems(itemsRes.data || []);
      setWarehouses(warehousesRes.data || []);
      setInventory(inventoryRes.data || []);
    } catch (err) {
      console.error("Scanner data fetch failed", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="scanner-device-page" style={{ minHeight: "100vh", background: "#f3f6ff" }}>
      <MobileScanner
        items={items}
        warehouses={warehouses}
        inventory={inventory}
        fetchData={fetchData}
      />
    </div>
  );
}
