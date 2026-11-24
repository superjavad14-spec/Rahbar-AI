// احراز هویت برنامک ایتا؛ اعتبارسنجی اصلی فقط در Cloudflare Worker انجام می‌شود.
document.documentElement.lang = "fa";
document.documentElement.dir = "rtl";

const VERIFY_URL = "https://rahbar-ai-api.superjavad14.workers.dev/api/verify";

function updateStatus(title, description, state) {
  const titleNode = document.getElementById("auth-title");
  const descriptionNode = document.getElementById("auth-description");
  const notice = document.querySelector(".notice");
  if (titleNode) titleNode.textContent = title;
  if (descriptionNode) descriptionNode.textContent = description;
  if (notice) {
    notice.dataset.state = state;
    const dot = notice.querySelector(".notice-dot");
    if (dot) {
      dot.style.background = state === "success" ? "#27835b" : state === "error" ? "#b84c45" : "#c18b36";
    }
  }
}

async function startEitaaAuthentication() {
  const webApp = window.Eitaa?.WebApp;

  if (!webApp) {
    updateStatus(
      "برای ورود، برنامک را از داخل ایتا باز کنید",
      "نسخه وب به‌تنهایی اطلاعات معتبر ورود ایتا را دریافت نمی‌کند.",
      "warning"
    );
    return;
  }

  try {
    webApp.ready();
    if (typeof webApp.expand === "function") webApp.expand();

    if (!webApp.initData) {
      updateStatus(
        "اطلاعات ورود دریافت نشد",
        "برنامک را از داخل ایتا دوباره باز کنید و مجدداً تلاش کنید.",
        "error"
      );
      return;
    }

    updateStatus("در حال بررسی هویت شما…", "در حال ارسال امن اطلاعات ورود به سرور.", "loading");

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: webApp.initData })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      updateStatus(
        "ورود تأیید نشد",
        result.error || "اعتبارسنجی انجام نشد. برنامک را دوباره باز کنید.",
        "error"
      );
      return;
    }

    const user = result.user || {};
    const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "کاربر ایتا";
    updateStatus(
      "ورود با موفقیت تأیید شد",
      "خوش آمدید " + displayName + "؛ محیط گفتگو پس از آماده‌شدن پایگاه اسناد فعال می‌شود.",
      "success"
    );
  } catch {
    updateStatus(
      "ارتباط با سرور برقرار نشد",
      "اتصال اینترنت یا وضعیت سرویس را بررسی کنید و دوباره برنامک را باز کنید.",
      "error"
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startEitaaAuthentication, { once: true });
} else {
  startEitaaAuthentication();
}
