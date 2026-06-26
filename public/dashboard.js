fetch("/check-session")
    .then(res => res.json())
    .then(data => {
        if (!data.loggedIn) {
            window.location.href = "/login.html";
        }
    });
  var sidebarCollapsed = false;

  function toggleSidebar() {
    var isMobile = window.innerWidth <= 700;
    if (isMobile) {
      var sb = document.getElementById('sidebar');
      var ov = document.getElementById('overlay');
      sb.classList.toggle('mobile-open');
      ov.classList.toggle('show');
      return;
    }
    sidebarCollapsed = !sidebarCollapsed;
    var sidebar = document.getElementById('sidebar');
    var topbar = document.getElementById('topbar');
    var main = document.getElementById('main');
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
    topbar.classList.toggle('sidebar-collapsed', sidebarCollapsed);
    main.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  }

  function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('overlay').classList.remove('show');
  }

  function navigate(section) {
    document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active'); });
    event.currentTarget.classList.add('active');
    var target = null;
    if (section === 'code') target = document.getElementById('code-section');
    else if (section === 'attendance') target = document.getElementById('attendance-section');
    else if (section === 'timetable') target = document.getElementById('timetable-section');
    else if (section === 'bunk') target = document.getElementById('bunk-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (window.innerWidth <= 700) closeMobileSidebar();
  }

  

 async function submitCode() {
    const input = document.getElementById("codeInput");
    const code = input.value.trim().toUpperCase();

    if (code.length < 4) {
        alert("Enter valid code");
        return;
    }

    const res = await fetch("/submit-code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
    });

    const data = await res.json();

    alert(data.message);

    input.value = "";
}

  const codeInput = document.getElementById("codeInput");

if (codeInput) {
    codeInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            submitCode();
        }
    });
}

  function addCodeChip(code, subject, time) {
    var history = document.getElementById('codeHistory');
    var chip = document.createElement('div');
    chip.className = 'code-chip';
    chip.innerHTML = '<span class="chip-dot"></span>' + code + '<span class="chip-time">' + subject + ' · ' + time + '</span>';
    history.insertBefore(chip, history.firstChild);
  }

  var subjectNames = [
    'DSA', 'DBMS', 'Operating Systems', 'Mathematics', 'Physics'
  ];

  function calcBunks() {
    var sel = document.getElementById('bunkSubject');
    var parts = sel.value.split(',');
    var pct = parseFloat(parts[0]);
    var total = parseInt(parts[1]);
    var threshold = parseInt(document.getElementById('bunkThreshold').value);

    var attended = Math.round(pct / 100 * total);
    var safeBunks = 0;

    for (var i = 0; i <= 50; i++) {
      var newTotal = total + i;
      var newPct = attended / newTotal * 100;
      if (newPct >= threshold) {
        safeBunks = i;
      } else break;
    }

    var subjName = sel.options[sel.selectedIndex].text.split(' (')[0];
    var bunkCount = document.getElementById('bunkCount');
    var bunkText = document.getElementById('bunkText');
    var bunkSub = document.getElementById('bunkSub');

    bunkCount.textContent = safeBunks;
    if (safeBunks === 0) {
      bunkCount.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      bunkText.textContent = 'classes you can safely bunk';
      bunkSub.textContent = 'You need more classes to maintain ' + threshold + '%';
    } else if (safeBunks <= 2) {
      bunkCount.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      bunkText.textContent = safeBunks === 1 ? 'class you can safely bunk' : 'classes you can safely bunk';
      bunkSub.textContent = 'in ' + subjName + ' while staying above ' + threshold + '%';
    } else {
      bunkCount.style.background = 'var(--grad-primary)';
      bunkText.textContent = 'classes you can safely bunk';
      bunkSub.textContent = 'in ' + subjName + ' while staying above ' + threshold + '%';
    }
    bunkCount.style.webkitBackgroundClip = 'text';
    bunkCount.style.webkitTextFillColor = 'transparent';
    bunkCount.style.backgroundClip = 'text';
  }

  calcBunks();
async function loadProfile() {
    try {
        

        const res = await fetch("/profile");
        const data = await res.json();

        console.log(data);

        // Main hero section
        const nameEl = document.getElementById("studentName");
        if (nameEl) nameEl.textContent = data.name;

        const regEl = document.getElementById("studentRegNo");
        if (regEl) regEl.textContent = data.reg_no;

        const semEl = document.getElementById("studentSemester");
        if (semEl) semEl.textContent = data.semester;

        const programEl = document.getElementById("studentProgram");
        if (programEl) {
            let program = data.program_section
                .split("[UG")[0]
                .trim();

            programEl.textContent = program;
        }

        // Top-right profile
        const topName = document.getElementById("topProfileName");
        if (topName) {
            topName.textContent = data.name.split(" ")[0]; // LAKKOJU only
        }

        // Avatar initials
        const avatar = document.getElementById("avatar");
        if (avatar) {
            const initials = data.name
                .split(" ")
                .map(word => word[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

            avatar.textContent = initials;
        }

    } catch (err) {
        console.log("Profile load failed:", err);
    }
}

loadProfile();
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {

        const confirmLogout = confirm("Are you sure you want to logout?");
        if (!confirmLogout) return;

        const res = await fetch("/logout", {
            method: "POST"
        });

        const data = await res.json();

        if (data.success) {
            window.location.href = "/login.html";
        } else {
            alert("Logout failed");
        }
    });
}