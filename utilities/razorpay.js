import axios from "axios";
import { VENDOR_API_URL } from "../components/utilities/Constants";

/**
 * Dynamically loads the official Razorpay Checkout SDK.
 * @returns {Promise<boolean>}
 */
export const loadRazorpaySdk = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Initiates and handles complete Razorpay Subscription payment workflow:
 * 1. POST /api/subscriptions/initiate-payment
 * 2. Launches Razorpay Checkout modal
 * 3. POST /api/subscriptions/verify-payment on success
 * 4. POST /api/subscriptions/payment-failed on failure/cancellation
 */
export const initiateSubscriptionPayment = async ({
  plan,
  durationMonths = 1,
  compId,
  branchId,
  userInfo,
  jwtToken,
  onSuccess,
  onFailure
}) => {
  try {
    const isLoaded = await loadRazorpaySdk();
    if (!isLoaded) {
      throw new Error("Unable to load Razorpay payment gateway. Please check your internet connection.");
    }

    const resolvedPlanId = plan?.planId || plan?.id || 1;
    const resolvedCompId =
      compId ||
      userInfo?.vendorCompanies?.[0]?.compId ||
      userInfo?.vendorCompanies?.[0]?.id ||
      userInfo?.compId ||
      1;
    const resolvedBranchId =
      branchId ||
      userInfo?.vendorCompanies?.[0]?.branches?.[0]?.id ||
      userInfo?.branchId ||
      1;

    const calculatedAmount = Math.round(
      Number(plan?.price || 0) * (Number(durationMonths) || 1)
    );

    const initiatePayload = {
      planId: resolvedPlanId,
      compId: resolvedCompId,
      branchId: resolvedBranchId,
      durationMonths: Number(durationMonths) || 1,
      amount: calculatedAmount
    };

    const authHeaders = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};

    // 1. Initiate Payment API (supports /api/subscriptions/initiate-payment and fallback)
    let initiateRes;
    try {
      initiateRes = await axios.post(
        `${VENDOR_API_URL}subscriptions/initiate-payment`,
        initiatePayload,
        { headers: authHeaders }
      );
    } catch (err) {
      if (err.response?.status === 404) {
        initiateRes = await axios.post(
          `${VENDOR_API_URL}vendor-subscriptions/initiate-payment`,
          initiatePayload,
          { headers: authHeaders }
        );
      } else {
        throw err;
      }
    }

    const initData = initiateRes.data?.data || initiateRes.data || {};
    const orderId =
      initData.orderId ||
      initData.razorpayOrderId ||
      initData.id ||
      initData.order?.id;
    const keyId =
      initData.keyId ||
      initData.razorpayKeyId ||
      initData.key ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!orderId) {
      throw new Error(initiateRes.data?.message || "Failed to initialize payment order with gateway.");
    }

    const customerName = `${userInfo?.firstName || ""} ${userInfo?.lastName || ""}`.trim() || userInfo?.name || "Zaanvar Vendor";
    const customerEmail = userInfo?.email || "";
    const customerContact = userInfo?.phone || userInfo?.mobile || userInfo?.phoneNumber || "";

    let paymentCompleted = false;

    const options = {
      key: keyId,
      amount: initData.amount || calculatedAmount * 100, // Amount in paise
      currency: initData.currency || "INR",
      name: "Zaanvar Business",
      description: `Subscription: ${plan?.name || "Business Plan"} (${durationMonths} month${durationMonths > 1 ? "s" : ""})`,
      image: "https://zaanvarprods3.b-cdn.net/media/1773901732776-zaanvarbusinesslogo.svg",
      order_id: orderId,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerContact
      },
      theme: {
        color: "#f5790c"
      },
      handler: async function (response) {
        paymentCompleted = true;
        try {
          const verifyPayload = {
            compId: resolvedCompId,
            branchId: resolvedBranchId,
            planId: resolvedPlanId,
            durationMonths: Number(durationMonths) || 1,
            razorpayOrderId: response.razorpay_order_id || orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          };

          // 2. Verify Payment API
          let verifyRes;
          try {
            verifyRes = await axios.post(
              `${VENDOR_API_URL}subscriptions/verify-payment`,
              verifyPayload,
              { headers: authHeaders }
            );
          } catch (vErr) {
            if (vErr.response?.status === 404) {
              verifyRes = await axios.post(
                `${VENDOR_API_URL}vendor-subscriptions/verify-payment`,
                verifyPayload,
                { headers: authHeaders }
              );
            } else {
              throw vErr;
            }
          }

          // 3. Activate Subscription API
          const activatePayload = {
            compId: resolvedCompId,
            branchId: resolvedBranchId,
            planId: resolvedPlanId,
            durationMonths: Number(durationMonths) || 1
          };

          let activateRes = null;
          try {
            activateRes = await axios.post(
              `${VENDOR_API_URL}subscriptions/activate`,
              activatePayload,
              { headers: authHeaders }
            );
          } catch (actErr) {
            if (actErr.response?.status === 404) {
              try {
                activateRes = await axios.post(
                  `${VENDOR_API_URL}vendor-subscriptions/activate`,
                  activatePayload,
                  { headers: authHeaders }
                );
              } catch (actFallbackErr) {
                console.warn("Subscription activate fallback error:", actFallbackErr);
              }
            } else {
              console.warn("Subscription activate API error:", actErr?.response?.status, actErr?.message);
            }
          }

          if (onSuccess) {
            onSuccess(
              {
                ...(verifyRes?.data || {}),
                activateResult: activateRes?.data
              },
              response
            );
          }
        } catch (verifyErr) {
          console.error("Subscription payment verification failed:", verifyErr);
          if (onFailure) {
            onFailure(verifyErr?.response?.data?.message || "Payment verification failed. Please contact support.");
          }
        }
      },
      modal: {
        ondismiss: async function () {
          if (!paymentCompleted) {
            try {
              const failedPayload = {
                compId: resolvedCompId,
                branchId: resolvedBranchId,
                planId: resolvedPlanId,
                reason: "Payment modal closed by user",
                razorpayOrderId: orderId || "",
                razorpayPaymentId: ""
              };
              try {
                await axios.post(
                  `${VENDOR_API_URL}subscriptions/payment-failed`,
                  failedPayload,
                  { headers: authHeaders }
                );
              } catch {
                await axios.post(
                  `${VENDOR_API_URL}vendor-subscriptions/payment-failed`,
                  failedPayload,
                  { headers: authHeaders }
                );
              }
            } catch (failErr) {
              console.warn("Failed to notify server of cancelled payment:", failErr);
            }
            if (onFailure) {
              onFailure("Payment was cancelled.");
            }
          }
        }
      }
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", async function (response) {
      paymentCompleted = false;
      try {
        const failedPayload = {
          compId: resolvedCompId,
          branchId: resolvedBranchId,
          planId: resolvedPlanId,
          reason: response.error?.description || "Payment failed at gateway",
          razorpayOrderId: response.error?.metadata?.order_id || orderId || "",
          razorpayPaymentId: response.error?.metadata?.payment_id || ""
        };
        try {
          await axios.post(
            `${VENDOR_API_URL}subscriptions/payment-failed`,
            failedPayload,
            { headers: authHeaders }
          );
        } catch {
          await axios.post(
            `${VENDOR_API_URL}vendor-subscriptions/payment-failed`,
            failedPayload,
            { headers: authHeaders }
          );
        }
      } catch (err) {
        console.warn("Failed to record payment failure:", err);
      }
      if (onFailure) {
        onFailure(response.error?.description || "Payment failed at gateway.");
      }
    });

    rzp.open();
  } catch (err) {
    console.error("Initiate subscription payment error:", err);
    if (onFailure) {
      onFailure(err?.response?.data?.message || err?.message || "Failed to initiate subscription payment.");
    }
  }
};

