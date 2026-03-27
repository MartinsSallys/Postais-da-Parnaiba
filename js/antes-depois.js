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
            const afterImg = component.querySelector(".before-after__img--after");
            const divider = component.querySelector(".before-after__divider");

            function updatePosition(value) {
                component.style.setProperty("--position", `${value}%`);
                if (divider) {
                    divider.style.left = `${value}%`;
                }
                if (afterImg) {
                    afterImg.style.clipPath = `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`;
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
