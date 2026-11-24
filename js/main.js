/**
 * Postais da Parnaíba - Main JavaScript
 * Vanilla JS for modern interactions
 */

(function () {
    "use strict";

    // === Header scroll behavior ===
    const header = document.getElementById("site-header");
    if (header) {
        let lastScroll = 0;
        const onScroll = () => {
            const scrollY = window.scrollY;
            header.classList.toggle("is-scrolled", scrollY > 40);
            lastScroll = scrollY;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    // === Mobile nav toggle ===
    const toggle = document.querySelector(".site-header__toggle");
    const nav = document.getElementById("main-nav");
    if (toggle && nav) {
        toggle.addEventListener("click", () => {
            const isOpen = nav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));
        });

        document.addEventListener("click", (e) => {
            if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) {
                nav.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
            }
        });

        nav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                nav.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // === Reveal on scroll (IntersectionObserver) ===
    const revealElements = document.querySelectorAll("[data-reveal]");
    if (revealElements.length && "IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );
        revealElements.forEach((el) => revealObserver.observe(el));
    } else {
        revealElements.forEach((el) => el.classList.add("is-visible"));
    }

    // === Parallax hero background ===
    const heroBg = document.querySelector(".hero__bg-img");
    if (heroBg) {
        let ticking = false;
        window.addEventListener(
            "scroll",
            () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        const scrolled = window.scrollY;
                        if (scrolled < window.innerHeight * 1.5) {
                            heroBg.style.transform = `scale(1.05) translateY(${scrolled * 0.25}px)`;
                        }
                        ticking = false;
                    });
                    ticking = true;
                }
            },
            { passive: true }
        );
    }

    // === Smooth scroll for anchor links ===
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
            const targetId = anchor.getAttribute("href");
            if (!targetId || targetId === "#") return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    // === Stats counter animation ===
    const statsNumbers = document.querySelectorAll(".stats-bar__number[data-count]");
    if (statsNumbers.length && "IntersectionObserver" in window) {
        const counterObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const target = parseInt(el.dataset.count, 10);
                        const suffix = el.textContent.replace(/[\d]/g, "");
                        animateCounter(el, 0, target, 1200, suffix);
                        counterObserver.unobserve(el);
                    }
                });
            },
            { threshold: 0.5 }
        );
        statsNumbers.forEach((el) => counterObserver.observe(el));
    }

    function animateCounter(el, start, end, duration, suffix) {
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * eased);
            el.textContent = current + suffix;
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    // === Image lazy loading with fade-in ===
    if ("IntersectionObserver" in window) {
        const lazyImages = document.querySelectorAll("img[loading='lazy']");
        const imageObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.style.opacity = "0";
                        img.style.transition = "opacity 0.5s ease";
                        if (img.complete) {
                            img.style.opacity = "1";
                        } else {
                            img.addEventListener("load", () => {
                                img.style.opacity = "1";
                            }, { once: true });
                        }
                        imageObserver.unobserve(img);
                    }
                });
            },
            { rootMargin: "100px" }
        );
        lazyImages.forEach((img) => imageObserver.observe(img));
    }
})();
