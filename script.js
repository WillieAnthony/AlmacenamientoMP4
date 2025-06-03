import { db } from './firebase.js';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', function () {
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

    let movies = [];
    let selectedRow = null;
    let currentAction = null;
    let sortState = { id: 'asc', nombre: 'asc' };

    tipoInput.addEventListener('change', function () {
        temporadaInput.disabled = this.value !== 'Serie';
        temporadaInput.required = this.value === 'Serie';
        if (this.value !== 'Serie') temporadaInput.value = '';
    });

    cancelarBtn.addEventListener('click', limpiarCampos);
    agregarBtn.addEventListener('click', () => iniciarAccion('agregar'));
    actualizarBtn.addEventListener('click', () => iniciarAccion('actualizar'));
    eliminarBtn.addEventListener('click', () => iniciarAccion('eliminar'));
    buscarBtn.addEventListener('click', buscarPeliculas);
    confirmarBtn.addEventListener('click', confirmarAccion);

    window.addEventListener('click', (event) => {
        if (event.target === modal) modal.style.display = 'none';
    });

    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.getAttribute('data-sort');
            sortMovies(sortBy);
        });
    });

    function limpiarCampos() {
        form.reset();
        idInput.value = '';
        temporadaInput.disabled = true;
        selectedRow = null;
        document.querySelectorAll('#table-body tr').forEach(row => row.classList.remove('selected'));
    }

    function iniciarAccion(accion) {
        if (accion === 'agregar' && !validarCampos()) return;
        if ((accion === 'actualizar' || accion === 'eliminar') && !selectedRow) {
            alert('Seleccione una película/serie de la tabla');
            return;
        }
        if (accion === 'actualizar' && !validarCampos()) return;

        currentAction = accion;
        modal.style.display = 'block';
        codigoConfirmacionInput.value = '';
        errorMessage.textContent = '';
        codigoConfirmacionInput.focus();
    }

    async function confirmarAccion() {
        if (codigoConfirmacionInput.value === '20060123') {
            modal.style.display = 'none';
            if (currentAction === 'agregar') await agregarPelicula();
            if (currentAction === 'actualizar') await actualizarPelicula();
            if (currentAction === 'eliminar') await eliminarPelicula();
        } else {
            errorMessage.textContent = 'ERROR';
            codigoConfirmacionInput.value = '';
            codigoConfirmacionInput.focus();
        }
    }

    function validarCampos() {
        const nombre = nombreInput.value.trim();
        const tipo = tipoInput.value;
        const temporada = temporadaInput.value;
        const cantidad = cantidadInput.value;

        if (!nombre || !tipo || (!temporada && tipo === 'Serie') || !cantidad) {
            alert('Completa todos los campos requeridos');
            return false;
        }
        return true;
    }

    async function agregarPelicula() {
        const movie = {
            nombre: nombreInput.value.trim(),
            tipo: tipoInput.value,
            temporada: tipoInput.value === 'Serie' ? parseInt(temporadaInput.value) : 0,
            cantidad: parseInt(cantidadInput.value)
        };
        await addDoc(collection(db, 'peliculas'), movie);
        limpiarCampos();
    }

    async function actualizarPelicula() {
        const id = idInput.value;
        const ref = doc(db, 'peliculas', id);
        await updateDoc(ref, {
            nombre: nombreInput.value.trim(),
            tipo: tipoInput.value,
            temporada: tipoInput.value === 'Serie' ? parseInt(temporadaInput.value) : 0,
            cantidad: parseInt(cantidadInput.value)
        });
        limpiarCampos();
    }

    async function eliminarPelicula() {
        const id = idInput.value;
        await deleteDoc(doc(db, 'peliculas', id));
        limpiarCampos();
    }

    function buscarPeliculas() {
        const termino = buscadorInput.value.trim().toLowerCase();
        const resultados = movies.filter(m => m.nombre.toLowerCase().includes(termino));
        mostrarPeliculas(resultados);
    }

    function mostrarPeliculas(peliculas) {
        tableBody.innerHTML = '';
        peliculas.forEach(movie => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${movie.id}</td>
                <td>${movie.nombre}</td>
                <td>${movie.temporada}</td>
                <td>${movie.cantidad}</td>`;
            row.addEventListener('click', function () {
                document.querySelectorAll('#table-body tr').forEach(r => r.classList.remove('selected'));
                this.classList.add('selected');
                selectedRow = this;
                idInput.value = movie.id;
                nombreInput.value = movie.nombre;
                tipoInput.value = movie.tipo;
                temporadaInput.disabled = movie.tipo !== 'Serie';
                temporadaInput.value = movie.tipo === 'Serie' ? movie.temporada : '';
                cantidadInput.value = movie.cantidad;
            });
            tableBody.appendChild(row);
        });
    }

    function sortMovies(sortBy) {
        sortState[sortBy] = sortState[sortBy] === 'asc' ? 'desc' : 'asc';
        movies.sort((a, b) => {
            let aVal = sortBy === 'id' ? a.id : a[sortBy].toLowerCase();
            let bVal = sortBy === 'id' ? b.id : b[sortBy].toLowerCase();
            return (aVal < bVal ? -1 : 1) * (sortState[sortBy] === 'asc' ? 1 : -1);
        });
        mostrarPeliculas(movies);
        document.querySelectorAll('th[data-sort] span').forEach(span => span.textContent = '↓↑');
        document.querySelector(`th[data-sort="${sortBy}"] span`).textContent = sortState[sortBy] === 'asc' ? '↑' : '↓';
    }

    // 🔄 Escuchar cambios en vivo
    onSnapshot(collection(db, 'peliculas'), snapshot => {
        movies = [];
        snapshot.forEach(doc => {
            movies.push({ id: doc.id, ...doc.data() });
        });
        mostrarPeliculas(movies);
    });
});
