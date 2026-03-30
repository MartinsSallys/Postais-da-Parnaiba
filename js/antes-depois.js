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

            function setWrapperRatio() {
                if (!imageWrapper) return;

                const afterReady = afterImg && afterImg.naturalWidth && afterImg.naturalHeight;
                const beforeReady = beforeImg && beforeImg.naturalWidth && beforeImg.naturalHeight;

                const ratio = afterReady
                    ? afterImg.naturalWidth / afterImg.naturalHeight
                    : beforeReady
                        ? beforeImg.naturalWidth / beforeImg.naturalHeight
                        : null;

                if (ratio) {
                    imageWrapper.style.setProperty("--media-ratio", ratio.toFixed(4));
                }
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

            // Define a proporção dando prioridade à imagem atual (after) para minimizar faixas vazias em mobile
            [beforeImg, afterImg].forEach((img) => {
                if (!img) return;
                if (img.complete) {
                    setWrapperRatio();
                } else {
                    img.addEventListener("load", setWrapperRatio, { once: true });
                }
            });
            // Chamado caso nenhuma imagem dispare evento (cache)
            setWrapperRatio();

            if (range) {
                updatePosition(range.value);
                range.addEventListener("input", (event) => {
                    updatePosition(event.target.value);
                });
            }
        });
    });
});
