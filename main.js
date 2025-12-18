/* =====================================================
   MAIN.JS — CLEAN, FULL, WORKING VERSION
   - Tabs work
   - One flip button controls both eyes + flags
   - Templates load correctly with cutouts
   - Flags load correctly from left/right
   - Eyes load correctly
   ===================================================== */

/* ---------- simple helpers ---------- */
const $ = id => document.getElementById(id);
const q = sel => document.querySelectorAll(sel);
function orderedMatch(search, name) {
    const s = search
        .toLowerCase()
        .replace(/\s+/g, "");

    const n = name
        .toLowerCase()
        .replace(/\.(png|jpg|jpeg|webp)$/i, "");

    let i = 0;
    for (let ch of s) {
        i = n.indexOf(ch, i);
        if (i === -1) return false;
        i++;
    }
    return true;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => {
      showNoInternet();   // 🔴 SHOW NO INTERNET
      reject(new Error("Image failed: " + src));
    };

    img.src = src;
  });
}

/* ---------- CANVAS ---------- */
const canvas = $("editorCanvas");
const ctx = canvas.getContext("2d");
const SIZE = 400;
canvas.width = SIZE;
canvas.height = SIZE;

/* ---------- STATE ---------- */
let currentFlag = null;
let currentEyes = null;
let uploadedImage = null;

let eyeStyle = "eyes.s1";
let eyeIndex = 0;

let templateIndex = 0;
let currentTemplate = null;
let currentMask = null;

let adjustX = 0;
let adjustY = 0;
let adjustSize = 200;

let flipSide = "left";   // the single flip state used for BOTH eyes + flags

$("flipSide").onclick = async () => {

    flipSide = flipSide === "left" ? "right" : "left";

    // ✅ always flip eyes
    await loadEyes();
    renderEyeThumbnails();

    // ✅ ONLY flip flag if NO uploaded image
    if (!uploadedImage) {
        await loadFlag();
        renderFlagThumbnails();
    }

    drawCanvas();
};
/* ---------- DATA ---------- */
const templates = [
  { base: "circle_template.png", mask: "cutout.png" },
  { base: "oval_template.png", mask: "oval_template.cutout.png" },
  { base: "template3.png", mask:"cutout.png" },
  { base: "template4.png", mask: "cutout.png" }
];

const eyeSets = {
  "eyes.s1": 11,
  "eyes.s2": 13,
  "eyes.s3": 11
};

const eyeFiles = {
  "eyes.s2": ["21.png","23.png","24.png","22.png","25.png","26.png","27.png","28.png","29.png","210.png","211.png","212.png","213.png"],
  "eyes.s3": ["20250417_095053.png","20250417_095241.png","20250417_095250.png","20250417_095738.png","20250417_100100.png","20250417_100119.png","20250417_100159.png","20250417_100226.png","20250417_100246.png","20250417_100328.png","countryballs_girl_eyes_scared__by_nightprid_dg7xly8-pre.png"]
};

let flags = {
    left: [],
    right: [],
    thumb: [],
};

let flagIndex = 0;

/* =====================================================
   DRAW CANVAS
   ===================================================== */
function drawImageCentered(img, offsetX = 0, offsetY = 0, customSize = SIZE) {
    const w = img.width;
    const h = img.height;
    const ratio = w / h;

    let drawW, drawH;
    if (ratio > 1) {
        drawW = customSize;
        drawH = customSize / ratio;
    } else {
        drawH = customSize;
        drawW = customSize * ratio;
    }

    const x = (SIZE - drawW) / 2 + offsetX;
    const y = (SIZE - drawH) / 2 + offsetY;

    ctx.drawImage(img, x, y, drawW, drawH);
}

