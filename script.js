document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
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
    
    // Variables de estado
    let movies = JSON.parse(localStorage.getItem('movies')) || [];
    let nextId = 1001;
    let selectedRow = null;
    let currentAction = null;
    let sortState = {
        id: 'asc',
        nombre: 'asc'
    };
    
    // Inicializar la aplicación
    init();
    
    // Event listeners
    tipoInput.addEventListener('change', function() {
        if (this.value === 'Serie') {
            temporadaInput.disabled = false;
            temporadaInput.required = true;
        } else {
            temporadaInput.disabled = true;
            temporadaInput.required = false;
            temporadaInput.value = '';
        }
    });
    
    cancelarBtn.addEventListener('click', limpiarCampos);
    agregarBtn.addEventListener('click', () => iniciarAccion('agregar'));
    actualizarBtn.addEventListener('click', () => iniciarAccion('actualizar'));
    eliminarBtn.addEventListener('click', () => iniciarAccion('eliminar'));
    buscarBtn.addEventListener('click', buscarPeliculas);
    
    // Ordenar tabla al hacer clic en los encabezados
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const sortBy = header.getAttribute('data-sort');
            sortMovies(sortBy);
        });
    });
    
    // Confirmar acción después de ingresar código
    confirmarBtn.addEventListener('click', confirmarAccion);
    
    // Cerrar modal al hacer clic fuera de él
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Funciones
    function init() {
        // Calcular el próximo ID
        if (movies.length > 0) {
            const maxId = Math.max(...movies.map(movie => parseInt(movie.id)));
            nextId = maxId + 1;
        }
        
        // Generar ID inicial si no hay películas
        if (movies.length === 0) {
            nextId = 1001;
        }
        
        // Mostrar películas en la tabla
        mostrarPeliculas(movies);
    }
    
    function limpiarCampos() {
        form.reset();
        idInput.value = '';
        temporadaInput.disabled = true;
        selectedRow = null;
        
        // Quitar el resaltado de la fila seleccionada
        document.querySelectorAll('#table-body tr').forEach(row => {
            row.classList.remove('selected');
        });
    }
    
    function iniciarAccion(accion) {
        // Validar campos según la acción
        if (accion === 'agregar') {
            if (!validarCampos()) return;
        } else if (accion === 'actualizar' || accion === 'eliminar') {
            if (!selectedRow) {
                alert('Por favor seleccione una película/serie de la tabla');
                return;
            }
            
            if (accion === 'actualizar' && !validarCampos()) return;
        }
        
        // Mostrar modal de confirmación
        currentAction = accion;
        modal.style.display = 'block';
        codigoConfirmacionInput.value = '';
        errorMessage.textContent = '';
        codigoConfirmacionInput.focus();
    }
    
    function confirmarAccion() {
        const codigo = codigoConfirmacionInput.value;
        
        if (codigo === '20060125') {
            modal.style.display = 'none';
            
            switch (currentAction) {
                case 'agregar':
                    agregarPelicula();
                    break;
                case 'actualizar':
                    actualizarPelicula();
                    break;
                case 'eliminar':
                    eliminarPelicula();
                    break;
            }
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
        
        if (!nombre) {
            alert('Por favor ingrese el nombre');
            return false;
        }
        
        if (!tipo) {
            alert('Por favor seleccione Película o Serie');
            return false;
        }
        
        if (tipo === 'Serie' && !temporada) {
            alert('Por favor ingrese la temporada para series');
            return false;
        }
        
        if (!cantidad) {
            alert('Por favor ingrese la cantidad');
            return false;
        }
        
        // Validar que no exista la misma serie con la misma temporada
        if (tipo === 'Serie') {
            const existe = movies.some(movie => 
                movie.nombre.toLowerCase() === nombre.toLowerCase() && 
                movie.tipo === 'Serie' && 
                movie.temporada === parseInt(temporada) &&
                (!selectedRow || movie.id !== idInput.value) // Excluir el actual si estamos actualizando
            );
            
            if (existe) {
                alert('Esta serie con esta temporada ya existe en la colección');
                return false;
            }
        }
        
        return true;
    }
    
    function agregarPelicula() {
        const movie = {
            id: nextId.toString().padStart(7, '0'),
            nombre: nombreInput.value.trim(),
            tipo: tipoInput.value,
            temporada: tipoInput.value === 'Serie' ? parseInt(temporadaInput.value) : 0,
            cantidad: parseInt(cantidadInput.value)
        };
        
        movies.push(movie);
        guardarDatos();
        nextId++;
        limpiarCampos();
        mostrarPeliculas(movies);
    }
    
    function actualizarPelicula() {
        const id = idInput.value;
        const index = movies.findIndex(movie => movie.id === id);
        
        if (index !== -1) {
            movies[index] = {
                id: id,
                nombre: nombreInput.value.trim(),
                tipo: tipoInput.value,
                temporada: tipoInput.value === 'Serie' ? parseInt(temporadaInput.value) : 0,
                cantidad: parseInt(cantidadInput.value)
            };
            
            guardarDatos();
            limpiarCampos();
            mostrarPeliculas(movies);
        }
    }
    
    function eliminarPelicula() {
        const id = idInput.value;
        movies = movies.filter(movie => movie.id !== id);
        guardarDatos();
        limpiarCampos();
        mostrarPeliculas(movies);
        
        // Recalcular nextId si eliminamos el último
        if (parseInt(id) === nextId - 1) {
            nextId = movies.length > 0 ? 
                Math.max(...movies.map(movie => parseInt(movie.id))) + 1 : 
                1001;
        }
    }
    
    function buscarPeliculas() {
        const termino = buscadorInput.value.trim().toLowerCase();
        
        if (!termino) {
            mostrarPeliculas(movies);
            return;
        }
        
        const resultados = movies.filter(movie => 
            movie.nombre.toLowerCase().includes(termino)
        );
        
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
                <td>${movie.cantidad}</td>
            `;
            
            // Seleccionar fila al hacer clic
            row.addEventListener('click', function() {
                document.querySelectorAll('#table-body tr').forEach(r => {
                    r.classList.remove('selected');
                });
                
                this.classList.add('selected');
                selectedRow = this;
                
                // Llenar formulario con los datos de la fila seleccionada
                const movieData = movies.find(m => m.id === this.cells[0].textContent);
                
                if (movieData) {
                    idInput.value = movieData.id;
                    nombreInput.value = movieData.nombre;
                    tipoInput.value = movieData.tipo;
                    
                    if (movieData.tipo === 'Serie') {
                        temporadaInput.disabled = false;
                        temporadaInput.value = movieData.temporada;
                    } else {
                        temporadaInput.disabled = true;
                        temporadaInput.value = '';
                    }
                    
                    cantidadInput.value = movieData.cantidad;
                }
            });
            
            tableBody.appendChild(row);
        });
    }
    
    function sortMovies(sortBy) {
        // Cambiar el estado de ordenación
        sortState[sortBy] = sortState[sortBy] === 'asc' ? 'desc' : 'asc';
        
        // Ordenar las películas
        movies.sort((a, b) => {
            let valueA, valueB;
            
            if (sortBy === 'id') {
                valueA = parseInt(a.id);
                valueB = parseInt(b.id);
            } else {
                valueA = a[sortBy].toLowerCase();
                valueB = b[sortBy].toLowerCase();
            }
            
            if (valueA < valueB) {
                return sortState[sortBy] === 'asc' ? -1 : 1;
            }
            if (valueA > valueB) {
                return sortState[sortBy] === 'asc' ? 1 : -1;
            }
            return 0;
        });
        
        // Actualizar la tabla
        mostrarPeliculas(movies);
        
        // Actualizar iconos de ordenación
        document.querySelectorAll('th[data-sort] span').forEach(span => {
            span.textContent = '↓↑';
        });
        
        const currentSortIcon = document.querySelector(`th[data-sort="${sortBy}"] span`);
        currentSortIcon.textContent = sortState[sortBy] === 'asc' ? '↑' : '↓';
    }
    
    function guardarDatos() {
        localStorage.setItem('movies', JSON.stringify(movies));
    }
});