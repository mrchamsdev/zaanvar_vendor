import { useEffect } from "react";
import { useRouter } from "next/router";

const PurchaseBillIndex = () => {
    const router = useRouter();
    
    useEffect(() => {
        router.replace("/purchase-bill/purchase-orders");
    }, []);

    return null;
};

export default PurchaseBillIndex;
