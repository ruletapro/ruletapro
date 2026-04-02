const ruleta= document.getElementById("ruleta");

const uno = {
    nombre: "uno",
    probabilidad: 20

}
const dos = {
    nombre: "dos",
    probabilidad: 50
    
}

const tres = {
    nombre: "tres",
    probabilidad: 30
    
}

const cuatro = {
    nombre: "cuatro",
    probabilidad: 10
    
}

const conceptos =[uno,dos,tres,cuatro]



function ajustarRuleta(){
    const opcionesContainer = document.createElement("div");
    opcionesContainer.id = "opcionesContainer";
    ruleta.appendChild(opcionesContainer);  
    conceptos.forEach(concepto =>{ 

     const opcionElement = document.createElement("div");
     opcionElement.classList.add("opcion");
     opcionesContainer.appendChild(opcionElement);
})
}


ajustarRuleta(); 