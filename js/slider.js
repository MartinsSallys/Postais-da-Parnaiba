const sliderInputs = document.querySelectorAll('.slider input[name="slide"]');

if (sliderInputs.length > 0) {
    let contador = 0;

    setInterval(() => {
        contador = (contador + 1) % sliderInputs.length;
        sliderInputs[contador].checked = true;
    }, 4000);
}
