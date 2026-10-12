// scripts/smoke_test.mjs
// Automated smoke-test suite for AlgoCraft baseline verification

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const PAGES = [
    { path: "/Login", expectedStatus: 200, name: "Login Page" },
    { path: "/signup", expectedStatus: 200, name: "Signup Page" },
    { path: "/dashboard", expectedStatus: 200, name: "Dashboard Route" },
    { path: "/timetable", expectedStatus: 200, name: "Timetable Page" },
    { path: "/tasks", expectedStatus: 200, name: "Tasks Page" },
    { path: "/notes", expectedStatus: 200, name: "Notes Page" },
    { path: "/custom-notes", expectedStatus: 200, name: "Custom Notes Page" },
    { path: "/planly", expectedStatus: 200, name: "Planly Page" },
    { path: "/aptitude", expectedStatus: 200, name: "Aptitude Page" },
    { path: "/dsaquestions", expectedStatus: 200, name: "DSA Questions Page" },
];

const LOGGED_OUT_APIS = [
    { path: "/api/timetable", expectedStatus: 401, method: "GET" },
    { path: "/api/task", expectedStatus: 401, method: "GET" },
    { path: "/api/tasktoday", expectedStatus: 401, method: "GET" },
    { path: "/api/notes", expectedStatus: 401, method: "GET" },
    { path: "/api/custom-notes", expectedStatus: 401, method: "GET" },
    { path: "/api/dsaquestions", expectedStatus: 401, method: "GET" },
    { path: "/api/habits", expectedStatus: 401, method: "GET" },
    { path: "/api/aptitude", expectedStatus: 401, method: "GET" },
    // Note: /api/users currently returns 200 or 404 in baseline before Phase 1 hardening!
];

async function runTests() {
    console.log(`\n========================================`);
    console.log(`🧪 AlgoCraft Smoke Test Suite`);
    console.log(`Target: ${BASE_URL}`);
    console.log(`========================================\n`);

    let passed = 0;
    let failed = 0;

    // 1. Test Pages
    console.log(`--- [1/3] Testing Page Endpoints ---`);
    for (const page of PAGES) {
        const start = performance.now();
        try {
            const res = await fetch(`${BASE_URL}${page.path}`, { redirect: "follow" });
            const duration = (performance.now() - start).toFixed(1);
            if (res.status === page.expectedStatus) {
                console.log(`  ✅ [PASS] ${page.path.padEnd(20)} HTTP ${res.status} (${duration}ms)`);
                passed++;
            } else {
                console.log(`  ❌ [FAIL] ${page.path.padEnd(20)} Expected ${page.expectedStatus}, got ${res.status}`);
                failed++;
            }
        } catch (err) {
            console.log(`  ❌ [ERROR] ${page.path.padEnd(20)} ${err.message}`);
            failed++;
        }
    }

    // 2. Test Logged-out API Security (should be 401)
    console.log(`\n--- [2/3] Testing Logged-Out API Security Gates ---`);
    for (const api of LOGGED_OUT_APIS) {
        const start = performance.now();
        try {
            const res = await fetch(`${BASE_URL}${api.path}`, { method: api.method });
            const duration = (performance.now() - start).toFixed(1);
            if (res.status === api.expectedStatus) {
                console.log(`  ✅ [PASS] ${api.path.padEnd(22)} Protected: HTTP ${res.status} (${duration}ms)`);
                passed++;
            } else {
                console.log(`  ❌ [FAIL] ${api.path.padEnd(22)} Expected ${api.expectedStatus}, got ${res.status}`);
                failed++;
            }
        } catch (err) {
            console.log(`  ❌ [ERROR] ${api.path.padEnd(22)} ${err.message}`);
            failed++;
        }
    }

    // 3. Test Auth Input Validation
    console.log(`\n--- [3/3] Testing Auth Input Validation ---`);
    try {
        const res = await fetch(`${BASE_URL}/api/auth/Login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "invalid-email-format", password: "12" })
        });
        if (res.status === 400) {
            console.log(`  ✅ [PASS] /api/auth/Login      Correctly rejected invalid payload with HTTP 400`);
            passed++;
        } else {
            console.log(`  ❌ [FAIL] /api/auth/Login      Expected HTTP 400 for bad input, got ${res.status}`);
            failed++;
        }
    } catch (err) {
        console.log(`  ❌ [ERROR] /api/auth/Login      ${err.message}`);
        failed++;
    }

    console.log(`\n========================================`);
    console.log(`Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
