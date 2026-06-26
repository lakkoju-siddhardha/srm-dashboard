const form = document.getElementById("registerForm");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const btn = form.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "Registering...";
        btn.disabled = true;

        const reg_no = document.getElementById("reg_no").value;
        const password = document.getElementById("password").value;

        try {
            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reg_no, password })
            });

            const data = await res.json();
            alert(data.message);
        } catch (err) {
            console.error("Registration structural error:", err);
            alert("Failed to connect to the registration server.");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const btn = loginForm.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "Connecting to SRM Portal...";
        btn.disabled = true;

        const reg_no = document.getElementById("login_reg_no").value;
        const password = document.getElementById("login_password").value;

        try {
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reg_no, password })
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message); // Will alert "Login successful!"
                window.location.href = "/dashboard.html";
            } else {
                alert(data.message || "Portal login execution failed.");
            }
        } catch (err) {
            console.error("Login route communication exception:", err);
            alert("Server connection dropped or configuration runtime error.");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}