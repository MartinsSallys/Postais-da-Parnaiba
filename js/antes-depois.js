document.addEventListener("DOMContentLoaded", () => {
    const components = document.querySelectorAll(".antes-depois");

    components.forEach((section) => {
        const toggle = section.querySelector(".antes-depois__toggle");
        const content = section.querySelector(".antes-depois__content");

        if (toggle && content) {
            toggle.addEventListener("click", () => {
                const isHidden = content.hasAttribute("hidden");
                if (isHidden) {
                    content.removeAttribute("hidden");
                    toggle.setAttribute("aria-expanded", "true");
                    toggle.textContent = "Fechar Antes e Depois";
                } else {
                    content.setAttribute("hidden", "");
                    toggle.setAttribute("aria-expanded", "false");
                    toggle.textContent = "Ver Antes e Depois";
                }
            });
        }

        section.querySelectorAll(".before-after").forEach((component) => {
            const range = component.querySelector(".before-after__range");
            const beforeImg = component.querySelector(".before-after__img--before");
            const afterImg = component.querySelector(".before-after__img--after");
            const divider = component.querySelector(".before-after__divider");
            const imageWrapper = component.querySelector(".before-after__images");

            function setAspectRatio(img) {
                if (!img || !imageWrapper || !img.naturalWidth || !img.naturalHeight) return;
                const ratio = (img.naturalWidth / img.naturalHeight).toFixed(4);
                imageWrapper.style.setProperty("--media-ratio", ratio);
            }

            function updatePosition(value) {
                component.style.setProperty("--position", `${value}%`);
                if (divider) {
                    divider.style.left = `${value}%`;
                }
                if (afterImg) {
                    afterImg.style.clipPath = `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`;
                }
            }

            // Define a proporção real da imagem base para evitar cortes em telas estreitas
            const ratioSource = beforeImg || afterImg;
            if (ratioSource) {
                if (ratioSource.complete) {
                    setAspectRatio(ratioSource);
                } else {
                    ratioSource.addEventListener("load", () => setAspectRatio(ratioSource), { once: true });
                }
            }

            if (range) {
                updatePosition(range.value);
                range.addEventListener("input", (event) => {
                    updatePosition(event.target.value);
                });
            }
        });
    });
});
