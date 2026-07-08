import { useEffect } from "react";
import { useRouter } from "next/router";

const PurchaseBillIndex = () => {
    const router = useRouter();
    
    useEffect(() => {
        if (router.isReady) {
            router.replace({
                pathname: "/purchase-bill/purchase-orders",
                query: router.query
            });
        }
    }, [router.isReady, router.query]);

    return null;
};

export default PurchaseBillIndex;
