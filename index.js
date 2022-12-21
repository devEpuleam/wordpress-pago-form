//URL sheets
// const baseURL = 'https://search-user-epuleam.vercel.app/api'
const baseURL = 'http://localhost:3000/api'

//obtener campos del formulario
const cedula = document.getElementById("cedula")
const nombre = document.getElementById("nombre")
const cursoSelect = document.getElementById("cursos")
const infoDiv = document.getElementById("infoDiv")
const infoDiv2 = document.getElementById("infoDiv2")
const metodoPago = document.getElementById("metodoPago")
const btnSearch = document.getElementById("buscar")
const form = document.getElementById("payForm")
//variable global para los datos del estudiante
let estudiante;

//inputs de relleno dependiendo del tipo de pago que desee realizar
const inputComprobante = `<div class="hide col-6">
<label for="metodoPago" class="form-label">Comprobante de depósito o transferecia </label>
<input accept="image/*" type="file" class="form-control" name="comprobante" id="comprobante" required>
<div class="invalid-feedback">Suba el comprobante del depósito o transferecia</div>
</div>`
const datalinkForm = `
<div class="hide col-6">
    <label for="monto" class="form-label">Monto a pagar</label>
    <input type="number" class="form-control" name="monto" id="monto" placeholder="Ej. 10" pattern="^\d$"
        required>
    <div class="invalid-feedback">Ingrese un valor númerico</div>
</div>
<div class="hide col-6">
<label for="metodoRecibirLink" class="form-label">Seleccione medio donde recibirá el enlace </label>
<select id="metodoRecibirLink" name="metodoRecibirLink" required class="form-select">
    <option value="" selected disabled hidden>Seleccionar</option>
    <option value="WhatsApp">WhatsApp (número telefonico)</option>
    <option value="Correo">Correo electrónico</option>
</select>
<div class="invalid-feedback">Seleccione un medio</div>
</div>`
const telefonoInput = `
<div class="hide col-6">
<label for="telefono" class="form-label">Teléfono</label>
<input class="form-control" type="text" name="telefono" id="telefono" placeholder="Ej. 0989583981"
  pattern="^09\d{8}$" required>
<div class="invalid-feedback">El número debe empezar con '09' y tener 10 dígitos.</div>
</div>`
const emailInput = `
<div class="hide col-6">
<label for="email" class="form-label">Correo</label>
<input class="form-control" type="email" name="email" id="email" placeholder="Ej. Alejandro@gmail.com"
  pattern="^[^@]+@[^@]+\.[a-zA-Z]{2,}$" required>
<div class="invalid-feedback">Formato del correo ingresado incorrecto</div>
</div>`

//rellenar el formulario de acuerdo al tipo de pago seleccionado
metodoPago.addEventListener('change',
    function () {
        let selectedOption = this.options[metodoPago.selectedIndex];
        if (selectedOption.value === "Transferencia") {
            infoDiv.innerHTML = inputComprobante
            infoDiv2.innerHTML = ""
        } else if (selectedOption.value === "Debito") {
            infoDiv.innerHTML = datalinkForm
            const metodoLinkSelect = document.getElementById("metodoRecibirLink")
            infoDiv2.innerHTML = ""
            metodoLinkSelect.addEventListener('change', () => {
                let selectedOption2 = metodoLinkSelect.options[metodoLinkSelect.selectedIndex];
                if (selectedOption2.value === "WhatsApp") {
                    infoDiv2.innerHTML = telefonoInput
                } else if (selectedOption2.value === "Correo") {
                    infoDiv2.innerHTML = emailInput
                }
            })
        } else if (selectedOption.value === "Credito") {
            infoDiv.innerHTML = datalinkForm
            const diferidoOrCorriente = ` <div  class="hide col-6">
            <label for="cuotas" class="form-label">Plazo a diferir</label>
            <select name="cuotas" required class="form-select">
                <option value="" selected disabled hidden>Seleccione</option>
                <option value="3 meses">3 meses</option>
                <option value="6 meses">6 meses</option>
                <option value="9 meses">9 meses</option>
            </select>
            <div class="invalid-feedback">Seleccione</div>`
            const metodoLinkSelect = document.getElementById("metodoRecibirLink")
            infoDiv2.innerHTML = ""
            metodoLinkSelect.addEventListener('change', () => {
                let selectedOption2 = metodoLinkSelect.options[metodoLinkSelect.selectedIndex];
                if (selectedOption2.value === "WhatsApp") {
                    infoDiv2.innerHTML = telefonoInput + diferidoOrCorriente
                } else if (selectedOption2.value === "Correo") {
                    infoDiv2.innerHTML = emailInput + diferidoOrCorriente
                }
            })
        }
    })
