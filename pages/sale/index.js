
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SaleIndex() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/sale/sales-invoice');
  }, []);

  return null;
}