/**
 * Initiates and handles complete Vendor POS / Order Payment workflow:
 * 1. POST /api/payments/razorpay-order
 * 2. Launches Razorpay Checkout modal
 * 3. POST /api/payments/verify-razorpay-payment on success
 */
export const initiateVendorPayment = async ({
  amount,
  userOrderId,
  branchId,
  vendorCustomerId,
  notes = {},
  userInfo,
  jwtToken,
  createdBy,
  onSuccess,
  onFailure
}) => {
  try {
    const isLoaded = await loadRazorpaySdk();
    if (!isLoaded) {
      throw new Error("Unable to load Razorpay payment gateway.");
    }

    const authHeaders = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};

    const orderPayload = {
      amount: Number(amount),
      userOrderId: Number(userOrderId) || null,
      branchId: Number(branchId) || null,
      vendorCustomerId: Number(vendorCustomerId) || null,
      notes: notes || {}
    };

    // 1. Create Razorpay Order API
    let orderRes;
    try {
      orderRes = await axios.post(
        `${VENDOR_API_URL}payments/razorpay-order`,
        orderPayload,
        { headers: authHeaders }
      );
    } catch (err) {
      if (err.response?.status === 404) {
        orderRes = await axios.post(
          `${VENDOR_API_URL}vendor-payments/razorpay-order`,
          orderPayload,
          { headers: authHeaders }
        );
      } else {
        throw err;
      }
    }

    const orderData = orderRes.data?.data || orderRes.data || {};
    const razorpayOrderId =
      orderData.orderId ||
      orderData.razorpayOrderId ||
      orderData.id;
    const keyId =
      orderData.keyId ||
      orderData.razorpayKeyId ||
      orderData.key ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!razorpayOrderId) {
      throw new Error(orderRes.data?.message || "Failed to create payment order.");
    }

    const options = {
      key: keyId,
      amount: Number(amount) * 100,
      currency: "INR",
      name: "Zaanvar Vendor",
      description: notes?.billType || "Payment for Order",
      image: "https://zaanvarprods3.b-cdn.net/media/1773901732776-zaanvarbusinesslogo.svg",
      order_id: razorpayOrderId,
      prefill: {
        name: userInfo?.name || `${userInfo?.firstName || ""} ${userInfo?.lastName || ""}`.trim() || "",
        email: userInfo?.email || "",
        contact: userInfo?.phone || userInfo?.mobile || ""
      },
      theme: {
        color: "#f5790c"
      },
      handler: async function (response) {
        try {
          const verifyPayload = {
            razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            amount: Number(amount),
            userOrderId: Number(userOrderId) || null,
            branchId: Number(branchId) || null,
            vendorCustomerId: Number(vendorCustomerId) || null,
            paymentMethod: "Razorpay",
            createdBy: createdBy || userInfo?.userId || userInfo?.id || 1
          };

          // 2. Verify Vendor Payment API
          let verifyRes;
          try {
            verifyRes = await axios.post(
              `${VENDOR_API_URL}payments/verify-razorpay-payment`,
              verifyPayload,
              { headers: authHeaders }
            );
          } catch (vErr) {
            if (vErr.response?.status === 404) {
              verifyRes = await axios.post(
                `${VENDOR_API_URL}vendor-payments/verify-razorpay-payment`,
                verifyPayload,
                { headers: authHeaders }
              );
            } else {
              throw vErr;
            }
          }

          if (onSuccess) {
            onSuccess(verifyRes.data, response);
          }
        } catch (verifyErr) {
          console.error("Vendor payment verification failed:", verifyErr);
          if (onFailure) {
            onFailure(verifyErr?.response?.data?.message || "Payment verification failed.");
          }
        }
      },
      modal: {
        ondismiss: function () {
          if (onFailure) {
            onFailure("Payment cancelled.");
          }
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error("Initiate vendor payment error:", err);
    if (onFailure) {
      onFailure(err?.response?.data?.message || err?.message || "Failed to initiate vendor payment.");
    }
  }
};
