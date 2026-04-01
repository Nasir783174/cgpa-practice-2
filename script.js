// ============================================================
// GRADING SCALES
// ============================================================
const SCALES = {
  standard: [
    { label: "A+ (4.00)", value: 4.00, letter: "A+" },
    { label: "A  (3.75)", value: 3.75, letter: "A" },
    { label: "A− (3.50)", value: 3.50, letter: "A−" },
    { label: "B+ (3.25)", value: 3.25, letter: "B+" },
    { label: "B  (3.00)", value: 3.00, letter: "B" },
    { label: "B− (2.75)", value: 2.75, letter: "B−" },
    { label: "C+ (2.50)", value: 2.50, letter: "C+" },
    { label: "C  (2.25)", value: 2.25, letter: "C" },
    { label: "C− (2.00)", value: 2.00, letter: "C−" },
    { label: "D  (1.75)", value: 1.75, letter: "D" },
    { label: "F  (0.00)", value: 0.00, letter: "F" },
  ],
  na: [
    { label: "A  (4.00)", value: 4.00, letter: "A" },
    { label: "A− (3.70)", value: 3.70, letter: "A−" },
    { label: "B+ (3.30)", value: 3.30, letter: "B+" },
    { label: "B  (3.00)", value: 3.00, letter: "B" },
    { label: "B− (2.70)", value: 2.70, letter: "B−" },
    { label: "C+ (2.30)", value: 2.30, letter: "C+" },
    { label: "C  (2.00)", value: 2.00, letter: "C" },
    { label: "C− (1.70)", value: 1.70, letter: "C−" },
    { label: "D+ (1.30)", value: 1.30, letter: "D+" },
    { label: "D  (1.00)", value: 1.00, letter: "D" },
    { label: "F  (0.00)", value: 0.00, letter: "F" },
  ]
};

// ============================================================
// STATE
// ============================================================
let currentScale = "standard";
let semesterCount = 0;
let sgpaRowCount = 0;

// ============================================================
// HELPERS
// ============================================================
function getScale() {
  return SCALES[currentScale];
}

function buildDropdown(selectedValue = null) {
  const scale = getScale();
  let opts = `<option value="" disabled ${selectedValue === null ? "selected" : ""}>Grade</option>`;
  scale.forEach(g => {
    const sel = (selectedValue !== null && parseFloat(selectedValue) === g.value) ? "selected" : "";
    opts += `<option value="${g.value}" ${sel}>${g.label}</option>`;
  });
  return opts;
}

function getCGPAGrade(cgpa) {
  if (cgpa >= 3.75) return "Excellent";
  if (cgpa >= 3.50) return "Very Good";
  if (cgpa >= 3.00) return "Good";
  if (cgpa >= 2.50) return "Average";
  if (cgpa >= 2.00) return "Below Average";
  return "Poor";
}

// ============================================================
// SCALE PREVIEW
// ============================================================
function renderScalePreview() {
  const scale = getScale();
  const preview = document.getElementById("scalePreview");
  const items = scale.slice(0, 5).map(g =>
    `<span class="preview-item"><span class="pi-letter">${g.letter}</span><span class="pi-val">${g.value.toFixed(2)}</span></span>`
  ).join("");
  preview.innerHTML = `<div class="preview-row">${items}<span class="preview-more">+${scale.length - 5} more</span></div>`;
}

