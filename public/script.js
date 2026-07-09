const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const btn = loginForm.querySelector("button");
        const originalText = btn.textContent;

        btn.textContent = "Logging in...";
        btn.disabled = true;

        const reg_no = document.getElementById("login_reg_no").value;
        const password = document.getElementById("login_password").value;

        try {

            const res = await fetch("/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    reg_no,
                    password
                })

            });

            const data = await res.json();

            if (res.ok) {

                window.location.href = "/dashboard.html";

            } else {

                alert(data.message);

            }

        } catch (err) {

            console.error(err);
            alert("Unable to connect to the server.");

        } finally {

            btn.textContent = originalText;
            btn.disabled = false;

        }

    });

}