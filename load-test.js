import http from "k6/http";
import { check } from "k6";

export default function () {
  const loginRes = http.post(
    "https://backend-gestion-candidat.onrender.com/api/auth/login",
    JSON.stringify({
      email: "admin@test.com",
      password: "1234",
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const token = JSON.parse(loginRes.body).token;

  const res = http.post(
    "https://backend-gestion-candidat.onrender.com/api/candidates",
    JSON.stringify({
      name: "Test k6",
      email: `k6${Math.random()}@mail.com`,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  check(res, {
    "status 201": (r) => r.status === 201,
  });
}