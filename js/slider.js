let contador = 1;

setInterval(function(){
    contador++;

    if(contador > 5){
        contador = 1;
    }

    document.getElementById("s"+contador).checked = true;

}, 4000);