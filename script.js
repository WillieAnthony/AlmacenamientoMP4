import { db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const form = document.getElementById('movie-form');
const idInput = document.getElementById('id');
const nombreInput = document.getElementById('nombre');
const tipoInput = document.getElementById('tipo');
const temporadaInput = document.getElementById('temporada');
const cantidadInput = document.getElementById('cantidad');
const cancelarBtn = document.getElementById('cancelar');
const agregarBtn = document.getElementById('agregar');
const actualizarBtn = document.getElementById('actualizar');
const eliminarBtn = document.getElementById('eliminar');
const buscadorInput = document.getElementById('buscador');
const buscarBtn = document.getElementById('buscar');
const tableBody = document.getElementById('table-body');
const modal = document.getElementById('confirm-modal');
const codigoConfirmacionInput = document.getElementById('codigo-confirmacion');
const confirmarBtn = document.getElementById('confirmar');
const errorMessage = document.getElementById('error-message');

let peliculasRef = collection(db, 'peliculas');
let selectedRow = null;
let currentAction = null;
let selectedDocId = null;
let allDocs = [];
let nextId = 1001;

tipoInput.addEventListener('change', () => {
  temporadaInput.disabled = tipoInput.value !== 'Serie';
  if (tipoInput.value !== 'Serie') temporadaInput.value = '';
});

cancelarBtn.addEventListener('click', limpiarCampos);
agregarBtn.addEventListener('click', () => iniciarAccion('agregar'));
actualizarBtn.addEventListener('click', () => iniciarAccion('actualizar'));
eliminarBtn.addEventListener('click', () => iniciarAccion('eliminar'));
buscarBtn.addEventListener('click', buscarPeliculas);
confirmarBtn.addEventListener('click', confirmarAccion);

document.querySelectorAll('th[data-sort]').forEach(header => {
  header.addEventListener('click', () => {
    const sortBy = header.getAttribute('data-sort');
    sortMovies(sortBy);
  });
});

window.addEventListener('click', (event) => {
  if (event.target === modal) modal.style.display = 'none';
});

async function cargarPeliculas() {
  const snapshot = await getDocs(peliculasRef);
  allDocs = snapshot.docs.map(doc => ({ ...doc.data(), __id: doc.id }));
  const maxId = allDocs.length > 0 ? Math.max(...allDocs.map(p => p.idNumerico || 1000)) : 1000;
  nextId = maxId + 1;
  mostrarPeliculas(allDocs);
}
cargarPeliculas();

function limpiarCampos() {
  form.reset();
  idInput.value = '';
  temporadaInput.disabled = true;
  selectedRow = null;
  selectedDocId = null;
  document.querySelectorAll('#table-body tr').forEach(row => row.classList.remove('selected'));
}

function iniciarAccion(accion) {
  if (accion === 'agregar' && !validarCampos()) return;
  if ((accion === 'actualizar' || accion === 'eliminar') && !selectedRow) {
    alert('Seleccione una fila de la tabla');
    return;
  }
  if (accion === 'actualizar' && !validarCampos()) return;
  currentAction = accion;
  modal.style.display = 'block';
  codigoConfirmacionInput.value = '';
  errorMessage.textContent = '';
  codigoConfirmacionInput.focus();
}

function confirmarAccion() {
  const codigo = codigoConfirmacionInput.value;
  if (codigo !== '20060123') {
    errorMessage.textContent = 'ERROR';
    codigoConfirmacionInput.value = '';
    codigoConfirmacionInput.focus();
    return;
  }

  modal.style.display = 'none';
  switch (currentAction) {
    case 'agregar': agregarPelicula(); break;
    case 'actualizar': actualizarPelicula(); break;
    case 'eliminar': eliminarPelicula(); break;
  }
}

function validarCampos() {
  const nombre = nombreInput.value.trim();
  const tipo = tipoInput.value;
  const temporada = temporadaInput.value;
  const cantidad = cantidadInput.value;

  if (!nombre || !tipo || !cantidad || (tipo === 'Serie' && !temporada)) {
    alert('Complete todos los campos requeridos');
    return false;
  }

  const duplicado = allDocs.some(p =>
    p.nombre.toLowerCase() === nombre.toLowerCase() &&
    p.tipo === tipo &&
    (tipo === 'Serie' ? p.temporada === parseInt(temporada) : true) &&
    (!selectedDocId || p.__id !== selectedDocId)
  );

  if (duplicado) {
    alert('Ya existe una película/serie con estos datos');
    return false;
  }

  return true;
}

async function agregarPelicula() {
  const nueva = {
    idNumerico: nextId,
    nombre: nombreInput.value.trim(),
    tipo: tipoInput.value,
    temporada: tipoInput.value === 'Serie' ? parseInt(temporadaInput.value) : 0,
    cantidad: parseInt(cantidadInput.value)
  };

  await addDoc(peliculasRef, nueva);
  limpiarCampos();
  cargarPeliculas();
}

async function actualizarPelicula() {
  if (!selectedDocId) return;

  await updateDoc(doc(db, 'peliculas', selectedDocId), {
    nombre: nombreInput.value.trim(),
    tipo: tipoInput.value,
    temporada: tipoInput.value === 'Serie' ? parseInt(temporadaInput.value) : 0,
    cantidad: parseInt(cantidadInput.value)
  });

  limpiarCampos();
  cargarPeliculas();
}

async function eliminarPelicula() {
  if (!selectedDocId) return;
  await deleteDoc(doc(db, 'peliculas', selectedDocId));
  limpiarCampos();
  cargarPeliculas();
}

function mostrarPeliculas(lista) {
  tableBody.innerHTML = '';
  lista.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.idNumerico}</td>
      <td>${p.nombre}</td>
      <td>${p.temporada}</td>
      <td>${p.cantidad}</td>
    `;

    row.addEventListener('click', () => {
      document.querySelectorAll('#table-body tr').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      selectedRow = row;
      selectedDocId = p.__id;

      idInput.value = p.idNumerico;
      nombreInput.value = p.nombre;
      tipoInput.value = p.tipo;
      cantidadInput.value = p.cantidad;

      if (p.tipo === 'Serie') {
        temporadaInput.disabled = false;
        temporadaInput.value = p.temporada;
      } else {
        temporadaInput.disabled = true;
        temporadaInput.value = '';
      }
    });

    tableBody.appendChild(row);
  });
}

function buscarPeliculas() {
  const t = buscadorInput.value.toLowerCase().trim();
  if (!t) return mostrarPeliculas(allDocs);
  const filtrados = allDocs.filter(p => p.nombre.toLowerCase().includes(t));
  mostrarPeliculas(filtrados);
}

function sortMovies(campo) {
  allDocs.sort((a, b) => {
    const valA = typeof a[campo] === 'string' ? a[campo].toLowerCase() : a[campo];
    const valB = typeof b[campo] === 'string' ? b[campo].toLowerCase() : b[campo];
    return valA < valB ? -1 : valA > valB ? 1 : 0;
  });
  mostrarPeliculas(allDocs);
}