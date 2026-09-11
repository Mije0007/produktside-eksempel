document.addEventListener("DOMContentLoaded", () => {
  const data = window.TheraTradeData || { products: [], team: [] };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const menuButton = document.querySelector(".menu-button");
  const mainMenu = document.querySelector(".main-menu");
  const menuButtonLabel = menuButton?.querySelector(".sr-only");
  const productDropdown = document.querySelector(".nav-dropdown");
  const productToggle = document.querySelector(".nav-dropdown-toggle");
  const productMenu = document.querySelector(".nav-dropdown-menu");

  const setMainMenu = open => {
    if (!menuButton || !mainMenu) return;
    mainMenu.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (menuButtonLabel) menuButtonLabel.textContent = open ? "Lukk meny" : "Åpne meny";
  };

  const setProductMenu = (open, returnFocus = false) => {
    if (!productDropdown || !productToggle || !productMenu) return;
    productDropdown.classList.toggle("open", open);
    productToggle.setAttribute("aria-expanded", String(open));
    productMenu.hidden = !open;
    if (returnFocus) productToggle.focus();
  };

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    setMainMenu(open);
    if (!open) setProductMenu(false);
  });

  if (productDropdown && productToggle && productMenu) {
    setProductMenu(false);

    productToggle.addEventListener("click", event => {
      event.stopPropagation();
      setProductMenu(productToggle.getAttribute("aria-expanded") !== "true");
    });

    productToggle.addEventListener("keydown", event => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      setProductMenu(true);
      const links = [...productMenu.querySelectorAll("a")];
      (event.key === "ArrowDown" ? links[0] : links.at(-1))?.focus();
    });

    productMenu.addEventListener("keydown", event => {
      const links = [...productMenu.querySelectorAll("a")];
      const currentIndex = links.indexOf(document.activeElement);
      if (currentIndex < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = currentIndex;
      if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % links.length;
      if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + links.length) % links.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = links.length - 1;
      links[nextIndex]?.focus();
    });

    productDropdown.addEventListener("focusout", event => {
      if (!event.relatedTarget || !productDropdown.contains(event.relatedTarget)) setProductMenu(false);
    });

    document.addEventListener("click", event => {
      if (!productDropdown.contains(event.target)) setProductMenu(false);
    });
  }

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (productToggle?.getAttribute("aria-expanded") === "true") {
      setProductMenu(false, true);
    } else if (menuButton?.getAttribute("aria-expanded") === "true") {
      setMainMenu(false);
      menuButton.focus();
    }
  });

  mainMenu?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 820) setMainMenu(false);
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820 && menuButton?.getAttribute("aria-expanded") === "true") {
      setMainMenu(false);
    }
  });

  const emptyStateMarkup = message => `<p class="empty-state">${escapeHtml(message)}</p>`;

  const productCardMarkup = (product, extraClass = "") => `
    <article class="product-card ${escapeHtml(extraClass)}">
      <img alt="${escapeHtml(product.alt)}" decoding="async" height="${Number(product.height) || 800}" loading="lazy" src="${escapeHtml(product.image)}" width="${Number(product.width) || 800}"/>
      <div>
        <p>${escapeHtml(product.category)}</p>
        <h3>${escapeHtml(product.name)}</h3>
        <span>${escapeHtml(product.description)}</span>
        ${product.detail ? `<dl><dt>Produktinformasjon</dt><dd>${escapeHtml(product.detail)}</dd></dl>` : ""}
        <a class="text-link" href="kontakt.html#kontakt-skjema">Spør oss om produktet <i></i></a>
      </div>
    </article>`;

  document.querySelectorAll("[data-product-grid]").forEach(grid => {
    const brand = grid.dataset.brand;
    const limit = Number.parseInt(grid.dataset.limit || "0", 10);
    let products = brand ? data.products.filter(product => product.brand === brand) : [...data.products];
    if (limit > 0) products = products.slice(0, limit);
    grid.innerHTML = products.length
      ? products.map(product => productCardMarkup(product)).join("")
      : emptyStateMarkup("Ingen produkter er tilgjengelige i denne visningen.");
  });

  const slider = document.querySelector("[data-product-slider]");
  if (slider) {
    const track = slider.querySelector("[data-slider-track]");
    const previousButton = slider.querySelector("[data-slider-prev]");
    const nextButton = slider.querySelector("[data-slider-next]");
    const products = data.products.filter(product => product.featured);

    if (track) {
      track.innerHTML = products.length
        ? products.map(product => productCardMarkup(product, "product-slide")).join("")
        : emptyStateMarkup("Det er ingen produktnyheter å vise akkurat nå.");

      const updateSliderButtons = () => {
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        if (previousButton) previousButton.disabled = track.scrollLeft <= 2;
        if (nextButton) nextButton.disabled = track.scrollLeft >= maxScroll - 2;
      };

      const moveSlider = direction => {
        const distance = Math.max(280, track.clientWidth * 0.82) * direction;
        track.scrollBy({ left: distance, behavior: reducedMotion.matches ? "auto" : "smooth" });
      };

      previousButton?.addEventListener("click", () => moveSlider(-1));
      nextButton?.addEventListener("click", () => moveSlider(1));
      track.addEventListener("scroll", updateSliderButtons, { passive: true });
      track.addEventListener("keydown", event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          moveSlider(event.key === "ArrowLeft" ? -1 : 1);
        }
      });

      if ("ResizeObserver" in window) new ResizeObserver(updateSliderButtons).observe(track);
      window.addEventListener("load", updateSliderButtons, { once: true });
      updateSliderButtons();
    }
  }

  const teamCardMarkup = member => {
    const contacts = [];
    if (member.email) contacts.push(`<a href="mailto:${escapeHtml(member.email)}">${escapeHtml(member.email)}</a>`);
    if (member.phone) contacts.push(`<a href="tel:${escapeHtml(member.phone.replace(/[^+\d]/g, ""))}">${escapeHtml(member.phone)}</a>`);
    const contactMarkup = contacts.length ? `<address class="team-contact">${contacts.join("")}</address>` : "";
    const imagePosition = member.imagePosition ? ` style="object-position:${escapeHtml(member.imagePosition)}"` : "";

    return `
      <article class="team-card">
        <img alt="${escapeHtml(member.alt)}" decoding="async" height="${Number(member.height) || 1000}" loading="lazy" src="${escapeHtml(member.image)}" width="${Number(member.width) || 800}"${imagePosition}/>
        <div>
          <p>${escapeHtml(member.role)}</p>
          <h3>${escapeHtml(member.name)}</h3>
          <span>${escapeHtml(member.description)}</span>
          ${contactMarkup}
        </div>
      </article>`;
  };

  document.querySelectorAll("[data-team-grid]").forEach(grid => {
    grid.innerHTML = data.team.length
      ? data.team.map(teamCardMarkup).join("")
      : emptyStateMarkup("Teamet er ikke tilgjengelig i denne visningen.");
  });

  const hero = document.querySelector(".hero");
  const heroVideo = document.querySelector(".hero-video");
  const heroSource = heroVideo?.querySelector("source[data-src]");

  const showFallback = () => {
    hero?.classList.remove("video-ready");
  };

  const stopHeroVideo = () => {
    if (!heroVideo || !heroSource) return;
    heroVideo.pause();
    heroSource.removeAttribute("src");
    heroVideo.load();
    showFallback();
  };

  const startHeroVideo = () => {
    if (!heroVideo || !heroSource || reducedMotion.matches) return;
    if (!heroSource.src) {
      heroSource.src = heroSource.dataset.src;
      heroVideo.load();
    }
    const playAttempt = heroVideo.play();
    if (playAttempt && typeof playAttempt.catch === "function") playAttempt.catch(showFallback);
  };

  if (hero && heroVideo && heroSource) {
    heroVideo.addEventListener("playing", () => hero.classList.add("video-ready"));
    heroVideo.addEventListener("error", showFallback);
    heroVideo.addEventListener("stalled", showFallback);
    startHeroVideo();
    reducedMotion.addEventListener?.("change", event => event.matches ? stopHeroVideo() : startHeroVideo());
  }

  const catalogButtons = document.querySelectorAll("[data-filter-group] button");
  const catalogItems = document.querySelectorAll("[data-filter-items] .catalog-card");

  catalogButtons.forEach(button => {
    button.addEventListener("click", () => {
      catalogButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      const filter = button.dataset.filter;
      catalogItems.forEach(item => {
        item.hidden = filter !== "Alle" && item.dataset.brand !== filter;
      });
    });
  });


  const productGallery = document.querySelector("[data-product-gallery]");
  if (productGallery) {
    const mainImage = productGallery.querySelector("#product-main-image");
    const mainMedia = productGallery.querySelector(".product-main-media");
    const thumbnails = [...productGallery.querySelectorAll(".product-thumbnail")];

    const selectThumbnail = (button, focus = false) => {
      if (!mainImage || !button) return;
      const src = button.dataset.image;
      const alt = button.dataset.alt || "Produktbilde";
      if (!src) return;

      thumbnails.forEach(item => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
        item.tabIndex = active ? 0 : -1;
      });

      mainMedia?.classList.add("is-changing");
      const swap = () => {
        mainImage.src = src;
        mainImage.alt = alt;
        mainMedia?.classList.remove("is-changing");
      };
      if (reducedMotion.matches) swap();
      else window.setTimeout(swap, 110);
      if (focus) button.focus();
    };

    thumbnails.forEach((button, index) => {
      button.tabIndex = button.classList.contains("is-active") ? 0 : -1;
      button.addEventListener("click", () => selectThumbnail(button));
      button.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + thumbnails.length) % thumbnails.length;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % thumbnails.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = thumbnails.length - 1;
        selectThumbnail(thumbnails[nextIndex], true);
        thumbnails[nextIndex]?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "nearest", inline: "nearest" });
      });
    });
  }

  document.querySelectorAll("[data-read-more]").forEach(block => {
    const content = block.querySelector("[data-read-more-content]");
    const toggle = block.querySelector("[data-read-more-toggle]");
    const label = toggle?.querySelector("span");
    if (!content || !toggle) return;

    const collapsedHeight = content.getBoundingClientRect().height;
    content.style.maxHeight = `${collapsedHeight}px`;

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      block.classList.toggle("is-expanded", !expanded);
      content.style.maxHeight = !expanded ? `${content.scrollHeight}px` : `${collapsedHeight}px`;
      if (label) label.textContent = !expanded ? "Vis mindre" : "Les mer";
    });
  });

  document.querySelectorAll("[data-accordion]").forEach(accordion => {
    const trigger = accordion.querySelector("[data-accordion-trigger]");
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      accordion.classList.toggle("is-open", !expanded);
    });
  });

  const form = document.querySelector(".contact-form");
  if (form) {
    const status = form.querySelector(".form-message");
    const fields = [...form.querySelectorAll("input, textarea")];

    const setStatus = (message, type = "") => {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle("is-error", type === "error");
      status.classList.toggle("is-success", type === "success");
    };

    fields.forEach(field => {
      field.addEventListener("input", () => {
        field.removeAttribute("aria-invalid");
        if (status?.classList.contains("is-error")) setStatus("");
      });
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      const firstInvalid = fields.find(field => {
        if (field.type === "checkbox") return field.required && !field.checked;
        if (field.required && !field.value.trim()) return true;
        return field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
      });

      fields.forEach(field => field.removeAttribute("aria-invalid"));

      if (firstInvalid) {
        firstInvalid.setAttribute("aria-invalid", "true");
        const message = firstInvalid.type === "email"
          ? "Skriv inn en gyldig e-postadresse."
          : firstInvalid.type === "checkbox"
            ? "Du må samtykke til at opplysningene brukes for å svare på henvendelsen."
            : "Fyll ut alle obligatoriske felt.";
        setStatus(message, "error");
        firstInvalid.focus();
        return;
      }

      const formData = new FormData(form);
      const product = formData.get("product");
      const subject = product
        ? `Forespørsel om ${product} fra ${formData.get("company")}`
        : `Forespørsel fra ${formData.get("company")}`;
      const body = [
        ...(product ? [`Produkt: ${product}`, ""] : []),
        `Navn: ${formData.get("name")}`,
        `Bedrift: ${formData.get("company")}`,
        `E-post: ${formData.get("email")}`,
        `Telefon: ${formData.get("phone") || "Ikke oppgitt"}`,
        "",
        "Melding:",
        formData.get("message")
      ].join("\n");
      const mailto = `mailto:info@theratrade.no?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus("E-postprogrammet ditt åpnes. Send meldingen derfra for å fullføre henvendelsen.", "success");
      window.location.href = mailto;
    });
  }
});
