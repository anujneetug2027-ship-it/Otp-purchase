/* ===================== CONFIG ===================== */
/* 🔴 PUT YOUR RENDER BACKEND URL HERE */
const API = "https://otp-purchase.onrender.com";

/* ===================== LOGIN ===================== */
async function login() {
  try {
    const res = await fetch(`${API}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include", // REQUIRED for sessions
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("pass").value
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      window.location.href = "dashboard.html";
    } else {
      alert(data.error || "Invalid login");
    }
  } catch (err) {
    alert("Server not reachable");
    console.error(err);
  }
}

/* ===================== CREATE COUPON ===================== */
async function createCoupon() {
  try {
    const res = await fetch(`${API}/admin/coupon`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include", // REQUIRED for auth
      body: JSON.stringify({
        code: document.getElementById("coupon").value
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert("✅ Coupon created successfully");
      document.getElementById("coupon").value = "";
    } else {
      alert(data.error || "Failed to create coupon");
    }
  } catch (err) {
    alert("Server not reachable");
    console.error(err);
  }
}
