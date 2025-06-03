import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  const idInput = document.getElementById("id");
  const nombreInput = document.getElementById("nombre");
  const tipoInput = document.getElementById("tipo");
  const temporadaInput = document.getElementById("temporada");
  const cantidadInput = document.getElementById("cantidad");
  const cancelarBtn = document.getElementById("cancelar");
  const agregarBtn = document.getElementById("agregar");
  const actualizarBtn = document.getElementById("actualizar");
  const eliminarBtn = document.getElementById("eliminar");
  const buscadorInput = document.getElementById("buscador");
  const buscarBtn = document.getElementById("buscar");
  const tableBody = document.getElementById("table-body");
  const modal = document.getElementById("confirm-modal");
  const codigoConfirmacionInput = document.getElementById("codigo-confirmacion");
  const confirmarBtn = document.getElementById("confirmar");
  const errorMessage = document.getElementById("error-message");

  let selectedRow = null;
  let currentAction = null;
  let sortState = {
    id: "asc",
    nombre: "asc",
  };

  const coleccion = collection(db, "peliculas");

  tipoInput.addEventListener("change", function () {
    if (this.value === "Serie") {
      temporadaInput.disabled = false;
      temporadaInput.required = true;
    } else {
      temporadaInput.disabled = true;
      temporadaInput.required = false;
      temporadaInput.value = "";
    }
  });

  cancelarBtn.addEventListener("click", limpiarCampos);
  agregarBtn.addEventListener("click", () => iniciarAccion("agregar"));
  actualizarBtn.addEventListener("click", () => iniciarAccion("actualizar"));
  eliminarBtn.addEventListener("click", () => iniciarAccion("eliminar"));
  buscarBtn.addEventListener("click", buscarPeliculas);
  confirmarBtn.addEventListener("click", confirmarAccion);

  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  document.querySelectorAll("th[data-sort]").forEach((header) => {
    header.addEventListener("click", () => {
      const sortBy = header.getAttribute("data-sort");
      sortTable(sortBy);
    });
  });

  onSnapshot(query(coleccion, orderBy("id")), (snapshot) => {
    const datos = snapshot.docs.map((doc) => ({ idDoc: doc.id, ...doc.data() }));
    mostrarPeliculas(datos);
  });

  function limpiarCampos() {
    document.getElementById("movie-form").reset();
    idInput.value = "";
    temporadaInput.disabled = true;
    selectedRow = null;
    document.querySelectorAll("#table-body tr").forEach((row) => {
      row.classList.remove("selected");
    });
  }

  function iniciarAccion(accion) {
    if (accion === "agregar") {
      if (!validarCampos()) return;
    } else if ((accion === "actualizar" || accion === "eliminar") && !selectedRow) {
      alert("Seleccione una fila");
      return;
    }

    currentAction = accion;
    modal.style.display = "block";
    codigoConfirmacionInput.value = "";
    errorMessage.textContent = "";
    codigoConfirmacionInput.focus();
  }

  async function confirmarAccion() {
    if (codigoConfirmacionInput.value !== "20060123") {
      errorMessage.textContent = "ERROR";
      codigoConfirmacionInput.value = "";
      codigoConfirmacionInput.focus();
      return;
    }
    modal.style.display = "none";

    switch (currentAction) {
      case "agregar":
        await agregarPelicula();
        break;
      case "actualizar":
        await actualizarPelicula();
        break;
      case "eliminar":
        await eliminarPelicula();
        break;
    }
  }

  function validarCampos() {
    const nombre = nombreInput.value.trim();
    const tipo = tipoInput.value;
    const temporada = temporadaInput.value;
    const cantidad = cantidadInput.value;

    if (!nombre || !tipo || !cantidad) return false;
    if (tipo === "Serie" && !temporada) return false;
    return true;
  }

  async function agregarPelicula() {
    const nueva = {
      id: Date.now().toString(),
      nombre: nombreInput.value.trim(),
      tipo: tipoInput.value,
      temporada: tipoInput.value === "Serie" ? parseInt(temporadaInput.value) : 0,
      cantidad: parseInt(cantidadInput.value),
    };
    await addDoc(coleccion, nueva);
    limpiarCampos();
  }

  async function actualizarPelicula() {
    const fila = selectedRow;
    const idFirestore = fila.getAttribute("data-id");
    const ref = doc(db, "peliculas", idFirestore);

    const actualizada = {
      nombre: nombreInput.value.trim(),
      tipo: tipoInput.value,
      temporada: tipoInput.value === "Serie" ? parseInt(temporadaInput.value) : 0,
      cantidad: parseInt(cantidadInput.value),
    };
    await updateDoc(ref, actualizada);
    limpiarCampos();
  }

  async function eliminarPelicula() {
    const fila = selectedRow;
    const idFirestore = fila.getAttribute("data-id");
    const ref = doc(db, "peliculas", idFirestore);
    await deleteDoc(ref);
    limpiarCampos();
  }

  function buscarPeliculas() {
    const termino = buscadorInput.value.toLowerCase();
    const filas = document.querySelectorAll("#table-body tr");
    filas.forEach((fila) => {
      const nombre = fila.cells[1].textContent.toLowerCase();
      fila.style.display = nombre.includes(termino) ? "" : "none";
    });
  }

  function mostrarPeliculas(datos) {
    tableBody.innerHTML = "";
    datos.forEach((movie) => {
      const row = document.createElement("tr");
      row.setAttribute("data-id", movie.idDoc);
      row.innerHTML = `
        <td>${movie.id}</td>
        <td>${movie.nombre}</td>
        <td>${movie.temporada}</td>
        <td>${movie.cantidad}</td>`;

      row.addEventListener("click", () => {
        document.querySelectorAll("#table-body tr").forEach((r) => r.classList.remove("selected"));
        row.classList.add("selected");
        selectedRow = row;
        idInput.value = movie.id;
        nombreInput.value = movie.nombre;
        tipoInput.value = movie.tipo;
        cantidadInput.value = movie.cantidad;
        temporadaInput.disabled = movie.tipo !== "Serie";
        temporadaInput.value = movie.temporada;
      });

      tableBody.appendChild(row);
    });
  }

  function sortTable(sortBy) {
    const rows = Array.from(tableBody.rows);
    const direction = sortState[sortBy] === "asc" ? 1 : -1;
    sortState[sortBy] = sortState[sortBy] === "asc" ? "desc" : "asc";

    rows.sort((a, b) => {
      const valA = a.cells[sortBy === "id" ? 0 : 1].textContent.trim();
      const valB = b.cells[sortBy === "id" ? 0 : 1].textContent.trim();
      return direction * valA.localeCompare(valB, undefined, { numeric: true });
    });

    tableBody.innerHTML = "";
    rows.forEach((row) => tableBody.appendChild(row));
    document.querySelectorAll("th[data-sort] span").forEach((span) => (span.textContent = "↓↑"));
    document.querySelector(`th[data-sort="${sortBy}"] span`).textContent = sortState[sortBy] === "asc" ? "↑" : "↓";
  }
});
