/* نسخة بدون Firebase: بيانات محلية + فلترة حسب الاسم/التصنيف */
const SITE = { name: "عنك", area: "المظيلف" };

const workers = [
  { name: "سعيد الصروي", category: "الكترونيات", rating: 4.7, whatsapp: "966500000001" },
  { name: "سارة العتيبي", category: "كهرباء", rating: 4.5, whatsapp: "966500000002" },
  { name: "محمد القحطاني", category: "تكييف", rating: 4.8, whatsapp: "966500000003" },
  { name: "عبدالله الشهري", category: "دهان", rating: 4.3, whatsapp: "966500000004" },
  { name: "ليلى الحربي", category: "تنظيف", rating: 4.6, whatsapp: "966500000005" },
  { name: "خالد الغامدي", category: "نجارة", rating: 4.4, whatsapp: "966500000006" },
  { name: "نورة المطيري", category: "صيانة عامة", rating: 4.2, whatsapp: "966500000007" }
];

function uniqueSorted(list){
  return Array.from(new Set(list)).sort((a,b)=>a.localeCompare(b, "ar"));
}

function starsForRating(rating){
  const r = Math.max(0, Math.min(5, Number(rating || 0)));
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function waLink(w){
  const text = `مرحباً ${w.name}، أحتاج خدمة ${w.category} في ${SITE.area}.`;
  return `https://wa.me/${encodeURIComponent(w.whatsapp)}?text=${encodeURIComponent(text)}`;
}

function cardTemplate(w){
  const safeName = escapeHtml(w.name);
  const safeCat = escapeHtml(w.category);
  const r = Number(w.rating || 0);

  return `
    <article class="card" data-category="${safeCat}" data-name="${safeName}">
      <header class="card-header">
        <div>
          <div class="name">${safeName}</div>
          <div class="muted small">${safeCat} • ${escapeHtml(SITE.area)}</div>
        </div>
        <span class="badge">${safeCat}</span>
      </header>

      <div class="rating" aria-label="التقييم ${r.toFixed(1)} من 5">
        <span class="stars" aria-hidden="true">${starsForRating(r)}</span>
        <span>${r.toFixed(1)}/5</span>
      </div>

      <div class="card-actions">
        <div class="phone" aria-label="رقم الهاتف">
          <small>الهاتف</small>
          <span dir="ltr">${escapeHtml(w.whatsapp)}</span>
        </div>
        <button class="btn btn-success btn-full js-copy" type="button" data-phone="${escapeHtml(w.whatsapp)}">
          نسخ الرقم
        </button>
      </div>
    </article>
  `;
}

function renderWorkers(list){
  const grid = document.getElementById("workersGrid");
  const countEl = document.getElementById("resultsCount");
  if (!grid) return;
  grid.innerHTML = list.map(cardTemplate).join("");
  if (countEl) countEl.textContent = `${list.length} نتيجة`;

  // زر النسخ
  grid.querySelectorAll(".js-copy").forEach(btn => {
    btn.addEventListener("click", async () => {
      const phone = btn.getAttribute("data-phone") || "";
      try{
        await navigator.clipboard.writeText(phone);
        showToast("تم نسخ رقم الهاتف ✅");
      } catch {
        // fallback قديم
        const ta = document.createElement("textarea");
        ta.value = phone;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        showToast("تم نسخ رقم الهاتف ✅");
      }
    });
  });
}

let toastTimer = null;
function showToast(text){
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function applyFilters(){
  const q = (document.getElementById("q")?.value || "").trim().toLowerCase();
  const category = document.getElementById("category")?.value || "";
  const sort = document.getElementById("sort")?.value || "rating_desc";

  const filtered = workers.filter(w => {
    const byText = !q || (w.name + " " + w.category).toLowerCase().includes(q);
    const byCategory = !category || w.category === category;
    return byText && byCategory;
  });

  // تحسين إضافي: ترتيب النتائج
  const sorted = [...filtered].sort((a,b) => {
    if (sort === "rating_asc") return (a.rating || 0) - (b.rating || 0);
    if (sort === "name_asc") return String(a.name).localeCompare(String(b.name), "ar");
    if (sort === "name_desc") return String(b.name).localeCompare(String(a.name), "ar");
    // rating_desc
    return (b.rating || 0) - (a.rating || 0);
  });

  renderWorkers(sorted);
}

function setup(){
  document.querySelectorAll("[data-site-name]").forEach(el => (el.textContent = SITE.name));
  document.querySelectorAll("[data-site-area]").forEach(el => (el.textContent = SITE.area));

  const categorySelect = document.getElementById("category");
  if (categorySelect){
    const cats = uniqueSorted(workers.map(w => w.category));
    categorySelect.innerHTML = `<option value="">الكل</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    categorySelect.addEventListener("change", applyFilters);
  }

  document.getElementById("sort")?.addEventListener("change", applyFilters);

  document.getElementById("q")?.addEventListener("input", () => {
    // فلترة سريعة بدون debounce (نسخة بسيطة)
    applyFilters();
  });

  document.getElementById("searchForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFilters();
  });

  document.getElementById("resetBtn")?.addEventListener("click", () => {
    const qEl = document.getElementById("q");
    if (qEl) qEl.value = "";
    if (categorySelect) categorySelect.value = "";
    applyFilters();
  });

  renderWorkers(workers);
}

document.addEventListener("DOMContentLoaded", setup);
