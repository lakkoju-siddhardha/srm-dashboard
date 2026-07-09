console.log("Login response:", data);

if (res.ok) {
    alert("Login Successful");
    window.location.href = "/dashboard.html";
} else {
    alert(data.message);
}