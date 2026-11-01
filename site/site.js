"use strict";

const REPO = "mohamedjs/remote-control";
const STORAGE_PREFIX = "rc";

const T = {
  en: {
    "brand.name": "Remote Control",
    "nav.download": "Download",
    "nav.features": "Features",
    "nav.how": "How It Works",
    "nav.open": "Open Source",
    "nav.faq": "FAQ",

    "hero.title": "Control your computer from your phone. With zero lag.",
    "hero.lead": "Transform your iOS or Android mobile into a responsive laptop trackpad, keyboard, and macro deck with instant WiFi pairing.",
    "hero.download": "Download for {os}",
    "hero.other": "Other Platforms",
    "hero.badge": "Zero Latency · WiFi Ready",
    "hero.version": "Version {v} · free & open source",
    "hero.mobile": "Get the companion mobile app on your phone or scan to pair.",

    "dl.title": "Download Remote Control",
    "dl.sub": "Free, open-source desktop daemon for Windows, macOS, and Linux.",
    "dl.yours": "your device",
    "dl.copy": "Copy",
    "dl.copied": "Copied!",
    "dl.win.req": "Windows 10 or 11 (64-bit)",
    "dl.win.setup": "Download Installer (.exe)",
    "dl.win.portable": "Portable Zip (No Install)",
    "dl.win.note": "Windows may prompt SmartScreen on first run: choose More info → Run anyway.",
    "dl.mac.req": "macOS 12 Monterey or later",
    "dl.mac.arm": "Apple Silicon (M1–M4)",
    "dl.mac.intel": "Intel Mac",
    "dl.linux.req": "Ubuntu, Debian & systemd distros (64-bit)",
    "dl.linux.deb": "Download .deb Package",
    "dl.linux.tar": "Portable Tarball (.tar.gz)",
    "dl.all": "All Releases on GitHub",

    "how.title": "Up and Running in 30 Seconds",
    "how.1.t": "1. Run the Desktop App",
    "how.1.d": "Install the lightweight background service or run the desktop dashboard on your PC or Mac.",
    "how.2.t": "2. Pair Instantly via QR",
    "how.2.d": "Open the companion app on your phone and scan the desktop dashboard's QR code on your local WiFi.",
    "how.3.t": "3. Control Seamlessly",
    "how.3.d": "Glide across your screen with smooth gestures, type text, or tap tailored decks for YouTube, VLC, and Spotify.",

    "feat.title": "Built for Speed and Ergonomics",
    "feat.1.t": "Zero-Lag Trackpad",
    "feat.1.d": "Sub-millisecond WebSocket streaming with non-coalescing TCP packets and smooth pointer acceleration.",
    "feat.2.t": "Universal Context Decks",
    "feat.2.d": "Pre-built instant decks for YouTube, Spotify, Netflix, VLC, VS Code, Google Meet, and system media.",
    "feat.3.t": "Natural Voice AI",
    "feat.3.d": "Speak naturally to trigger complex actions using the built-in Groq Llama-3 intent parser.",
    "feat.4.t": "Air-Tight Whitelist Security",
    "feat.4.d": "The mobile phone names deck controls only — raw arbitrary shell commands or untrusted keys can never run.",
    "feat.5.t": "Cross-Platform Ecosystem",
    "feat.5.d": "First-class native installers for Windows, macOS Apple Silicon & Intel, and Linux (.deb + portable).",
    "feat.6.t": "100% Open Source",
    "feat.6.d": "No telemetry, no external servers, no subscriptions. Everything stays securely inside your local network.",

    "open.title": "Free, Private & Open Source",
    "open.lead": "Your keystrokes and trackpad interactions never leave your home or office local network.",
    "open.f1": "Strict local loopback & LAN security",
    "open.f2": "Single layered modular monolith architecture",
    "open.f3": "MIT/ISC licensed community project",
    "open.cta": "View on GitHub",
    "open.note": "Star us on GitHub and contribute!",

    "faq.title": "Frequently Asked Questions",
    "faq.1.q": "Do my phone and computer need to be on the same WiFi?",
    "faq.1.a": "Yes! Remote Control communicates directly over your local area network (LAN) for maximum privacy and zero latency.",
    "faq.2.q": "Is internet access required?",
    "faq.2.a": "No internet connection is required for trackpad, keyboard, or deck controls. Only the optional voice intent feature queries the Groq API.",
    "faq.3.q": "How do I launch the desktop window?",
    "faq.3.a": "Simply run `remote-control dashboard` in your terminal or click the application icon from your system menu.",

    "foot.made": "Crafted with pair-programming precision",
  },
  ar: {
    "brand.name": "التحكم عن بعد",
    "nav.download": "التحميل",
    "nav.features": "المميزات",
    "nav.how": "طريقة العمل",
    "nav.open": "مفتوح المصدر",
    "nav.faq": "الأسئلة الشائعة",

    "hero.title": "تحكم في جهاز الكمبيوتر من هاتفك.. بدون أي تأخير.",
    "hero.lead": "حوّل هاتفك الآيفون أو الأندرويد إلى لوحة لمس فائقة السرعة، ولوحة مفاتيح، ووحدة تحكم في الوسائط عبر الواي فاي فوراً.",
    "hero.download": "حمّل لـ {os}",
    "hero.other": "أنظمة تشغيل أخرى",
    "hero.badge": "سرعة فائقة · جاهز عبر الواي فاي",
    "hero.version": "إصدار {v} · مجاني ومفتوح المصدر",
    "hero.mobile": "حمّل تطبيق الموبايل أو امسح الباركود للاتصال فوراً.",

    "dl.title": "تحميل برنامج التحكم عن بعد",
    "dl.sub": "خادم مكتبي مجاني ومفتوح المصدر لأنظمة ويندوز، وماك، ولينكس.",
    "dl.yours": "جهازك الحالي",
    "dl.copy": "نسخ",
    "dl.copied": "تم النسخ!",
    "dl.win.req": "ويندوز 10 أو 11 (64-بت)",
    "dl.win.setup": "تحميل ملف التثبيت (.exe)",
    "dl.win.portable": "نسخة محمولة بدون تثبيت (.zip)",
    "dl.win.note": "قد تظهر رسالة فحص ويندوز في المرة الأولى: اختر More info ثم Run anyway.",
    "dl.mac.req": "macOS 12 Monterey أو أحدث",
    "dl.mac.arm": "معالجات آبل (M1–M4)",
    "dl.mac.intel": "أجهزة ماك إنتل",
    "dl.linux.req": "توزيعات أوبونتو وديبيان (64-بت)",
    "dl.linux.deb": "تحميل حزمة ‎.deb",
    "dl.linux.tar": "أرشيف محمول (.tar.gz)",
    "dl.all": "جميع الإصدارات على GitHub",

    "how.title": "ابدأ في 30 ثانية فقط",
    "how.1.t": "1. شغّل البرنامج المكتبي",
    "how.1.d": "ثبّت البرنامج الخفيف أو شغّل لوحة التحكم المكتبية على حاسوبك الشخصي.",
    "how.2.t": "2. اربط الهاتف عبر الباركود",
    "how.2.d": "افتح تطبيق الهاتف وامسح رمز QR المعروض على شاشة الكمبيوتر عبر نفس شبكة الواي فاي.",
    "how.3.t": "3. تحكّم بكل أريحية",
    "how.3.d": "حرّك المؤشر بسلاسة فائقة، واكتب النصوص، واستمتع بلوحات تحكم جاهزة ليوتيوب، وسبوتيفاي، وفي إل سي.",

    "feat.title": "صُمم للسرعة الفائقة والراحة التامة",
    "feat.1.t": "تراك باد بدون أي لاغ",
    "feat.1.d": "استجابة فورية بأجزاء من الميلي ثانية مع بروتوكول WebSocket المحسّن بدون تأخير.",
    "feat.2.t": "لوحات تحكم ذكية وشاملة",
    "feat.2.d": "أزرار تحكم جاهزة ومخصصة ليوتيوب، نتفليكس، في إل سي، سبوتيفاي، في إس كود، وميت.",
    "feat.3.t": "أوامر صوتية ذكية بالذكاء الاصطناعي",
    "feat.3.d": "تحدث بلغتك الطبيعية لتنفيذ أوامر متعددة عبر محرك Groq Llama-3 الذكي.",
    "feat.4.t": "حماية مشددة بقائمة الأوامر المعتمدة",
    "feat.4.d": "الهاتف لا يرسل سوى معرّف الزر فقط — مستحيل تنفيذ أي أوامر ضارة أو أكواد مجهولة.",
    "feat.5.t": "دعم كامل لجميع المنصات",
    "feat.5.d": "حزم تثبيت رسمية ومخصصة لويندوز، وماك بنسختيه، ولينكس بدعم systemd.",
    "feat.6.t": "مفتوح المصدر 100%",
    "feat.6.d": "بدون خوادم خارجية وبدون اشتراكات. كل بياناتك وتحركاتك تبقى داخل شبكتك المنزلية حصراً.",

    "open.title": "مجاني، آمن، ومفتوح المصدر",
    "open.lead": "تحركاتك وكتاباتك لا تغادر شبكتك المحلية إطلاقاً.",
    "open.f1": "أمان تام معتمد على الشبكة المحلية",
    "open.f2": "معمارية معيارية أحادية قوية ونظيفة",
    "open.f3": "مشروع مفتوح بالكامل بترخيص حر",
    "open.cta": "مشاهدة المشروع على GitHub",
    "open.note": "امنحنا نجمة على GitHub وشارك معنا!",

    "faq.title": "الأسئلة الشائعة",
    "faq.1.q": "هل يجب أن يكون الهاتف والكمبيوتر على نفس شبكة الواي فاي؟",
    "faq.1.a": "نعم! يتواصل التطبيق مباشرة عبر شبكتك المحلية (LAN) لتحقيق أعلى درجات الخصوصية وسرعة استجابة فورية.",
    "faq.2.q": "هل يتطلب البرنامج اتصالاً بالإنترنت؟",
    "faq.2.a": "لا! وظائف لوحة اللمس والكيبورد وأزرار التحكم تعمل محلياً بدون إنترنت. فقط ميزة الأوامر الصوتية الاختيارية تحتاج الاتصال بمحرك الذكاء الاصطناعي.",
    "faq.3.q": "كيف أفتح نافذة لوحة التحكم المكتبية؟",
    "faq.3.a": "ببساطة اكتب `remote-control dashboard` في موجه الأوامر أو اضغط على أيقونة التطبيق في جهازك.",

    "foot.made": "تم التطوير بأعلى معايير البرمجة الزوجية",
  },
};

