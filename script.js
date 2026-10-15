/* ===== Radka Těšíková – interaktivita ===== */
(function () {
  "use strict";

  /* --- Mobilní menu --- */
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  /* --- Tlačítko nahoru --- */
  const topBtn = document.querySelector(".scroll-top");
  if (topBtn) {
    const onScroll = () => topBtn.classList.toggle("show", window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    topBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* --- Animace při scrollu --- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("in"));
  }

  /* --- YouTube: náhled, video se načte až po kliknutí --- */
  document.querySelectorAll(".yt-facade").forEach(el => {
    const id = el.dataset.id;
    el.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
    el.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&controls=1`;
      f.title = el.getAttribute("aria-label") || "YouTube video";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.allowFullscreen = true;
      el.replaceWith(f);
    });
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
  });

  /* --- Karusel (nekonečný, s autoplay) --- */
  function Carousel(root) {
    const viewport = root.querySelector(".carousel-viewport");
    const track = root.querySelector(".carousel-track");
    const originals = [...track.children];
    const n = originals.length;
    const autoplay = root.dataset.autoplay ? parseInt(root.dataset.autoplay, 10) : 0;
    let perView = 1, index = 0, timer = null, busy = false;

    const getPerView = () => {
      const w = window.innerWidth;
      if (w < 768) return parseInt(root.dataset.mobile || 1, 10);
      if (w < 1025) return parseInt(root.dataset.tablet || 2, 10);
      return parseInt(root.dataset.desktop || 3, 10);
    };

    // klony pro nekonečnou smyčku
    const before = originals.map(s => { const c = s.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.classList.add("clone"); return c; });
    const after = originals.map(s => { const c = s.cloneNode(true); c.setAttribute("aria-hidden", "true"); c.classList.add("clone"); return c; });
    before.forEach(c => track.insertBefore(c, track.firstChild));
    after.forEach(c => track.appendChild(c));
    const all = () => [...track.children];

    function layout() {
      perView = getPerView();
      const w = viewport.clientWidth / perView;
      all().forEach(s => (s.style.width = w + "px"));
      go(index, false);
    }
    function go(i, animate = true) {
      index = i;
      const w = viewport.clientWidth / perView;
      track.style.transition = animate ? "transform .5s ease" : "none";
      track.style.transform = `translateX(${-(index + n) * w}px)`;
    }
    track.addEventListener("transitionend", () => {
      busy = false;
      if (index >= n) go(index - n, false);
      else if (index < 0) go(index + n, false);
    });
    const next = () => { if (busy) return; busy = true; go(index + 1); };
    const prev = () => { if (busy) return; busy = true; go(index - 1); };
    root.querySelector(".next")?.addEventListener("click", () => { next(); restart(); });
    root.querySelector(".prev")?.addEventListener("click", () => { prev(); restart(); });

    // swipe
    let x0 = null;
    viewport.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    viewport.addEventListener("touchend", e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
      x0 = null; start();
    });

    function start() { if (autoplay && !timer) timer = setInterval(next, autoplay); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }
    if (autoplay) {
      root.addEventListener("mouseenter", stop);
      root.addEventListener("mouseleave", start);
    }
    window.addEventListener("resize", layout);
    layout();
    start();
  }
  document.querySelectorAll(".carousel").forEach(c => Carousel(c));

  /* --- Lightbox pro fotogalerii --- */
  const lb = document.querySelector(".lightbox");
  if (lb) {
    const img = lb.querySelector("img");
    const count = lb.querySelector(".lb-count");
    const items = [...document.querySelectorAll(".gallery .carousel-slide:not(.clone) a")].map(a => ({ src: a.getAttribute("href"), alt: a.querySelector("img").alt }));
    let cur = 0;
    const show = i => {
      cur = (i + items.length) % items.length;
      img.src = items[cur].src; img.alt = items[cur].alt;
      count.textContent = `${cur + 1} / ${items.length}`;
    };
    document.querySelectorAll(".gallery .carousel-slide a").forEach(a => {
      a.addEventListener("click", e => {
        e.preventDefault();
        const i = items.findIndex(it => it.src === a.getAttribute("href"));
        show(i < 0 ? 0 : i);
        lb.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });
    const close = () => { lb.classList.remove("open"); document.body.style.overflow = ""; };
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", () => show(cur - 1));
    lb.querySelector(".lb-next").addEventListener("click", () => show(cur + 1));
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    document.addEventListener("keydown", e => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
  }

  /* --- Cookie lišta --- */
  const KEY = "rt_cookie_consent";
  const banner = document.querySelector(".cookie-banner");
  const manage = document.querySelector(".cookie-manage");
  if (banner) {
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
    const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
    const prefsBox = banner.querySelector(".cb-prefs");
    const btnPrefs = banner.querySelector(".cb-show-prefs");
    const btnSave = banner.querySelector(".cb-save");
    const openBanner = () => {
      const c = read();
      if (c) banner.querySelectorAll(".cb-prefs input[data-cat]").forEach(i => (i.checked = !!c[i.dataset.cat]));
      banner.classList.add("show"); manage.classList.remove("show");
    };
    const closeBanner = () => { banner.classList.remove("show"); manage.classList.add("show"); };
    const decide = obj => { save(Object.assign({ functional: true, date: new Date().toISOString() }, obj)); closeBanner(); };

    banner.querySelector(".cb-accept").addEventListener("click", () => decide({ preferences: true, statistics: true, marketing: true }));
    banner.querySelector(".cb-deny").addEventListener("click", () => decide({ preferences: false, statistics: false, marketing: false }));
    btnPrefs.addEventListener("click", () => {
      prefsBox.classList.add("open"); btnPrefs.hidden = true; btnSave.hidden = false;
    });
    btnSave.addEventListener("click", () => {
      const o = {}; banner.querySelectorAll(".cb-prefs input[data-cat]").forEach(i => (o[i.dataset.cat] = i.checked)); decide(o);
    });
    banner.querySelector(".cb-x").addEventListener("click", () => decide({ preferences: false, statistics: false, marketing: false }));
    manage.addEventListener("click", openBanner);
    read() ? manage.classList.add("show") : banner.classList.add("show");
  }

  /* --- Kontaktní formulář --- */
  const form = document.querySelector(".contact-form");
  if (form) {
    const msg = form.querySelector(".form-msg");
    const showErr = (field, text) => {
      field.classList.add("error");
      const m = document.createElement("div"); m.className = "err-msg"; m.textContent = text;
      (field.type === "checkbox" ? field.closest(".check") : field).after(m);
    };
    form.addEventListener("submit", async e => {
      e.preventDefault();
      form.querySelectorAll(".err-msg").forEach(m => m.remove());
      form.querySelectorAll(".error").forEach(f => f.classList.remove("error"));
      msg.className = "form-msg";
      let ok = true;
      const name = form.elements.name, email = form.elements.email, phone = form.elements.phone, text = form.elements.message, gdpr = form.elements.gdpr;
      if (!name.value.trim()) { showErr(name, "Vyplňte prosím jméno."); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { showErr(email, "Zadejte platný e-mail."); ok = false; }
      if (phone.value.trim() && !/^[+\d\s()-]{6,}$/.test(phone.value.trim())) { showErr(phone, "Telefonní číslo není ve správném formátu."); ok = false; }
      if (!text.value.trim()) { showErr(text, "Napište prosím zprávu."); ok = false; }
      if (!gdpr.checked) { showErr(gdpr, "Pro odeslání je potřeba souhlas se zpracováním údajů."); ok = false; }
      if (!ok) return;

      const endpoint = form.getAttribute("data-endpoint");
      if (endpoint) {
        // Odeslání na formulářovou službu (např. Formspree) nebo vlastní PHP skript
        try {
          const res = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error();
          form.reset();
          msg.textContent = "Děkuji za zprávu, brzy se vám ozvu.";
          msg.className = "form-msg ok";
        } catch (err) {
          msg.textContent = "Zprávu se nepodařilo odeslat. Zkuste to prosím znovu, nebo napište na kontakt@radkatesikova.cz.";
          msg.className = "form-msg bad";
        }
      } else {
        // Záloha bez serveru: otevře e-mailového klienta s předvyplněnou zprávou
        const body = `Jméno: ${name.value}\nE-mail: ${email.value}\nTelefon: ${phone.value}\n\n${text.value}`;
        window.location.href = `mailto:kontakt@radkatesikova.cz?subject=${encodeURIComponent("Poptávka z webu – " + name.value)}&body=${encodeURIComponent(body)}`;
        msg.textContent = "Otevírám váš e-mailový program s připravenou zprávou.";
        msg.className = "form-msg ok";
      }
    });
  }
})();