// ============================================================
// COURSE ROW
// ============================================================
function createCourseRow(semId, courseId) {
  const row = document.createElement("div");
  row.className = "course-row";
  row.dataset.semId = semId;
  row.dataset.courseId = courseId;
  row.innerHTML = `
    <input type="text" class="course-name" placeholder="Course name" />
    <input type="number" class="course-credit" placeholder="Credits" min="0.5" step="0.5" />
    <select class="course-grade">${buildDropdown(null)}</select>
    <button class="btn-delete-course" title="Remove course">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  row.querySelector(".course-grade").addEventListener("change", recalcAll);
  row.querySelector(".course-credit").addEventListener("input", recalcAll);
  row.querySelector(".course-name").addEventListener("input", recalcAll);
  row.querySelector(".btn-delete-course").addEventListener("click", function () {
    const semBox = document.querySelector(`.semester-box[data-sem-id="${semId}"]`);
    const rows = semBox.querySelectorAll(".course-row");
    if (rows.length <= 1) { showToast("At least one course is required per semester."); return; }
    row.classList.add("removing");
    setTimeout(() => { row.remove(); recalcAll(); }, 250);
  });

  return row;
}

// ============================================================
// SEMESTER
// ============================================================
function createSemester() {
  semesterCount++;
  const semId = semesterCount;
  const box = document.createElement("div");
  box.className = "semester-box";
  box.dataset.semId = semId;
  box.innerHTML = `
    <div class="semester-header">
      <div class="semester-title-wrap">
        <span class="semester-num">Semester ${semId}</span>
        <input type="text" class="semester-name-input" placeholder="(optional name)" />
      </div>
      <div class="semester-right-wrap">
        <div class="semester-sgpa-wrap">
          <span class="sgpa-tag-label">SGPA</span>
          <span class="sgpa-tag-val" id="sgpa-sem-${semId}">0.00</span>
        </div>
        <button class="btn-delete-semester" title="Remove semester">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="courses-container" id="courses-${semId}"></div>
    <button class="btn-add-course" data-sem-id="${semId}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Add Course
    </button>
  `;

  box.querySelector(".btn-delete-semester").addEventListener("click", function () {
    if (document.querySelectorAll(".semester-box").length <= 1) {
      showToast("At least one semester is required.");
      return;
    }
    box.style.transition = "opacity 0.25s, transform 0.25s";
    box.style.opacity = "0";
    box.style.transform = "translateY(-8px)";
    setTimeout(() => { box.remove(); recalcAll(); }, 250);
  });

  box.querySelector(".btn-add-course").addEventListener("click", function () {
    const sid = parseInt(this.dataset.semId);
    const container = document.getElementById(`courses-${sid}`);
    const newRow = createCourseRow(sid, container.querySelectorAll(".course-row").length + 1);
    newRow.style.opacity = "0";
    container.appendChild(newRow);
    requestAnimationFrame(() => { newRow.style.transition = "opacity 0.2s"; newRow.style.opacity = "1"; });
    recalcAll();
  });

  box.querySelector(".semester-name-input").addEventListener("input", recalcAll);
  box.querySelector(`#courses-${semId}`).appendChild(createCourseRow(semId, 1));

  return box;
}

