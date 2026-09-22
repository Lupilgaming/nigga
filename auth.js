/**
 * GrowGarden Client-Side Authentication Gate
 * Protects static HTML dashboards with SHA-256 password verification.
 */
(function () {
    const VALID_HASHES = [
        //      "c39de2fbee432a306d9e2e585d2c682edb772fbcebf0c1a3a36dd83edbfc51a2", // 'putitinafile'
        "96f85e88d382dd77bf1aa20dd66bfc2fdba889679221182b4e7f4749b41e5e14", // niggersforfree
        //      "e041c575a9b2c6841ad3416d04d0000f2958a059dcd0f12a7b2749eef05b66f8"  // 'put it in a file'
    ];
    const STORAGE_KEY = "gg_auth_token";

    // Immediate DOM-blocking style injection
    const styleEl = document.createElement("style");
    styleEl.id = "gg-auth-hide-style";
    styleEl.textContent = "body > * { display: none !important; } #gg-auth-overlay { display: flex !important; }";
    if (document.head) {
        document.head.appendChild(styleEl);
    } else {
        document.addEventListener("DOMContentLoaded", function () {
            if (document.head) document.head.appendChild(styleEl);
        });
    }

    async function computeSHA256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function removeLock() {
        const hideStyle = document.getElementById("gg-auth-hide-style");
        if (hideStyle) hideStyle.remove();
        const overlay = document.getElementById("gg-auth-overlay");
        if (overlay) overlay.remove();
    }

    function showOverlay() {
        if (!document.body) {
            document.addEventListener("DOMContentLoaded", showOverlay);
            return;
        }

        if (document.getElementById("gg-auth-overlay")) return;

        const overlay = document.createElement("div");
        overlay.id = "gg-auth-overlay";
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(9, 9, 11, 0.96);
            backdrop-filter: blur(12px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #f4f4f5;
        `;

        overlay.innerHTML = `
            <div style="
                background: #111114;
                border: 1px solid #27272a;
                border-radius: 12px;
                padding: 2.2rem 2rem;
                max-width: 420px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            ">
                <div style="font-size: 2.4rem; margin-bottom: 0.75rem;">🌱</div>
                <h2 style="font-size: 1.35rem; font-weight: 700; color: #f4f4f5; margin-bottom: 0.4rem; letter-spacing: -0.02em;">
                    GrowGarden Security Gate
                </h2>
                <p style="font-size: 0.85rem; color: #8e8e93; margin-bottom: 1.5rem; line-height: 1.5;">
                    Live execution telemetry &amp; portfolio analytics are password-protected. Enter passphrase to access.
                </p>
                <form id="gg-auth-form" onsubmit="return false;">
                    <div style="margin-bottom: 1rem;">
                        <input type="password" id="gg-auth-input" placeholder="Enter passphrase" autocomplete="current-password" autofocus style="
                            width: 100%;
                            padding: 0.75rem 1rem;
                            background: #1c1c20;
                            border: 1px solid #2e2e34;
                            border-radius: 8px;
                            color: #f4f4f5;
                            font-size: 0.95rem;
                            outline: none;
                            box-sizing: border-box;
                            transition: border-color 0.15s;
                        " />
                    </div>
                    <div id="gg-auth-error" style="display: none; color: #ef4444; font-size: 0.8rem; margin-bottom: 1rem; font-weight: 500;">
                        Incorrect passphrase. Access denied.
                    </div>
                    <button type="submit" id="gg-auth-btn" style="
                        width: 100%;
                        padding: 0.75rem 1rem;
                        background: #22c55e;
                        color: #09090b;
                        border: none;
                        border-radius: 8px;
                        font-size: 0.95rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: opacity 0.15s;
                    ">Unlock Dashboard</button>
                </form>
                <div style="margin-top: 1.5rem; font-size: 0.72rem; color: #52525b;">
                    Institutional Portfolio Telemetry &bull; Zerodha Kite Live
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const form = overlay.querySelector("#gg-auth-form");
        const input = overlay.querySelector("#gg-auth-input");
        const btn = overlay.querySelector("#gg-auth-btn");
        const err = overlay.querySelector("#gg-auth-error");

        input.addEventListener("focus", function () { input.style.borderColor = "#38bdf8"; });
        input.addEventListener("blur", function () { input.style.borderColor = "#2e2e34"; });

        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            btn.disabled = true;
            btn.textContent = "Verifying...";
            const entered = input.value.trim();
            const enteredHash = await computeSHA256(entered);

            if (VALID_HASHES.indexOf(enteredHash) !== -1) {
                sessionStorage.setItem(STORAGE_KEY, enteredHash);
                removeLock();
            } else {
                err.style.display = "block";
                input.style.borderColor = "#ef4444";
                input.value = "";
                input.focus();
                btn.disabled = false;
                btn.textContent = "Unlock Dashboard";
            }
        });

        setTimeout(function () { input.focus(); }, 100);
    }

    // Check existing session
    const savedToken = sessionStorage.getItem(STORAGE_KEY);
    if (savedToken && VALID_HASHES.indexOf(savedToken) !== -1) {
        // Already Authenticated in this browser session
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", removeLock);
        } else {
            removeLock();
        }
    } else {
        // Locked
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", showOverlay);
        } else {
            showOverlay();
        }
    }

    // Global logout helper
    window.logoutAuth = function () {
        sessionStorage.removeItem(STORAGE_KEY);
        location.reload();
    };
})();
