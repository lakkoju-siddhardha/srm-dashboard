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

    document.querySelectorAll('.nav-item').forEach(function (el) {
        el.classList.remove('active');
    });

    event.currentTarget.classList.add('active');

    var target = null;

    if (section === 'code')
        target = document.getElementById('code-section');

    else if (section === 'attendance')
        target = document.getElementById('attendance-section');

    else if (section === 'timetable')
        target = document.getElementById('timetable-section');

    else if (section === 'bunk')
        target = document.getElementById('bunk-section');

   else if (section === 'results') {
    target = document.getElementById('results-section');
}
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    if (window.innerWidth <= 700)
        closeMobileSidebar();
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
async function showExamSection(type) {

    const container = document.getElementById("examContent");

    container.innerHTML = `
        <div class="empty-state">
            <h3>Loading...</h3>
        </div>
    `;

    if (type === "results") {

        await loadResults();

    }
    else if (type === "internal") {

        loadInternalMarks();

    }
    else {

        loadCGPA();

    }

}

// ======================
// Internal Marks
// ======================

async function loadInternalMarks() {

    const container = document.getElementById("examContent");

    try {

        container.innerHTML = `
            <div class="empty-state">
                <h2>Loading Internal Marks...</h2>
            </div>
        `;

        const res = await fetch("/internal");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message);
        }

        let html = `

        <div class="results-card">

            <table class="results-table">

                <thead>

                    <tr>
                        <th>#</th>
                        <th>Code</th>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Max Marks</th>
                    </tr>

                </thead>

                <tbody>

        `;

        data.forEach((sub, index) => {

            html += `

                <tr>

                    <td>${index + 1}</td>

                    <td>${sub.subjectCode}</td>

                    <td>${sub.subject}</td>

                    <td>${sub.marksObtained}</td>

                    <td>${sub.maxMarks}</td>

                </tr>

            `;

        });

        html += `

                </tbody>

            </table>

        </div>

        `;

        container.innerHTML = html;

    }

    catch(err){

        console.error(err);

        container.innerHTML = `
            <div class="empty-state">
                <h2>Unable to load Internal Marks</h2>
                <p>${err.message}</p>
            </div>
        `;

    }

}
async function refreshInternalMarks() {

    try {

        const btn = document.getElementById("refreshInternalBtn");

        btn.disabled = true;
        btn.innerHTML = "⏳ Refreshing...";

        const res = await fetch("/refresh-internal");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message);
        }

        await loadInternalMarks();

        alert("Internal Marks Updated!");

    } catch (err) {

        alert(err.message);

    } finally {

        const btn = document.getElementById("refreshInternalBtn");

        btn.disabled = false;
        btn.innerHTML = "🔄 Refresh";

    }

}

// ======================
// CGPA
// ======================

async function loadCGPA() {

    const container = document.getElementById("examContent");

    try {

        container.innerHTML = `
            <div class="empty-state">
                <h2>Loading SGPA / CGPA...</h2>
            </div>
        `;

        const res = await fetch("/cgpa");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message);
        }

        container.innerHTML = `

        <div class="cgpa-card">

            <h2>🎓 Academic Performance</h2>

            <div class="cgpa-grid">

                <div class="cg-box">
                    <h3>Semester GPA</h3>
                    <div class="cg-value">${data.sgpa ?? "--"}</div>
                </div>

                <div class="cg-box">
                    <h3>Overall CGPA</h3>
                    <div class="cg-value">${data.cgpa ?? "--"}</div>
                </div>

            </div>

            <button
                id="refreshCgpaBtn"
                class="refresh-btn"
                onclick="refreshCGPA()">

                🔄 Refresh CGPA

            </button>

        </div>

        `;

    } catch(err){

        container.innerHTML = `
            <div class="empty-state">
                <h2>Unable to load CGPA</h2>
                <p>${err.message}</p>
            </div>
        `;

    }

}
async function refreshCGPA() {

    try {

        const btn = document.getElementById("refreshCgpaBtn");

        btn.disabled = true;
        btn.innerHTML = "⏳ Refreshing...";

        const res = await fetch("/refresh-cgpa");
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message);
        }

        await loadCGPA();

        alert("CGPA Updated Successfully!");

    } catch(err){

        alert(err.message);

    } finally{

        const btn = document.getElementById("refreshCgpaBtn");

        if(btn){
            btn.disabled = false;
            btn.innerHTML = "🔄 Refresh CGPA";
        }

    }

}
// ======================
// Semester Results
// ======================

async function loadResults() {

    const container = document.getElementById("examContent");

    try {

        container.innerHTML = `
            <div class="empty-state">
                <h3>Loading Results...</h3>
            </div>
        `;

      const res = await fetch("/results-db");
        const data = await res.json();

const results = data.results;
const sgpa = data.sgpa;

        console.log("Status:", res.status);
        console.log("Results:", data);

        if (!res.ok) {
            throw new Error(data.message);
        }

        let html = `
        <div class="results-card">
          
            <div class="table-responsive">

            <table class="results-table">

                <thead>

                    <tr>
                        <th>#</th>
                        <th>Code</th>
                        <th>Subject</th>
                        <th>Credits</th>
                        <th>Grade</th>
                        <th>Result</th>
                    </tr>

                </thead>

                <tbody>
        `;

        results.forEach((sub, index) => {

            const grade = sub.grade ?? "-";
            const result = sub.result ?? "-";
            const subjectCode = sub.subjectCode ?? "-";
            const subject = sub.subject ?? "-";
            const credits = sub.credits ?? "-";

            html += `
                <tr>

                    <td>${index + 1}</td>

                    <td>${subjectCode}</td>

                    <td>${subject}</td>

                    <td>${credits}</td>

                    <td>
                        <span class="grade grade-${String(grade).replace(/\+/g, "plus")}">
                            ${grade}
                        </span>
                    </td>

                    <td>
                        <span class="pass">
                            ${result}
                        </span>
                    </td>

                </tr>
            `;

        });

       html += `
        </tbody>
    </table>
    </div>

    <div class="sgpa-card">

        <div class="sgpa-title">
            Semester GPA
        </div>

        <div class="sgpa-value">
            ${sgpa ?? "--"}
        </div>

    </div>

</div>
`;

        container.innerHTML = html;

    }
    catch (err) {

        console.error("Results Error:", err);

        container.innerHTML = `
            <div class="empty-state">
                <h2>⚠ Unable to load results</h2>
                <p>${err.message}</p>
            </div>
        `;

    }

}
async function refreshResults() {

    try {

        const btn = document.querySelector(".refresh-btn");

        btn.disabled = true;
        btn.innerText = "Refreshing...";

        const res = await fetch("/refresh-results");

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message);
        }

        alert("Results updated successfully!");

        // Reload results from MySQL
        await loadResults();

    }
    catch (err) {

        alert(err.message);

    }
    finally {

        const btn = document.querySelector(".refresh-btn");

        btn.disabled = false;
        btn.innerText = "🔄 Refresh";

    }

}