const API = "YOUR_RENDER_BACKEND_URL";

async function login() {
  await fetch(`${API}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email: email.value,
      password: pass.value
    })
  });
  location.href = "dashboard.html";
}

async function createCoupon() {
  await fetch(`${API}/admin/coupon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      code: coupon.value
    })
  });
  alert("Coupon created");
}
