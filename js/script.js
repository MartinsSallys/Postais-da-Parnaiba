const slidesLivro = document.querySelectorAll(".slide-livro");

if (slidesLivro.length > 1) {
    let index = 0;

    function trocarSlide() {
        slidesLivro[index].classList.remove("ativo");
        index = (index + 1) % slidesLivro.length;
        slidesLivro[index].classList.add("ativo");
    }

    setInterval(trocarSlide, 3000);
}