const OS_NAME = { windows: "Windows", macos: "macOS", linux: "Linux", android: "Android", mobile: "Mobile" };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

let lang = store.get(`${STORAGE_PREFIX}-lang`) || ((navigator.language || "").startsWith("ar") ? "ar" : "en");
let release = null;
const OS = detectOS();

function t(key, vars = {}) {
  let s = (T[lang] && T[lang][key]) || T.en[key] || key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

function detectOS() {
  const ua = navigator.userAgent || "";
  const p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "mobile";
  if (/win/i.test(p) || /windows/i.test(ua)) return "windows";
  if (/mac/i.test(p) || /mac os x/i.test(ua)) return "macos";
  if (/linux|x11|cros/i.test(p + ua)) return "linux";
  return "windows";
}

const PICK = {
  setup: /RemoteControl-Setup-.*\.exe$/i,
  portable: /windows-x64-portable\.zip$/i,
  "mac-arm": /macos-arm64\.zip$/i,
  "mac-intel": /macos-x86_64\.zip$/i,
  deb: /_amd64\.deb$/i,
  tar: /linux-x86_64\.tar\.gz$/i,
  sums: /^SHA256SUMS/i,
};
const HERO_ASSET = { windows: "setup", macos: "mac-arm", linux: "deb" };

async function loadRelease() {
  for (const url of ["release.json", `https://api.github.com/repos/${REPO}/releases/latest`]) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (res.ok) {
        const data = await res.json();
        if (data && data.assets) return data;
      }
    } catch {}
  }
  return null;
}