//ocultar o mostrar campos
$(document).ready(function () {
    $('.hide').hide()
    //inicar validaciones
    validateFields();
});

//funcion inicial para buscar el estudiante
btnSearch.addEventListener('click', () => {
    if (cedula.value.length == 10) {
        consultarEstudiante(cedula.value)
    }
    form.classList.add('was-validated')
})

//funcion principal para validar todos los campos del formulario y ejecutar la logica
function validateFields() {
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', async function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                } else {
                    event.preventDefault();
                    Swal.fire({
                        title: "Procesando los datos!",
                        text: "Espere mientras se procesa la carga de datos"
                    });
                    swal.showLoading();
                    try {
                        //generamos un form data con los datos llenados en el formulario
                        const data = Object.fromEntries(new FormData(form))
                        //verificamos que existe un correo y en caso de no existir lo rellenamos con el consultado en excel
                        if (!data.correo) {
                            data.correo = estudiante.EMAIL
                        }
                        //verificamos que existe un telefono y en caso de no existir lo rellenamos con el consultado en excel
                        if (!data.telefono) {
                            data.telefono = estudiante.TELEFONO
                        }
                        //verificamos que existe un comprobante
                        if (data.comprobante) {
                            //mutamos el formdata con el nombre del archivo
                            data.filename = data.comprobante.name
                            //subimos el archivo a cloudinary
                            const secure_img_url = await subirImg(data.comprobante)
                            //si se realizo con exito mutamos el formData con el url del comprobante
                            if (secure_img_url) {
                                data.comprobante = secure_img_url
                            }
                        }
                        // finalmente enviamos los datos por correo electronico
                        await sendData(data)
                        Swal.close();
                        Swal.fire({
                            position: 'top-end',
                            icon: 'success',
                            title: 'Enviado correctamente',
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            allowEnterKey: false,
                            timer: 2500
                        })
                        //redirigimos al inicio
                        return window.location.href = "https://ep-uleam.gob.ec/";
                    }
                    catch (error) {
                        Swal.close()
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: `Parece que ocurrió un problema, intentelo de nuevo más tarde`,
                        })
                    }
                }
                form.classList.add('was-validated')
            }, false)
        })
}

//funcion para subir el comprobante a cloudinary y obtener el enlace del mismo
async function subirImg(file) {
    const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/epuleam/image/upload'
    const formData = new FormData()
    formData.append('upload_preset', 'sum9ra5e')
    formData.append('file', file)
    try {
        const res = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: formData
        })
        if (!res.ok) return null
        const data = await res.json()
        return data.secure_url
    } catch (error) {
        return null
    }
}

//funcion llamada al servidor para enviar los correos
const sendData = async (data) => {
    // Haciendo la peticion de los datos
    const url = new URL(`${baseURL}/mailPayment`)
    Object.keys(data).forEach(key => url.searchParams.append(key, data[key]));
    return fetch(url)
        .then(r => r.json())
        .then(data => console.log(data))
        .catch(err => err)
}
//funcion para buscar el usuario en la hoja de excel
const searchSheetUser = async (cedula) => {
    // Haciendo la peticion de los datos
    return fetch(`${baseURL}/searchSheetUser?cedula=${cedula}`)
        .then(r => r.json())
        .then(data => data.data)
        .catch(err => err)
}

//funcion para limpiar las opciones
const limpiarSelect = () => {
    for (let i = cursoSelect.options.length; i >= 0; i--) {
        cursoSelect.remove(i);
    }
    cursoSelect.innerHTML = `<option value="" selected disabled hidden>Seleccione el curso a pagar</option>
    `
}

//funcion para buscar los datos del estudiante
const consultarEstudiante = async (cedula) => {
    // $('#cedula').on('change', async function () {
    Swal.fire({
        title: "Consultando estudiante!",
        text: "Espere mientras se procesa la carga de datos"
    });
    swal.showLoading();
    try {
        const res = await searchSheetUser(cedula)
        if (res.length != 0) {
            Swal.close();
            limpiarSelect()
            nombre.value = `${res[0].APELLIDOS} ${res[0].NOMBRES}`
            res.map((curso) => {
                let option = document.createElement("option");
                option.text = curso.CURSO;
                cursoSelect.add(option);
            })
            $('.hide').show()
            form.classList.remove('was-validated')
            estudiante = res[0]
        } else {
            Swal.close()
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: `La cedula ${cedula} no se encuentra registrado`,
            })
            nombre.value = `USUARIO NO EXISTE`
            $('.hide').hide()
            throw new Error(`${"error Estudiante con la cedula "}${cedula}${" no fue encontrado"}`);
        }
    } catch (error) {
        Swal.close()
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: `Parece que ocurrió un problema, intentelo de nuevo más tarde`,
        })
    }
    // })
}