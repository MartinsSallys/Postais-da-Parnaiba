const sliderElement = document.querySelector(".slider");
const sliderInputs = document.querySelectorAll('.slider input[name="slide"]');
const sliderDots = document.querySelectorAll(".slider__dot");

if (sliderElement && sliderInputs.length > 0) {
    let contador = 0;
    let sliderIntervalId = null;

    function updateSliderState(index) {
        contador = index;
        sliderInputs[contador].checked = true;

        sliderDots.forEach((dot, dotIndex) => {
            const isCurrent = dotIndex === contador;
            dot.setAttribute("aria-current", isCurrent ? "true" : "false");
        });
    }

    function startSliderAutoplay() {
        if (sliderIntervalId !== null) {
            return;
        }

        sliderIntervalId = window.setInterval(() => {
            updateSliderState((contador + 1) % sliderInputs.length);
        }, 4000);
    }

    function stopSliderAutoplay() {
        if (sliderIntervalId !== null) {
            window.clearInterval(sliderIntervalId);
            sliderIntervalId = null;
        }
    }

    sliderDots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            updateSliderState(index);
        });

        dot.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                updateSliderState(index);
            }
        });
    });

    sliderElement.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
            event.preventDefault();
            updateSliderState((contador + 1) % sliderInputs.length);
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            updateSliderState((contador - 1 + sliderInputs.length) % sliderInputs.length);
        }

        if (event.key === "Home") {
            event.preventDefault();
            updateSliderState(0);
        }

        if (event.key === "End") {
            event.preventDefault();
            updateSliderState(sliderInputs.length - 1);
        }
    });

    sliderElement.addEventListener("mouseenter", stopSliderAutoplay);
    sliderElement.addEventListener("mouseleave", startSliderAutoplay);
    sliderElement.addEventListener("focusin", stopSliderAutoplay);
    sliderElement.addEventListener("focusout", (event) => {
        if (!sliderElement.contains(event.relatedTarget)) {
            startSliderAutoplay();
        }
    });

    updateSliderState(0);
    startSliderAutoplay();
}
