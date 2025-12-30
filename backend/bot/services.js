/*
  ⚠️ REPLACE POINT
  This file simulates OTP provider behavior.
  Later, THIS is the ONLY file you change.
*/

export async function requestNumber(app, server) {
  return {
    orderId: "MOCK_ORDER_" + Date.now(),
    number: "917XXXXXXX"
  };
}

export async function checkOtp(orderId) {
  return {
    status: "WAITING", // or "RECEIVED"
    otp: null
  };
}

export async function cancelNumber(orderId) {
  return true;
}
