let slides = document.querySelectorAll(".slide-livro")
let index = 0

function trocarSlide(){

slides[index].classList.remove("ativo")

index++

if(index >= slides.length){
index = 0
}

slides[index].classList.add("ativo")

}

setInterval(trocarSlide,3000)