// ============================================================
// SGPA ROWS
// ============================================================
function createSGPARow() {
  sgpaRowCount++;
  const idx = sgpaRowCount;
  const row = document.createElement("div");
  row.className = "sgpa-row";
  row.dataset.rowId = idx;
  row.innerHTML = `
    <input type="text" class="sgpa-sem-name" placeholder="Semester ${idx}" value="Semester ${idx}" />
    <input type="number" class="sgpa-val-input" placeholder="0.00" min="0" max="4" step="0.01" />
    <button class="btn-delete-sgpa" title="Remove row">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  row.querySelector(".sgpa-val-input").addEventListener("input", calcSGPAtoCGPA);
  row.querySelector(".btn-delete-sgpa").addEventListener("click", function () {
    if (document.querySelectorAll(".sgpa-row").length <= 1) { showToast("At least one row required."); return; }
    row.remove();
    calcSGPAtoCGPA();
  });
  return row;
}

// ============================================================
// CALCULATIONS
// ============================================================
function calcSGPA(semId) {
  let totalPoints = 0, totalCredits = 0;
  document.querySelectorAll(`.course-row[data-sem-id="${semId}"]`).forEach(row => {
    const credit = parseFloat(row.querySelector(".course-credit").value) || 0;
    const grade  = parseFloat(row.querySelector(".course-grade").value) || 0;
    totalPoints  += credit * grade;
    totalCredits += credit;
  });
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

function recalcAll() {
  let totalWP = 0, totalCredits = 0;
  const semBoxes = document.querySelectorAll(".semester-box");

  semBoxes.forEach(box => {
    const semId = parseInt(box.dataset.semId);
    const sgpa = calcSGPA(semId);
    const semCredits = Array.from(box.querySelectorAll(".course-credit"))
      .reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
    totalWP      += sgpa * semCredits;
    totalCredits += semCredits;
    const el = document.getElementById(`sgpa-sem-${semId}`);
    if (el) el.textContent = sgpa.toFixed(2);
  });

  const cgpa = totalCredits > 0 ? totalWP / totalCredits : 0;

  // Main display
  animateValue(document.getElementById("cgpaDisplay"), parseFloat(document.getElementById("cgpaDisplay").textContent) || 0, cgpa, 400);
  document.getElementById("totalCredits").textContent    = totalCredits.toFixed(1);
  document.getElementById("totalSemesters").textContent  = semBoxes.length;
  document.getElementById("cgpaGradeLabel").textContent  = cgpa > 0 ? getCGPAGrade(cgpa) : "–";
  document.getElementById("cgpaBar").style.width         = ((cgpa / 4) * 100) + "%";

  // Sticky bar
  document.getElementById("stickyCGPA").textContent      = cgpa.toFixed(2);
  document.getElementById("stickyCredits").textContent   = totalCredits.toFixed(1);
  document.getElementById("stickySemesters").textContent = semBoxes.length;
  document.getElementById("stickyGrade").textContent     = cgpa > 0 ? getCGPAGrade(cgpa) : "–";

  // Auto-fill current CGPA in target
  document.getElementById("currentCGPA").value = cgpa > 0 ? cgpa.toFixed(2) : "";
  calcTarget();
}

function calcTarget() {
  const totalCredits = parseFloat(document.getElementById("totalCredits").textContent) || 0;
  const current      = parseFloat(document.getElementById("currentCGPA").value) || 0;
  const target       = parseFloat(document.getElementById("targetCGPA").value) || 0;
  const remaining    = parseFloat(document.getElementById("remainingCredits").value) || 0;

  const el        = document.getElementById("requiredGPA");
  const container = document.getElementById("targetResult");
  container.className = "target-result";

  if (!target || !remaining) { el.textContent = "–"; return; }

  const required = ((target * (totalCredits + remaining)) - (current * totalCredits)) / remaining;

  if (required > 4.00) {
    el.textContent = "Not Possible";
    container.classList.add("target-impossible");
  } else if (required < 0) {
    el.textContent = "Already Achieved!";
    container.classList.add("target-achieved");
  } else {
    el.textContent = required.toFixed(2);
    container.classList.add("target-possible");
  }
}

function calcSGPAtoCGPA() {
  let total = 0, count = 0;
  document.querySelectorAll(".sgpa-val-input").forEach(inp => {
    const v = parseFloat(inp.value);
    if (!isNaN(v)) { total += v; count++; }
  });
  document.getElementById("sgpaCGPA").textContent = (count > 0 ? total / count : 0).toFixed(2);
}

// ============================================================
// ANIMATE VALUE
// ============================================================
function animateValue(el, from, to, duration) {
  const start = performance.now();
  function update(time) {
    const t = Math.min((time - start) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    el.textContent = (from + (to - from) * ease).toFixed(2);
    if (t < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ============================================================
// SCALE CHANGE
// ============================================================
function updateAllDropdowns() {
  document.querySelectorAll(".course-grade").forEach(select => {
    const currentVal = parseFloat(select.value);
    const scale = getScale();
    let matched = null;
    scale.forEach(g => { if (g.value === currentVal) matched = g.value; });
    select.innerHTML = buildDropdown(matched);
  });
  renderScalePreview();
  recalcAll();
}

// ============================================================
// PDF DOWNLOAD
// ============================================================
function generatePDF() {
  const cgpa       = document.getElementById("cgpaDisplay").textContent;
  const totalCred  = document.getElementById("totalCredits").textContent;
  const totalSem   = document.getElementById("totalSemesters").textContent;
  const gradeLabel = getCGPAGrade(parseFloat(cgpa));
  const scaleLabel = currentScale === "standard" ? "Standard Scale" : "North American Scale";
  const dateStr    = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const targetCGPA     = document.getElementById("targetCGPA").value;
  const remainingCred  = document.getElementById("remainingCredits").value;
  const requiredGPA    = document.getElementById("requiredGPA").textContent;

  let semestersHTML = "";
  document.querySelectorAll(".semester-box").forEach(box => {
    const semId   = parseInt(box.dataset.semId);
    const semName = box.querySelector(".semester-name-input").value.trim() || `Semester ${semId}`;
    const sgpa    = document.getElementById(`sgpa-sem-${semId}`)?.textContent || "0.00";
    let courseRows = "", semCredits = 0;

    box.querySelectorAll(".course-row").forEach((row, i) => {
      const name    = row.querySelector(".course-name").value.trim() || "Unnamed Course";
      const credit  = row.querySelector(".course-credit").value || "–";
      const gradeEl = row.querySelector(".course-grade");
      const gradeTxt = gradeEl.selectedIndex > 0 ? gradeEl.options[gradeEl.selectedIndex].text : "–";
      const gp      = parseFloat(gradeEl.value) || 0;
      if (parseFloat(credit)) semCredits += parseFloat(credit);
      const bg = i % 2 === 0 ? "#faf8f4" : "#ffffff";
      courseRows += `<tr style="background:${bg}">
        <td style="padding:8px 12px;border-bottom:1px solid #e8e3da;">${name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8e3da;text-align:center;">${credit}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8e3da;text-align:center;">${gradeTxt}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8e3da;text-align:center;font-weight:700;color:#c4854a;">${gp > 0 ? gp.toFixed(2) : "–"}</td>
      </tr>`;
    });

    semestersHTML += `
      <div style="margin-bottom:28px;break-inside:avoid;">
        <div style="background:#1a1a1e;border-radius:10px 10px 0 0;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#fff;font-weight:700;font-size:14px;">${semName}</span>
          <span style="color:#c4854a;font-weight:700;font-size:15px;">SGPA: ${sgpa}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e8e3da;border-top:none;">
          <thead><tr style="background:#ede8de;">
            <th style="padding:8px 12px;text-align:left;font-size:11px;letter-spacing:.08em;color:#5a5750;font-weight:700;text-transform:uppercase;border-bottom:1px solid #ddd8ce;">Course</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;letter-spacing:.08em;color:#5a5750;font-weight:700;text-transform:uppercase;border-bottom:1px solid #ddd8ce;">Credits</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;letter-spacing:.08em;color:#5a5750;font-weight:700;text-transform:uppercase;border-bottom:1px solid #ddd8ce;">Grade</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;letter-spacing:.08em;color:#5a5750;font-weight:700;text-transform:uppercase;border-bottom:1px solid #ddd8ce;">GP</th>
          </tr></thead>
          <tbody>${courseRows}</tbody>
        </table>
        <div style="text-align:right;font-size:12px;color:#8c867d;margin-top:6px;">Credits: ${semCredits.toFixed(1)}</div>
      </div>`;
  });

  let targetHTML = "";
  if (targetCGPA && remainingCred) {
    const color = requiredGPA === "Not Possible" ? "#b85555" : requiredGPA === "Already Achieved!" ? "#c4854a" : "#4a8c6a";
    targetHTML = `
      <div style="background:#faf8f4;border:1px solid #e8e3da;border-radius:10px;padding:18px 20px;margin-bottom:28px;break-inside:avoid;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#c4854a;margin-bottom:10px;">Target CGPA Plan</div>
        <div style="display:flex;gap:32px;flex-wrap:wrap;">
          <div><div style="font-size:11px;color:#8c867d;margin-bottom:2px;">Current CGPA</div><div style="font-size:18px;font-weight:700;">${cgpa}</div></div>
          <div><div style="font-size:11px;color:#8c867d;margin-bottom:2px;">Target CGPA</div><div style="font-size:18px;font-weight:700;">${targetCGPA}</div></div>
          <div><div style="font-size:11px;color:#8c867d;margin-bottom:2px;">Remaining Credits</div><div style="font-size:18px;font-weight:700;">${remainingCred}</div></div>
          <div><div style="font-size:11px;color:#8c867d;margin-bottom:2px;">Required GPA</div><div style="font-size:22px;font-weight:700;color:${color};">${requiredGPA}</div></div>
        </div>
      </div>`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>CGPA Report – GradeCalc</title>
  <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,serif;background:#fff;color:#1a1a1e;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@page{margin:18mm 16mm;size:A4;}}</style>
  </head><body>
  <div style="background:#1a1a1e;padding:28px 32px 24px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div><div style="font-size:22px;font-weight:700;color:#fff;">◈ GradeCalc</div>
      <div style="font-size:13px;color:rgba(255,255,255,.45);margin-top:4px;">Academic CGPA Report</div></div>
      <div style="text-align:right;"><div style="font-size:12px;color:rgba(255,255,255,.45);">Generated: ${dateStr}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.45);margin-top:2px;">Scale: ${scaleLabel}</div></div>
    </div>
  </div>
  <div style="background:#ede8de;padding:20px 32px;display:flex;gap:40px;align-items:center;margin-bottom:32px;border-bottom:2px solid #ddd8ce;">
    <div><div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8c867d;">Overall CGPA</div>
    <div style="font-size:42px;font-weight:700;color:#1a1a1e;line-height:1.1;">${cgpa}</div>
    <div style="font-size:13px;color:#c4854a;font-weight:600;margin-top:2px;">${gradeLabel}</div></div>
    <div style="width:1px;height:60px;background:#ddd8ce;"></div>
    <div><div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8c867d;">Total Credits</div>
    <div style="font-size:28px;font-weight:700;color:#1a1a1e;">${totalCred}</div></div>
    <div style="width:1px;height:60px;background:#ddd8ce;"></div>
    <div><div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8c867d;">Semesters</div>
    <div style="font-size:28px;font-weight:700;color:#1a1a1e;">${totalSem}</div></div>
  </div>
  <div style="padding:0 32px 32px;">
    ${targetHTML}${semestersHTML}
    <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e8e3da;display:flex;justify-content:space-between;font-size:11px;color:#8c867d;">
      <span>Generated by GradeCalc – gamingnasir420@gmail.com</span><span>${dateStr}</span>
    </div>
  </div>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `CGPA-Report-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Report downloaded successfully!");
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast-visible"));
  setTimeout(() => {
    toast.classList.remove("toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// MOBILE MENU
// ============================================================
function closeMobileMenu() {
  document.getElementById("mobileMenu").classList.remove("open");
  document.getElementById("hamburger").classList.remove("active");
}

// ============================================================
// INIT
// ============================================================
function init() {
  // Scale
  document.querySelectorAll('input[name="scale"]').forEach(radio => {
    radio.addEventListener("change", function () {
      currentScale = this.value;
      document.getElementById("scaleStandardLabel").classList.toggle("scale-active", currentScale === "standard");
      document.getElementById("scaleNALabel").classList.toggle("scale-active", currentScale === "na");
      updateAllDropdowns();
    });
  });
  document.getElementById("scaleStandardLabel").classList.add("scale-active");
  renderScalePreview();

  // Semesters
  const semContainer = document.getElementById("semestersContainer");
  semContainer.appendChild(createSemester());
  document.getElementById("addSemesterBtn").addEventListener("click", function () {
    const newSem = createSemester();
    newSem.style.opacity = "0";
    newSem.style.transform = "translateY(12px)";
    semContainer.appendChild(newSem);
    requestAnimationFrame(() => {
      newSem.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      newSem.style.opacity = "1";
      newSem.style.transform = "translateY(0)";
    });
    recalcAll();
  });

  // SGPA rows
  const sgpaContainer = document.getElementById("sgpaRowsContainer");
  sgpaContainer.appendChild(createSGPARow());
  document.getElementById("addSGPARow").addEventListener("click", function () {
    sgpaContainer.appendChild(createSGPARow());
    calcSGPAtoCGPA();
  });

  // Target inputs
  document.getElementById("targetCGPA").addEventListener("input", calcTarget);
  document.getElementById("remainingCredits").addEventListener("input", calcTarget);
  document.getElementById("currentCGPA").addEventListener("input", calcTarget);

  // PDF
  document.getElementById("downloadPDF").addEventListener("click", generatePDF);

  // Hamburger
  document.getElementById("hamburger").addEventListener("click", function () {
    this.classList.toggle("active");
    document.getElementById("mobileMenu").classList.toggle("open");
  });

  // Sticky bar — show when calculator section enters view
  const stickyBar = document.getElementById("stickyBar");
  const observer  = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        stickyBar.classList.add("visible");
      } else if (entry.boundingClientRect.top > 0) {
        stickyBar.classList.remove("visible");
      }
    },
    { threshold: 0, rootMargin: "-60px 0px 0px 0px" }
  );
  const calcSection = document.querySelector(".calculator-section");
  if (calcSection) observer.observe(calcSection);

  recalcAll();
}

document.addEventListener("DOMContentLoaded", init);

// ============================================================
// CGPA INFORMATION PAGE — Hamburger menu
// (runs only if on cgpa-information page)
// ============================================================
(function () {
  const hamburger  = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  if (!hamburger || !mobileMenu) return;
  // skip if already handled by main init (index.html)
  if (document.getElementById("semestersContainer")) return;

  hamburger.addEventListener("click", function () {
    this.classList.toggle("active");
    mobileMenu.classList.toggle("open");
  });
  document.querySelectorAll(".mobile-nav-link").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      mobileMenu.classList.remove("open");
    });
  });
})();
