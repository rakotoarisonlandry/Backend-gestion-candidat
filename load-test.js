import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// ─── Métriques personnalisées ───────────────────────────────────────────────
const responseTime = new Trend("response_time_ms");
const errorRate    = new Rate("error_rate");

// ─── Config injectée via variables d'environnement ─────────────────────────
const VUS      = parseInt(__ENV.VUS      || "10");
const DURATION = __ENV.DURATION          || "30s";
const BASE_URL = __ENV.API_URL           || "https://backend-gestion-candidat.onrender.com";
const TOKEN    = __ENV.AUTH_TOKEN        || "";

export const options = {
  vus:      VUS,
  duration: DURATION,

  // Seuils : le job CI échoue si dépassés
  thresholds: {
    http_req_duration: ["p(95)<2000"],  // 95% des requêtes < 2 s
    error_rate:        ["rate<0.05"],   // moins de 5 % d'erreurs
    http_req_failed:   ["rate<0.01"],   // moins de 1 % d'échecs HTTP
  },
};

export default function () {
  const url     = `${BASE_URL}/api/candidates`;
  const payload = JSON.stringify({
    name:  `Load Test User ${__VU}`,
    email: `test_vu${__VU}_iter${__ITER}@mail.com`,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    timeout: "10s",
  };

  const res = http.post(url, payload, params);

  // Métriques
  responseTime.add(res.timings.duration);
  errorRate.add(res.status >= 400);

  const ok = check(res, {
    "status est 201":          (r) => r.status === 201,
    "body contient un id":     (r) => JSON.parse(r.body)?.id !== undefined,
    "temps de réponse < 2s":   (r) => r.timings.duration < 2000,
  });

  if (!ok) {
    console.error(`Échec VU=${__VU} iter=${__ITER} — status: ${res.status}`);
  }

  sleep(1);
}

// ─── Résumé final enrichi ──────────────────────────────────────────────────
export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.["p(95)"]?.toFixed(0) ?? "N/A";
  const rps  = data.metrics.http_reqs?.values?.rate?.toFixed(2) ?? "N/A";
  const errs = ((data.metrics.error_rate?.values?.rate ?? 0) * 100).toFixed(1);

  const md = `## Résultats K6\n
| Métrique | Valeur |
|---|---|
| VUs | ${VUS} |
| Durée | ${DURATION} |
| p(95) latence | ${p95} ms |
| Requêtes/s | ${rps} |
| Taux d'erreur | ${errs}% |
`;

  return {
    "stdout":               textSummary(data, { indent: " ", enableColors: true }),
    "/tmp/k6-summary.md":   md,
    "/tmp/k6-summary.json": JSON.stringify(data),
  };
}

import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";