function drawCanvas() {
    ctx.clearRect(0, 0, SIZE, SIZE);

    // FLAG OR UPLOADED IMAGE
    if (currentFlag) drawImageCentered(currentFlag);
    else if (uploadedImage) drawImageCentered(uploadedImage);

    // MASK (cutout)
    if (currentMask) {
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = SIZE;
        maskCanvas.height = SIZE;
        const mctx = maskCanvas.getContext("2d");

        drawImageCentered(currentMask, 0, 0, SIZE);

        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(maskCanvas, 0, 0);
        ctx.globalCompositeOperation = "source-over";
    }

    // TEMPLATE OVERLAY
    if (currentTemplate) drawImageCentered(currentTemplate);

    // EYES
    if (currentEyes) {
        if (eyeStyle === "eyes.s1") {
            ctx.drawImage(currentEyes, 0, 0, SIZE, SIZE);
        } else {
            drawImageCentered(currentEyes, adjustX, adjustY, adjustSize);
        }
    }
}

/* =====================================================
   LOAD TEMPLATES
   ===================================================== */
async function loadTemplate() {
    const t = templates[templateIndex];

    try {
        currentTemplate = await loadImage(`assets/template/${t.base}`);
    } catch {
        currentTemplate = null;
    }

    try {
        currentMask = await loadImage(`assets/template/${t.mask}`);
    } catch {
        currentMask = null;
    }

    drawCanvas();
}

function renderTemplateList() {
    const list = $("templateList");
    list.innerHTML = "";

    templates.forEach((t,i) => {
        const img = document.createElement("img");
        img.src = `assets/template/${t.base}`;
        img.className = "template-thumb";
        img.onclick = () => {
            templateIndex = i;
            loadTemplate();
        };
        list.appendChild(img);
    });
}

/* =====================================================
   LOAD EYES
   ===================================================== */
async function loadEyes() {
    if (eyeStyle === "eyes.s1") {
        const side = flipSide === "left" ? "lefteyes" : "righteyes";
        const file = `${side}${eyeIndex + 1}.png`;

        try {
            currentEyes = await loadImage(`assets/eyes.s1/${side}/${file}`);
        } catch {
            currentEyes = null;
        }
    } else {
        const file = eyeFiles[eyeStyle][eyeIndex];
        try {
            currentEyes = await loadImage(`assets/${eyeStyle}/${file}`);
        } catch {
            currentEyes = null;
        }
    }

    drawCanvas();
}

function renderEyeThumbnails() {
    const grid = $("eyeThumbnails");
    grid.innerHTML = "";

    if (eyeStyle === "eyes.s1") {
        const side = flipSide === "left" ? "lefteyes" : "righteyes";

        for (let i = 0; i < eyeSets["eyes.s1"]; i++) {
            const img = document.createElement("img");
            img.src = `assets/eyes.s1/${side}/${side}${i+1}.png`;
            img.className = "eye-thumb";
            img.onclick = () => {
                eyeIndex = i;
                loadEyes();
                renderEyeThumbnails();
            };
            grid.appendChild(img);
        }
    } else {
        eyeFiles[eyeStyle].forEach((fname,i) => {
            const img = document.createElement("img");
            img.src = `assets/${eyeStyle}/${fname}`;
            img.className = "eye-thumb";
            img.onclick = () => {
                eyeIndex = i;
                loadEyes();
                renderEyeThumbnails();
            };
            grid.appendChild(img);
        });
    }
}

/* =====================================================
   LOAD FLAGS
   ===================================================== */
async function loadFlags() {
  try {
    const response = await fetch("flags.json");

    if (!response.ok) throw new Error("Network");

    const json = await response.json();

    flags.left = json.left || [];
    flags.right = json.right || [];
    flags.thumb = json.thumb || [];

  } catch (e) {
    showNoInternet();   // 🔴
  }

  renderFlagThumbnails();
  loadFlag();
}

function renderFlagThumbnails() {
    const grid = $("flagThumbnails");
    const searchBox = $("flagSearch");

    grid.innerHTML = "";

    const search = searchBox
        ? searchBox.value.trim().toLowerCase()
        : "";

    const list = flipSide === "left" ? flags.left : flags.right;

    const filtered = list.filter(name =>
    orderedMatch(search, name)
);

    filtered.forEach((fname, i) => {
        const img = document.createElement("img");
        img.src = `assets/flag/thumb/${fname}`;
        img.className = "flag-thumb";

        img.onclick = () => {
            flagIndex = i;
            loadFlag();
        };

        grid.appendChild(img);
    });
}

