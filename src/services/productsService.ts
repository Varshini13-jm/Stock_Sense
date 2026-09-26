import { useEffect } from "react";
import { getProducts } from "../services/productsService";

export default function ProductsPage() {
  useEffect(() => {
    async function loadProducts() {
      try {
        const products = await getProducts();
        console.log("PRODUCTS FROM SUPABASE:", products);
      } catch (error) {
        console.error("FAILED TO LOAD PRODUCTS:", error);
      }
    }

    loadProducts();
  }, []);

  return <div>Products</div>;
}