function asset(kind) {
  return release && release.assets && release.assets.find((a) => PICK[kind] && PICK[kind].test(a.name));
}

function renderDownloads() {
  const fallback = `https://github.com/${REPO}/releases/latest`;
  if ($("#all-releases")) $("#all-releases").href = `https://github.com/${REPO}/releases`;
  if ($("#repo-link")) $("#repo-link").href = `https://github.com/${REPO}`;
  if ($("#foot-repo")) $("#foot-repo").href = `https://github.com/${REPO}`;

  $$("[data-asset]").forEach((el) => {
    const a = asset(el.dataset.asset);
    const label = t(el.dataset.i18n);
    el.href = a ? a.browser_download_url : fallback;
    el.innerHTML = "";
    el.append(label);
    if (a) {
      const s = document.createElement("small");
      s.textContent = ` · ${(a.size / 1e6).toFixed(1)} MB`;
      el.append(s);
    }
  });

  const sums = asset("sums");
  if ($("#checksums")) $("#checksums").href = sums ? sums.browser_download_url : fallback;
  const deb = asset("deb");
  if (deb && $("#apt-cmd")) $("#apt-cmd").textContent = `sudo apt install ./${deb.name}`;

  const v = release ? release.tag_name.replace(/^v/, "") : "1.0.0";
  if ($("#hero-version")) {
    $("#hero-version").textContent = OS === "mobile" || OS === "android" ? t("hero.mobile") : v ? t("hero.version", { v }) : "";
  }
  if ($("#foot-version")) $("#foot-version").textContent = v ? `v${v}` : "";

  $$(".platform").forEach((card) => card.classList.toggle("mine", card.dataset.os === OS));
  const hero = $("#hero-download");
  if (hero) {
    if (OS in HERO_ASSET) {
      const a = asset(HERO_ASSET[OS]);
      hero.href = a ? a.browser_download_url : "#download";
      $("#hero-download-text").textContent = t("hero.download", { os: OS_NAME[OS] });
    } else {
      hero.href = "#download";
      $("#hero-download-text").textContent = t("nav.download");
    }
  }
}

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $$("[data-i18n]").forEach((el) => {
    if (!el.dataset.asset) el.textContent = t(el.dataset.i18n);
  });
  $$("#lang button").forEach((b) => b.classList.toggle("on", b.dataset.value === lang));
  document.title = `${t("brand.name")} — ${t("hero.title").replace(/\.$/, "")}`;
  renderDownloads();
}

function applyTheme() {
  const theme = store.get(`${STORAGE_PREFIX}-theme`) || "auto";
  if (theme === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

document.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  applyLang();

  $$("#lang button").forEach((b) => (b.onclick = () => {
    lang = b.dataset.value;
    store.set(`${STORAGE_PREFIX}-lang`, lang);
    applyLang();
  }));

  const themeBtn = $("#theme");
  if (themeBtn) {
    themeBtn.onclick = () => {
      const order = ["auto", "dark", "light"];
      const now = store.get(`${STORAGE_PREFIX}-theme`) || "auto";
      store.set(`${STORAGE_PREFIX}-theme`, order[(order.indexOf(now) + 1) % order.length]);
      applyTheme();
    };
  }

  $$(".copy-btn").forEach((b) => (b.onclick = async () => {
    const code = b.parentElement.querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(code);
      b.textContent = t("dl.copied");
      setTimeout(() => (b.textContent = t("dl.copy")), 1500);
    } catch {}
  }));

  release = await loadRelease();
  renderDownloads();
});