async function loadFlag() {
    const list = flipSide === "left" ? flags.left : flags.right;

    if (!list.length) {
        currentFlag = null;
        drawCanvas();
        return;
    }

    const file = list[flagIndex];

    try {
        currentFlag = await loadImage(`assets/flag/${flipSide}/${file}`);
    } catch {
        currentFlag = null;
    }

    drawCanvas();
}
$("flagSearch").oninput = renderFlagThumbnails;
/* =====================================================
   TABS
   ===================================================== */
   
document.addEventListener("DOMContentLoaded", () => {
    const buttons = q(".tab-button");
    const tabs = q(".tab-content");

    buttons.forEach(btn => {
        btn.onclick = () => {
            buttons.forEach(b => b.classList.remove("active"));
            tabs.forEach(t => t.classList.add("hidden"));

            btn.classList.add("active");
            $(btn.dataset.tab).classList.remove("hidden");
        };// 🔵 OPEN FLAGS TAB BY DEFAULT
const defaultBtn = document.querySelector('[data-tab="flagsTab"]');
if (defaultBtn) defaultBtn.click();// CLOSE FLAG SEARCH POPUP
const closeBtn = $("closeFlagPopup");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    $("flagSearchPopup").classList.add("hidden");
  });
}
    });
});
/* =====================================================
   FLAG SEARCH POPUP BUTTON
   ===================================================== */
if ($("flagSearchBtn")) {
  $("flagSearchBtn").onclick = () => {
    $("flagSearchPopup").classList.remove("hidden");
    $("flagPopupSearch").value = "";
    renderPopupFlags();
  };
}
/* =====================================================
   FLAG POPUP LIVE SEARCH
   ===================================================== */
if ($("flagPopupSearch")) {
  $("flagPopupSearch").oninput = () => {
    renderPopupFlags();
  };
}
/* =====================================================
   FLIP BUTTON — SINGLE BUTTON
   ===================================================== */


/* =====================================================
   ADJUST EYES TOGGLE
   ===================================================== */
$("toggleAdjust").onclick = () => {
    const panel = $("eyeAdjustControls");
    panel.classList.toggle("hidden");
};

/* =====================================================
   UPLOAD
   ===================================================== */
$("upload").onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const fr = new FileReader();
    fr.onload = () => {
        const img = new Image();
        img.onload = () => {
            uploadedImage = img;
            drawCanvas();
        };
        img.src = fr.result;
    };
    fr.readAsDataURL(file);
};
/* =====================================================
   EYE ADJUST SLIDERS (LIVE)
   ===================================================== */
$("eyeAdjustX").oninput = e => {
    adjustX = parseInt(e.target.value, 10);
    drawCanvas();
};

$("eyeAdjustY").oninput = e => {
    adjustY = parseInt(e.target.value, 10);
    drawCanvas();
};

$("eyeAdjustSize").oninput = e => {
    adjustSize = parseInt(e.target.value, 10);
    drawCanvas();
};/* =====================================================
   UPLOAD IMAGE (FIXED)
   ===================================================== */
const uploadInput = $("upload");

uploadInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            uploadedImage = img;
            currentFlag = null; // 🔴 IMPORTANT: disable flag when uploading
            drawCanvas();
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
});/* =====================================================
   DOWNLOAD IMAGE
   ===================================================== */
$("downloadBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "countryball.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});
/* =====================================================
   INITIALIZE
   ===================================================== */
(async () => {
    renderTemplateList();
    await loadTemplate();

    await loadEyes();
    renderEyeThumbnails();

    await loadFlags();
renderFlagThumbnails();

if (eyeStyle === "eyes.s1") {
    $("toggleAdjust").classList.add("hidden");
    $("eyeAdjustControls").classList.add("hidden");
}
    drawCanvas();
})();

/* Helper - draw image into a context preserving aspect ratio */

function drawPreserveToCtx(targetCtx, img, offsetX = 0, offsetY = 0, customSize = SIZE) {
  if (!img || !targetCtx) return;
  const hw = img.width / img.height;
  let dw, dh;
  if (hw > 1) { dw = customSize; dh = customSize / hw; }
  else { dh = customSize; dw = customSize * hw; }
  const ox = (SIZE - dw) / 2 + offsetX;
  const oy = (SIZE - dh) / 2 + offsetY;
  targetCtx.drawImage(img, ox, oy, dw, dh);
}

