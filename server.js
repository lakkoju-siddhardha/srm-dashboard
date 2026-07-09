
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(express.static("public"));
console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_PORT =", process.env.DB_PORT);
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_NAME =", process.env.DB_NAME);
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
app.use(
    session({

        key: "srm.sid",

        secret: process.env.SESSION_SECRET,

        store: sessionStore,

        resave: false,

        saveUninitialized: false,

        cookie: {

            maxAge: 7 * 24 * 60 * 60 * 1000,

            httpOnly: true,

            sameSite: "lax",

            secure: false

        }

    })
);
db.connect((err) => {

    if (err) {
        console.log("DB connection failed:", err);
        return;
    }

    console.log("MySQL Connected");

    createTables();

});
async function createTables() {

    db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reg_no VARCHAR(20) UNIQUE,
            name VARCHAR(100),
            semester VARCHAR(20),
            program_section VARCHAR(100),
            password VARCHAR(255),
            srm_password TEXT,
            sgpa DECIMAL(4,2),
            cgpa DECIMAL(4,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.query(`
        CREATE TABLE IF NOT EXISTS results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reg_no VARCHAR(20),
            semester VARCHAR(20),
            subject_code VARCHAR(20),
            subject_name VARCHAR(255),
            credits VARCHAR(10),
            grade VARCHAR(10),
            result VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.query(`
        CREATE TABLE IF NOT EXISTS internal_marks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reg_no VARCHAR(20),
            subject_code VARCHAR(20),
            subject_name VARCHAR(255),
            marks_obtained DECIMAL(5,2),
            max_marks DECIMAL(5,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("Tables verified.");

}
function getSessionPath(reg_no) {
    return path.join(__dirname, "sessions", `${reg_no}.json`);
}
function sessionExists(reg_no) {
    return fs.existsSync(getSessionPath(reg_no));
}
function encrypt(text) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(process.env.ENCRYPTION_KEY),
        iv
    );

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
    const parts = text.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(process.env.ENCRYPTION_KEY),
        iv
    );

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

async function connectSRM(reg_no, encryptedPassword) {
    console.log("Attempting to connect to SRM");
    const srm_password = decrypt(encryptedPassword);
    let browser;

    try {
        browser = await chromium.launch({ headless: true });

        let context;

        if (sessionExists(reg_no)) {

    console.log("Saved session found");

    context = await browser.newContext({
        storageState: getSessionPath(reg_no)
    });

    const page = await context.newPage();

    await page.goto(
        "https://student.srmap.edu.in/srmapstudentcorner/HRDSystem"
    );

    // Session still valid?
    if (await page.locator("#UserName").count() === 0) {

        console.log("Using existing session");

        return {
            browser,
            context,
            page
        };
    }

    console.log("Session expired, logging in again");

    await context.close();
}

        console.log("No saved session");

        context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(
            "https://student.srmap.edu.in/srmapstudentcorner/StudentLoginPage"
        );

        await page.fill("#UserName", reg_no);
        await page.fill("#AuthKey", srm_password);

        const captchaElement = page.locator('img[src*="captchas"]');

        await captchaElement.screenshot({ path: "captcha.png" });

        await sharp("captcha.png")
            .resize(300)
            .grayscale()
            .threshold(150)
            .toFile("processed.png");

        const result = await Tesseract.recognize("processed.png", "eng");

        let captchaText = result.data.text
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");

        console.log("Captcha:", captchaText);

        await page.click("#ccode");
        await page.type("#ccode", captchaText, { delay: 300 });

        const typedValue = await page.inputValue("#ccode");
        console.log("Typed value:", typedValue);

        const loginBtn = page.locator('button[type="submit"]').last();

        await loginBtn.waitFor({ state: "visible" });
        await loginBtn.click({ force: true });

        await page.waitForURL(
            "https://student.srmap.edu.in/srmapstudentcorner/HRDSystem",
            { timeout: 15000 }
        );
        const profileRows = await page.$$eval(
    ".table.table-striped tbody tr",
    rows => rows.map(row => {
        const cols = [...row.querySelectorAll("td")].map(td =>
            td.innerText.trim()
        );
        return cols;
    })
);

     console.log(profileRows);
     let name = "";
let semester = "";
let programSection = "";

profileRows.forEach(row => {
    if (row[0].includes("Student Name")) {
        name = row[2];
    }

    if (row[0].includes("Semester")) {
        semester = row[2];
    }

    if (row[0].includes("Program / Section")) {
        programSection = row[2];
    }
});

console.log(name, semester, programSection);
     await new Promise((resolve, reject) => {
    db.query(
        `UPDATE users
         SET name=?, semester=?, program_section=?
         WHERE reg_no=?`,
        [name, semester, programSection, reg_no],
        (err) => {
            if (err) reject(err);
            else resolve();
        }
    );
});
        await context.storageState({
    path: getSessionPath(reg_no)
});

return {
    browser,
    context,
    page
};
    } catch (err) {
        console.log("connectSRM error:", err.message);

        if (browser) await browser.close();
        throw err;
    }
}
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/login", async (req, res) => {

    console.log("LOGIN ROUTE HIT");

    const { reg_no, password } = req.body;

    try {

        let user = await new Promise((resolve, reject) => {

            db.query(
                "SELECT * FROM users WHERE reg_no = ?",
                [reg_no],
                (err, results) => {

                    if (err) reject(err);
                    else resolve(results[0]);

                }
            );

        });

        // First time user → create account automatically
        if (!user) {

            const hashedPassword = await bcrypt.hash(password, 10);
            const encryptedPassword = encrypt(password);

            const result = await new Promise((resolve, reject) => {

                db.query(
                    "INSERT INTO users (reg_no, password, srm_password) VALUES (?, ?, ?)",
                    [reg_no, hashedPassword, encryptedPassword],
                    (err, result) => {

                        if (err) {
    console.error("INSERT ERROR:", err);
    reject(err);
}
                        else resolve(result);

                    }
                );

            });

            user = {
                id: result.insertId,
                reg_no,
                password: hashedPassword,
                srm_password: encryptedPassword
            };

        }

        // Existing user → verify password
        else {

            const match = await bcrypt.compare(password, user.password);

            if (!match) {

                return res.json({
                    message: "Wrong password"
                });

            }

        }

        req.session.userId = user.id;
        req.session.reg_no = user.reg_no;

        if (!sessionExists(user.reg_no)) {

            console.log("Auto connecting SRM...");
            await connectSRM(user.reg_no, user.srm_password);

        }

        res.json({
            message: "Login successful"
        });

    }

    catch (err) {

    console.error("LOGIN ERROR:");
    console.error(err);

    res.status(500).json({
        message: err.message
    });

}

});
app.get("/dashboard-data", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Not logged in"
        });
    }

    res.json({
        reg_no: req.session.reg_no
    });
});
app.get("/check-session", (req, res) => {
    if (req.session.userId) {
        res.json({
            loggedIn: true,
            reg_no: req.session.reg_no
        });
    } else {
        res.json({
            loggedIn: false
        });
    }
});
app.post("/submit-code", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Login required" });
    }

    const { code } = req.body;
    const reg_no = req.session.reg_no;
    let browser;

    try {
        // Get password once
        const user = await new Promise((resolve, reject) => {
            db.query(
                "SELECT srm_password FROM users WHERE reg_no=?",
                [reg_no],
                (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                }
            );
        });

        const srm_password = decrypt(user.srm_password);

        browser = await chromium.launch({ headless: true });

        const context = await browser.newContext({
            storageState: getSessionPath(reg_no)
        });

        const page = await context.newPage();

        await page.goto(
  "https://student.srmap.edu.in/srmapstudentcorner/HRDSystem",
  { waitUntil: "domcontentloaded" }
);

        // Login if needed
        if (await page.locator("#UserName").count() > 0) {
            console.log("Login page detected");

            await page.fill("#UserName", reg_no);
            await page.fill("#AuthKey", srm_password);

            const captchaElement = page.locator('img[src*="captcha"]');
            await captchaElement.screenshot({ path: "captcha.png" });

            await sharp("captcha.png")
                .resize(300)
                .grayscale()
                .threshold(150)
                .toFile("processed.png");

            const result = await Tesseract.recognize("processed.png", "eng");

            let captchaText = result.data.text
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .substring(0, 5);

            console.log("Captcha:", captchaText);

            await page.fill("#ccode", captchaText);
            await page.click('button[type="submit"]');

            await page.waitForLoadState("networkidle");
        }

        console.log("URL:", page.url());

        // DEBUG screenshot
        await page.screenshot({ path: "after-login.png" });

        await page.waitForSelector("body");

        await page.getByText("Academic").click();
        await page.getByText("Student Attendance").click();

        await page.waitForSelector("#txtCode");
        await page.fill("#txtCode", code);
        await page.click("button.btnconfirm");

        await page.waitForTimeout(10000);
        await browser.close();

        res.json({
            success: true,
            message: "Attendance submitted successfully"
        });

    } catch (err) {
        console.log("Submit error:", err);

        if (browser) await browser.close();

        res.status(500).json({
            success: false,
            message: "Attendance submission failed"
        });
    }
});
app.get("/timetable-data", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Login required"
        });
    }

    const reg_no = req.session.reg_no;
    let browser;

    try {
        browser = await chromium.launch({ headless: true });

        const context = await browser.newContext({
            storageState: getSessionPath(reg_no)
        });

        const page = await context.newPage();

        await page.goto(
            "https://student.srmap.edu.in/srmapstudentcorner/HRDSystem"
        );

        console.log("SRM opened");

        await page.locator('text="Academic"').click();
        await page.locator('text="Time Table"').click();

        console.log("Timetable clicked");

        await page.waitForTimeout(5000);

        const rows = await page.$$eval("table tbody tr", rows =>
            rows.map(row => {
                const cols = [...row.querySelectorAll("td")].map(td =>
                    td.innerText.trim()
                );
                return cols;
            })
        );

        console.log(rows);

        await browser.close();

        res.json({ rows });

    } catch (err) {
        console.log(err.message);

        if (browser) await browser.close();

        res.status(500).json({
            message: "Failed to fetch timetable"
        });
    }
});
        app.get("/profile", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            message: "Login required"
        });
    }

    db.query(
        `SELECT reg_no, name, semester, program_section
         FROM users
         WHERE id=?`,
        [req.session.userId],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    message: "Database error"
                });
            }
             console.log(results);
            res.json(results[0]);
        }
    );
});
app.get("/refresh-results", async (req, res) => {

    console.log("RESULTS ROUTE HIT");

    if (!req.session.userId) {
        return res.status(401).json({
            message: "Login required"
        });
    }

    const reg_no = req.session.reg_no;

    let browser;

    try {

        // Get encrypted SRM password
        const user = await new Promise((resolve, reject) => {

            db.query(
                "SELECT srm_password FROM users WHERE reg_no = ?",
                [reg_no],
                (err, results) => {

                    if (err) reject(err);
                    else resolve(results[0]);

                }
            );

        });
         console.log("User from DB:", user);
        // Login / reuse session
        const connection = await connectSRM(
            reg_no,
            user.srm_password
        );

        browser = connection.browser;
        const page = connection.page;

        await page.goto(
            "https://student.srmap.edu.in/srmapstudentcorner/HRDSystem",
            {
                waitUntil: "networkidle"
            }
        );

        // Open Examination
        await page.getByText("Examination", { exact: true }).click();

        await page.waitForSelector(
            'text="Current Semester Results"',
            {
                state: "visible",
                timeout: 10000
            }
        );

        // Open Results
        await page.getByText(
            "Current Semester Results",
            { exact: true }
        ).click();

        await page.waitForTimeout(3000);

        const table = page.locator("table.table-striped").first();

        await table.waitFor({
            state: "visible",
            timeout: 10000
        });

        // ==========================
        // SCRAPE RESULTS
        // ==========================

        const results = await table.locator("tbody tr").evaluateAll(rows =>

            rows
                .map(row => {

                    const cols = [...row.querySelectorAll("td")].map(td =>
                        td.innerText.trim()
                    );

                    // Skip invalid rows
                    if (cols.length < 6)
                        return null;

                    return {
                        semester: cols[0],
                        subjectCode: cols[1],
                        subject: cols[2],
                        credits: cols[3],
                        grade: cols[4],
                        result: cols[5]
                    };

                })
                .filter(Boolean)

        );

       const sgpa = await page.evaluate(() => {

    const text = document.body.innerText;

    const match = text.match(/S\.?G\.?P\.?A\.?\s*[: ]?\s*([0-9.]+)/i);

    return match ? match[1] : null;

});

console.log("SGPA:", sgpa);
        // ==========================
        // DELETE OLD RESULTS
        // ==========================

        await new Promise((resolve, reject) => {

            db.query(
                "DELETE FROM results WHERE reg_no = ?",
                [reg_no],
                err => {

                    if (err) reject(err);
                    else resolve();

                }
            );

        });

        // ==========================
        // INSERT NEW RESULTS
        // ==========================

        for (const row of results) {

            await new Promise((resolve, reject) => {

                db.query(

                    `INSERT INTO results
                    (reg_no, semester, subject_code, subject_name, credits, grade, result)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,

                    [
                        reg_no,
                        row.semester,
                        row.subjectCode,
                        row.subject,
                        row.credits,
                        row.grade,
                        row.result
                    ],

                    err => {

                        if (err) reject(err);
                        else resolve();

                    }

                );

            });

        }
         await new Promise((resolve, reject) => {

    db.query(
        "UPDATE users SET sgpa = ? WHERE reg_no = ?",
        [sgpa, reg_no],
        err => {
            if (err) reject(err);
            else resolve();
        }
    );

});
        await browser.close();

       res.json({
    results,
    sgpa
});

    }

    catch (err) {

        console.error("RESULTS ERROR");
        console.error(err);

        if (browser)
            await browser.close();

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
app.get("/results-db", (req, res) => {

    if (!req.session.userId)
        return res.status(401).json({
            message: "Login required"
        });

    db.query(
        `SELECT
            semester,
            subject_code AS subjectCode,
            subject_name AS subject,
            credits,
            grade,
            result
         FROM results
         WHERE reg_no = ?
         ORDER BY id`,
        [req.session.reg_no],
        (err, rows) => {

            if (err)
                return res.status(500).json({
                    message: "Database error"
                });

            db.query(
                "SELECT sgpa FROM users WHERE reg_no = ?",
                [req.session.reg_no],
                (err2, userRows) => {

                    if (err2)
                        return res.status(500).json({
                            message: "Database error"
                        });

                    res.json({
                        results: rows,
                        sgpa: userRows[0]?.sgpa
                    });

                }
            );

        }
    );

});
app.get("/refresh-internal", async (req, res) => {

    console.log("INTERNAL MARKS ROUTE HIT");

    if (!req.session.userId) {
        return res.status(401).json({
            message: "Login required"
        });
    }

    const reg_no = req.session.reg_no;

    let browser;

    try {

        // Get encrypted SRM password
        const user = await new Promise((resolve, reject) => {

            db.query(
                "SELECT srm_password FROM users WHERE reg_no = ?",
                [reg_no],
                (err, results) => {

                    if (err) reject(err);
                    else resolve(results[0]);

                }

            );

        });
        console.log("User from DB:", user);
        // Login / reuse session
        const connection = await connectSRM(
            reg_no,
            user.srm_password
        );

        browser = connection.browser;
        const page = connection.page;

        await page.goto(
            "https://student.srmap.edu.in/srmapstudentcorner/HRDSystem",
            {
                waitUntil: "networkidle"
            }
        );

        // Open Examination
        await page.getByText("Examination", { exact: true }).click();

        await page.waitForSelector(
            'text="Internal Mark Details"',
            {
                state: "visible",
                timeout: 10000
            }
        );

        // Open Internal Marks
        await page.getByText(
            "Internal Mark Details",
            { exact: true }
        ).click();

        await page.waitForTimeout(3000);

        const table = page.locator("table.table-striped").first();

        await table.waitFor({
            state: "visible",
            timeout: 10000
        });

        // ==========================
        // SCRAPE INTERNAL MARKS
        // ==========================

        const internalMarks = await table.locator("tbody tr").evaluateAll(rows =>

            rows
                .map(row => {

                    const cols = [...row.querySelectorAll("td")].map(td =>
                        td.innerText.trim()
                    );

                if (
    cols.length < 4 ||
    cols[2] === "Mark Secured(Conducted)" ||
    cols[1] === "Name"
)
    return null;

                    return {

                        subjectCode: cols[0],
                        subject: cols[1],
                        marksObtained: cols[2],
                        maxMarks: cols[3]

                    };

                })
                .filter(Boolean)

        );

        console.log(internalMarks);

        // ==========================
        // DELETE OLD MARKS
        // ==========================

        await new Promise((resolve, reject) => {

            db.query(
                "DELETE FROM internal_marks WHERE reg_no = ?",
                [reg_no],
                err => {

                    if (err) reject(err);
                    else resolve();

                }

            );

        });

        // ==========================
        // INSERT NEW MARKS
        // ==========================

        for (const row of internalMarks) {

            await new Promise((resolve, reject) => {

                db.query(

                    `INSERT INTO internal_marks
                    (reg_no, subject_code, subject_name, marks_obtained, max_marks)
                    VALUES (?, ?, ?, ?, ?)`,

                    [
                        reg_no,
                        row.subjectCode,
                        row.subject,
                        row.marksObtained,
                        row.maxMarks
                    ],

                    err => {

                        if (err) reject(err);
                        else resolve();

                    }

                );

            });

        }

        await browser.close();

        res.json(internalMarks);

    }

    catch (err) {

        console.error("INTERNAL MARKS ERROR");
        console.error(err);

        if (browser)
            await browser.close();

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
app.get("/internal", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            message: "Login required"
        });
    }

    db.query(

        `SELECT
            subject_code AS subjectCode,
            subject_name AS subject,
            marks_obtained AS marksObtained,
            max_marks AS maxMarks
        FROM internal_marks
        WHERE reg_no = ?
        ORDER BY id`,

        [req.session.reg_no],

        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.json(rows);

        }

    );

}); 
app.get("/refresh-cgpa", async (req, res) => {

    console.log("CGPA ROUTE HIT");

    if (!req.session.userId) {
        return res.status(401).json({
            message: "Login required"
        });
    }

    const reg_no = req.session.reg_no;

    let browser;

    try {

        // Get encrypted SRM password
        const user = await new Promise((resolve, reject) => {

            db.query(
                "SELECT srm_password FROM users WHERE reg_no = ?",
                [reg_no],
                (err, results) => {

                    if (err) reject(err);
                    else resolve(results[0]);

                }

            );

        });
    console.log("User from DB:", user);
        // Login / reuse session
        const connection = await connectSRM(
            reg_no,
            user.srm_password
        );

        browser = connection.browser;
        const page = connection.page;

        await page.goto(
            "https://student.srmap.edu.in/srmapstudentcorner/HRDSystem",
            {
                waitUntil: "networkidle"
            }
        );

        // Open Examination
        await page.getByText("Examination", { exact: true }).click();

        await page.waitForSelector(
            'text="Exam Mark Details"',
            {
                state: "visible",
                timeout: 10000
            }
        );

        // Open Exam Mark Details
        await page.getByText(
            "Exam Mark Details",
            { exact: true }
        ).click();

        await page.waitForTimeout(3000);

        // ==========================
        // SCRAPE CGPA
        // ==========================

        const cgpa = await page.evaluate(() => {

            const text = document.body.innerText;

            const match = text.match(/CGPA\s*:?\s*([0-9.]+)/i);

            return match ? match[1] : null;

        });

        console.log("CGPA:", cgpa);

        if (!cgpa) {
            throw new Error("Unable to fetch CGPA");
        }

        // ==========================
        // UPDATE DATABASE
        // ==========================

        await new Promise((resolve, reject) => {

            db.query(

                "UPDATE users SET cgpa = ? WHERE reg_no = ?",

                [cgpa, reg_no],

                err => {

                    if (err) reject(err);
                    else resolve();

                }

            );

        });

        await browser.close();

        res.json({
            success: true,
            cgpa
        });

    }

    catch (err) {

        console.error("CGPA ERROR");
        console.error(err);

        if (browser)
            await browser.close();

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    });
app.get("/cgpa", (req, res) => {

    if (!req.session.userId) {
        return res.status(401).json({
            message: "Login required"
        });
    }

    db.query(
        "SELECT sgpa, cgpa FROM users WHERE reg_no = ?",
        [req.session.reg_no],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.json(rows[0]);

        }
    );

});

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({
                success: false,
                message: "Logout failed"
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true
        });
    });
});
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(`http://localhost:5000/login.html`);
});