/* New drawCanvas: draw source -> apply mask on temp canvas -> draw overlay & eyes */
/* =====================================================
   DRAW IMAGE — CENTER CROP TO SQUARE (COVER)
   ===================================================== */
function drawImageCover(ctx, img) {
    const iw = img.width;
    const ih = img.height;

    // Determine crop size (square)
    const size = Math.min(iw, ih);
    const sx = (iw - size) / 2;
    const sy = (ih - size) / 2;

    ctx.drawImage(
        img,
        sx, sy, size, size,   // source crop
        0, 0, SIZE, SIZE      // destination
    );
}
function drawCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, SIZE, SIZE);

  // --- 1) offscreen source canvas
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = SIZE;
  sourceCanvas.height = SIZE;
  const sCtx = sourceCanvas.getContext('2d');

  // draw source
if (currentFlag) {
  drawPreserveToCtx(sCtx, currentFlag, 0, 0, SIZE);
} else if (uploadedImage) {
  drawImageCover(sCtx, uploadedImage); // ✅ CROP FIX
}

  // --- 2) apply mask
  if (currentMask) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = SIZE;
    maskCanvas.height = SIZE;
    const mCtx = maskCanvas.getContext('2d');

    drawPreserveToCtx(mCtx, currentMask, 0, 0, SIZE);

    sCtx.globalCompositeOperation = 'destination-in';
    sCtx.drawImage(maskCanvas, 0, 0);
    sCtx.globalCompositeOperation = 'source-over';
  }

  // --- 3) draw masked result
  ctx.drawImage(sourceCanvas, 0, 0);

  // --- 4) template overlay
  if (currentTemplate) {
    drawPreserveToCtx(ctx, currentTemplate, 0, 0, SIZE);
  }

  // --- 5) eyes
  if (currentEyes) {
    if (eyeStyle === "eyes.s1") {
      ctx.drawImage(currentEyes, 0, 0, SIZE, SIZE);
    } else {
      drawPreserveToCtx(ctx, currentEyes, adjustX, adjustY, adjustSize);
    }
  }
}
/* =====================================================
   EYE STYLE SELECT — FIX (DO NOT TOUCH OTHER CODE)
   ===================================================== */
$("eyeStyleSelect").addEventListener("change", async (e) => {

    // 1️⃣ change style
    eyeStyle = e.target.value;

    // 2️⃣ reset index
    eyeIndex = 0;

    // 3️⃣ clear old eyes
    currentEyes = null;

    // 4️⃣ SHOW / HIDE adjust button + panel
    const adjustBtn = $("toggleAdjust");
    const adjustPanel = $("eyeAdjustControls");

    if (eyeStyle === "eyes.s1") {
        adjustBtn.classList.add("hidden");
        adjustPanel.classList.add("hidden"); // force-close if open
    } else {
        adjustBtn.classList.remove("hidden");
    }

    // 5️⃣ reload
    await loadEyes();
    renderEyeThumbnails();

    // 6️⃣ redraw
    drawCanvas();
});
function showNoInternet() {
  const box = document.getElementById("noInternet");
  if (box) box.classList.remove("hidden");
}
function renderPopupFlags() {
  const box = $("flagPopupResults");
  const input = $("flagPopupSearch");

  const search = input.value.trim().toLowerCase();
  box.innerHTML = "";

  const list = flags.thumb;
  
  list.filter(name =>
    orderedMatch(search, name)
)
    .forEach((fname, i) => {
      const img = document.createElement("img");
      img.src = `assets/flag/thumb/${fname}`;
      img.onclick = async () => {
  const list = flipSide === "left" ? flags.left : flags.right;

  const index = list.indexOf(fname);
  if (index === -1) return; // safety

  flagIndex = index;
  await loadFlag();

  $("flagSearchPopup").classList.add("hidden");
};
      box.appendChild(img);
    });
}
