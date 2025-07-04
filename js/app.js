document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos del DOM
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('main section');
    const formCarga = document.getElementById('form-carga');
    const mensajeCarga = document.getElementById('mensaje-carga');
    const tablaHistorialBody = document.querySelector('#tabla-historial tbody');
    const resumenConsumoDiv = document.getElementById('resumen-consumo');
    const mejoresEstacionesDiv = document.getElementById('mejores-estaciones');
    const contenedorGraficos = document.getElementById('contenedor-graficos');

    // Instancias de Chart.js para los gráficos
    let chartConsumoMensual;
    let chartCostoPorKM;
    let chartGastoTotalPorCarga;

    let cargas = []; 


    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;

            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(sec => {
                sec.classList.remove('active');
                sec.classList.remove('fade-in');
            });

            button.classList.add('active');
            const targetSection = document.getElementById(targetId);
            targetSection.classList.add('active');
            targetSection.classList.add('fade-in');

            
            if (targetId === 'historial') {
                renderizarHistorial();
            } else if (targetId === 'inicio') {
                actualizarResumen();
                renderizarMejoresEstaciones();
            } else if (targetId === 'graficos') {
                renderizarGraficos(); // Cargar gráficos al entrar a la sección
            }
        });
    });

    // --- Carga de datos iniciales desde JSON ---
    async function cargarDatos() {
        try {
            const res = await fetch('js/cargas.json');
            if (!res.ok) {
                throw new Error(`Error HTTP! estado: ${res.status}`);
            }
            cargas = await res.json();
            
            cargas.forEach(carga => {
                carga.km = parseFloat(carga.km);
                carga.litros = parseFloat(carga.litros);
                carga.precioLitro = parseFloat(carga.precioLitro);
            });
            cargas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); 

            actualizarResumen();
            renderizarMejoresEstaciones();
        } catch (error) {
            mensajeCarga.textContent = 'Error al cargar datos iniciales.';
            mensajeCarga.style.color = 'red';
        }
    }

    // --- Gestión del Formulario de Carga ---
    formCarga.addEventListener('submit', (e) => {
        e.preventDefault();

        const nuevaCarga = {
            fecha: document.getElementById('fecha').value,
            km: parseFloat(document.getElementById('km').value),
            litros: parseFloat(document.getElementById('litros').value),
            precioLitro: parseFloat(document.getElementById('precioLitro').value),
            lugar: document.getElementById('lugar').value,
            tipoCombustible: document.getElementById('tipoCombustible').value,
        };

        
        if (cargas.length > 0) {
            const ultimoKm = cargas[cargas.length - 1].km;
            if (nuevaCarga.km <= ultimoKm) {
                mostrarMensaje('Los kilómetros deben ser mayores que la última carga registrada (' + ultimoKm + ' km).', 'red');
                return;
            }
        }

        cargas.push(nuevaCarga);
        cargas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)); // 

        formCarga.reset();
        mostrarMensaje('Carga guardada exitosamente.', 'green');
        actualizarResumen();
        renderizarMejoresEstaciones();
        
        if (document.getElementById('graficos').classList.contains('active')) {
            renderizarGraficos();
        }
    });

    
    function mostrarMensaje(mensaje, color) {
        mensajeCarga.textContent = mensaje;
        mensajeCarga.style.color = color;
        setTimeout(() => {
            mensajeCarga.textContent = '';
        }, 3000);
    }

    // --- Actualización del Resumen de Consumo ---
    function actualizarResumen() {
        if (cargas.length < 2) {
            document.getElementById('consumo-medio').textContent = 'N/A';
            document.getElementById('costo-km').textContent = 'N/A';
            document.getElementById('total-km').textContent = '0';
            document.getElementById('total-litros').textContent = '0.00';
            document.getElementById('total-costo').textContent = '0.00';
            return;
        }

        let totalKmRecorridos = 0;
        let totalLitrosConsumidos = 0;
        let totalCosto = 0;

        const primeraCarga = cargas[0];
        const ultimaCarga = cargas[cargas.length - 1];

        totalKmRecorridos = ultimaCarga.km - primeraCarga.km;

        for (let i = 1; i < cargas.length; i++) {
            totalLitrosConsumidos += cargas[i].litros;
            totalCosto += cargas[i].litros * cargas[i].precioLitro;
        }

        const consumoMedio = totalKmRecorridos > 0 ? (totalLitrosConsumidos / totalKmRecorridos) * 100 : 0;
        const costoPorKm = totalKmRecorridos > 0 ? totalCosto / totalKmRecorridos : 0;

        document.getElementById('consumo-medio').textContent = consumoMedio.toFixed(2);
        document.getElementById('costo-km').textContent = costoPorKm.toFixed(2);
        document.getElementById('total-km').textContent = totalKmRecorridos.toFixed(0);
        document.getElementById('total-litros').textContent = totalLitrosConsumidos.toFixed(2);
        document.getElementById('total-costo').textContent = totalCosto.toFixed(2);
    }

    // --- Renderizado del Historial de Cargas ---
    function renderizarHistorial() {
        tablaHistorialBody.innerHTML = ''; // Limpiar tabla
        cargas.forEach(carga => {
            const row = tablaHistorialBody.insertRow();
            row.insertCell().textContent = carga.fecha;
            row.insertCell().textContent = carga.km.toFixed(0);
            row.insertCell().textContent = carga.litros.toFixed(2);
            row.insertCell().textContent = carga.precioLitro.toFixed(2);
            row.insertCell().textContent = (carga.litros * carga.precioLitro).toFixed(2);
            row.insertCell().textContent = carga.lugar;
            row.insertCell().textContent = carga.tipoCombustible;
        });
    }

    // --- Mejores Estaciones (basado en último mes) ---
    function renderizarMejoresEstaciones() {
        mejoresEstacionesDiv.innerHTML = '';

        const unMesAtras = new Date();
        unMesAtras.setMonth(unMesAtras.getMonth() - 1);

        const cargasUltimoMes = cargas.filter(carga => new Date(carga.fecha) >= unMesAtras);

        const preciosPorEstacion = {};
        cargasUltimoMes.forEach(carga => {
            if (!preciosPorEstacion[carga.lugar]) {
                preciosPorEstacion[carga.lugar] = { totalPrecioLitro: 0, count: 0, ultimoPrecio: 0, fechaUltimaCarga: null, tipoCombustible: '' };
            }
            preciosPorEstacion[carga.lugar].totalPrecioLitro += carga.precioLitro;
            preciosPorEstacion[carga.lugar].count++;

            const currentCargaDate = new Date(carga.fecha);
            if (!preciosPorEstacion[carga.lugar].fechaUltimaCarga || currentCargaDate > preciosPorEstacion[carga.lugar].fechaUltimaCarga) {
                preciosPorEstacion[carga.lugar].fechaUltimaCarga = currentCargaDate;
                preciosPorEstacion[carga.lugar].ultimoPrecio = carga.precioLitro;
                preciosPorEstacion[carga.lugar].tipoCombustible = carga.tipoCombustible;
            }
        });

        const estacionesOrdenadas = Object.keys(preciosPorEstacion)
            .map(lugar => ({
                lugar: lugar,
                precioMedio: preciosPorEstacion[lugar].totalPrecioLit / preciosPorEstacion[lugar].count,
                ultimoPrecio: preciosPorEstacion[lugar].ultimoPrecio,
                fechaUltimaCarga: preciosPorEstacion[lugar].fechaUltimaCarga,
                tipoCombustible: preciosPorEstacion[lugar].tipoCombustible
            }))
            .sort((a, b) => a.precioMedio - b.precioMedio)
            .slice(0, 3); // Las 3 mejores

        if (estacionesOrdenadas.length === 0) {
            mejoresEstacionesDiv.innerHTML = '<p style="text-align: center; color: #888;">No hay cargas en el último mes para mostrar las estaciones más económicas.</p>';
        } else {
            estacionesOrdenadas.forEach(estacion => {
                const card = document.createElement('div');
                card.classList.add('card-modern');
                card.innerHTML = `
                    <h4 class="card-title">${estacion.lugar}</h4>
                    <div class="card-text">
                        <p>Fecha: ${estacion.fechaUltimaCarga ? estacion.fechaUltimaCarga.toLocaleDateString('es-ES') : 'N/A'}</p>
                        <p>Precio por litro: $${estacion.ultimoPrecio.toFixed(2)}</p>
                        <p>Tipo: ${estacion.tipoCombustible}</p>
                    </div>
                `;
                mejoresEstacionesDiv.appendChild(card);
            });
        }
    }

    // --- Renderizado de Gráficos ---
    function renderizarGraficos(filtroMesAnio = 'todos') {
        contenedorGraficos.innerHTML = '';

        if (cargas.length < 2) {
            contenedorGraficos.innerHTML = '<p style="text-align: center; color: #888;">Necesitas al menos dos cargas para generar gráficos.</p>';
            return;
        }

        // Crear opciones de filtro de Mes/Año
        const monthYears = [...new Set(cargas.map(c => {
            const date = new Date(c.fecha);
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        }))].sort((a, b) => {
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            if (yearA !== yearB) return yearB - yearA;
            return monthB - monthA;
        });

        const filterContainer = document.createElement('div');
        filterContainer.classList.add('grafico-filtros');

        const selectMonthYear = document.createElement('select');
        selectMonthYear.id = 'filterMonthYear';
        selectMonthYear.innerHTML = '<option value="todos">Todos los Meses / Años</option>';
        monthYears.forEach(my => {
            const [year, month] = my.split('-');
            const date = new Date(year, parseInt(month) - 1);
            const option = document.createElement('option');
            option.value = my;
            option.textContent = `${date.toLocaleString('es-ES', { month: 'long' })} ${year}`;
            selectMonthYear.appendChild(option);
        });
        selectMonthYear.value = filtroMesAnio;
        selectMonthYear.addEventListener('change', () => {
            renderizarGraficos(selectMonthYear.value);
        });
        filterContainer.appendChild(selectMonthYear);
        contenedorGraficos.appendChild(filterContainer);

        // Filtrar datos según la selección
        const filteredCargas = cargas.filter(carga => {
            const cargaDate = new Date(carga.fecha);
            const cargaMonthYear = `${cargaDate.getFullYear()}-${(cargaDate.getMonth() + 1).toString().padStart(2, '0')}`;
            return (filtroMesAnio === 'todos' || cargaMonthYear === filtroMesAnio);
        });

        if (filteredCargas.length < 2 && filtroMesAnio !== 'todos') {
            const noDataMessage = document.createElement('p');
            noDataMessage.style.textAlign = 'center';
            noDataMessage.style.color = '#888';
            noDataMessage.textContent = `No hay suficientes datos (mínimo 2 cargas) para el periodo seleccionado (${selectMonthYear.options[selectMonthYear.selectedIndex].text}).`;
            contenedorGraficos.appendChild(noDataMessage);
            return;
        }


        // --- Gráfico 1: Consumo Mensual (L/100km) ---
        const divConsumo = document.createElement('div');
        divConsumo.classList.add('grafico-con-filtro');
        divConsumo.innerHTML = '<h3>Consumo Mensual (L/100km)</h3>';
        const canvasConsumo = document.createElement('canvas');
        canvasConsumo.id = 'consumoMensualChart';
        divConsumo.appendChild(canvasConsumo);
        contenedorGraficos.appendChild(divConsumo);

        const consumoMensualData = calcularConsumoMensual(filteredCargas);
        const consumoMensualLabels = Object.keys(consumoMensualData);
        const consumoMensualValues = Object.values(consumoMensualData);

        if (chartConsumoMensual) { chartConsumoMensual.destroy(); }
        chartConsumoMensual = new Chart(canvasConsumo, {
            type: 'line',
            data: {
                labels: consumoMensualLabels,
                datasets: [{
                    label: 'L/100km',
                    data: consumoMensualValues,
                    borderColor: '#00ffff',
                    backgroundColor: 'rgba(0, 255, 255, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: '#2a2e35' }, ticks: { color: '#ccc' } },
                    y: { beginAtZero: true, grid: { color: '#2a2e35' }, ticks: { color: '#ccc' } }
                },
                plugins: {
                    legend: { labels: { color: '#eee' } },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: '#00ffff', bodyColor: '#fff' }
                }
            }
        });

        // --- Gráfico 2: Costo por KM ($/km) ---
        const divCosto = document.createElement('div');
        divCosto.classList.add('grafico-con-filtro');
        divCosto.innerHTML = '<h3>Costo por Kilómetro ($/km)</h3>';
        const canvasCostoKM = document.createElement('canvas');
        canvasCostoKM.id = 'costoPorKMChart';
        divCosto.appendChild(canvasCostoKM);
        contenedorGraficos.appendChild(divCosto);

        const costoPorKMData = calcularCostoPorKM(filteredCargas);
        const costoPorKMLabels = Object.keys(costoPorKMData);
        const costoPorKMValues = Object.values(costoPorKMData);

        if (chartCostoPorKM) { chartCostoPorKM.destroy(); }
        chartCostoPorKM = new Chart(canvasCostoKM, {
            type: 'bar',
            data: {
                labels: costoPorKMLabels,
                datasets: [{
                    label: '$/km',
                    data: costoPorKMValues,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: '#2a2e35' }, ticks: { color: '#ccc' } },
                    y: { beginAtZero: true, grid: { color: '#2a2e35' }, ticks: { color: '#ccc' } }
                },
                plugins: {
                    legend: { labels: { color: '#eee' } },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: '#00ffff', bodyColor: '#fff' }
                }
            }
        });

        // --- Gráfico 3: Gasto Total por Carga ($) ---
        const divGastoTotal = document.createElement('div');
        divGastoTotal.classList.add('grafico-con-filtro');
        divGastoTotal.innerHTML = '<h3>Gasto Total por Carga ($)</h3>';
        const canvasGastoTotal = document.createElement('canvas');
        canvasGastoTotal.id = 'gastoTotalPorCargaChart';
        divGastoTotal.appendChild(canvasGastoTotal);
        contenedorGraficos.appendChild(divGastoTotal);

        const gastoTotalPorCargaData = calcularGastoTotalPorCarga(filteredCargas);
        const gastoTotalPorCargaLabels = Object.keys(gastoTotalPorCargaData);
        const gastoTotalPorCargaValues = Object.values(gastoTotalPorCargaData);

        if (chartGastoTotalPorCarga) { chartGastoTotalPorCarga.destroy(); }
        chartGastoTotalPorCarga = new Chart(canvasGastoTotal, {
            type: 'bar',
            data: {
                labels: gastoTotalPorCargaLabels,
                datasets: [{
                    label: '$',
                    data: gastoTotalPorCargaValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { grid: { color: '#2a2e35' }, ticks: { color: '#ccc' } },
                    y: { beginAtZero: true, grid: { color: '#2a2e35' }, ticks: { color: '#ccc' } }
                },
                plugins: {
                    legend: { labels: { color: '#eee' } },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: '#00ffff', bodyColor: '#fff' }
                }
            }
        });
    }

    // --- Funciones de cálculo para los gráficos ---
    function calcularConsumoMensual(data) {
        const consumoPorMes = {};
        if (data.length < 2) return {};

        for (let i = 1; i < data.length; i++) {
            const prevCarga = data[i - 1];
            const currCarga = data[i];

            const fecha = new Date(currCarga.fecha);
            const mesAño = `${fecha.toLocaleString('es-ES', { month: 'short' })} ${fecha.getFullYear()}`;

            const kmRecorridos = currCarga.km - prevCarga.km;
            const litrosConsumidos = currCarga.litros;

            if (kmRecorridos > 0) {
                const consumo = (litrosConsumidos / kmRecorridos) * 100;
                if (!consumoPorMes[mesAño]) {
                    consumoPorMes[mesAño] = { totalConsumo: 0, count: 0 };
                }
                consumoPorMes[mesAño].totalConsumo += consumo;
                consumoPorMes[mesAño].count++;
            }
        }

        const resultado = {};
        for (const mesAño in consumoPorMes) {
            resultado[mesAño] = consumoPorMes[mesAño].totalConsumo / consumoPorMes[mesAño].count;
        }
        return resultado;
    }

    function calcularCostoPorKM(data) {
        const costoPorMes = {};
        if (data.length < 2) return {};

        for (let i = 1; i < data.length; i++) {
            const prevCarga = data[i - 1];
            const currCarga = data[i];

            const fecha = new Date(currCarga.fecha);
            const mesAño = `${fecha.toLocaleString('es-ES', { month: 'short' })} ${fecha.getFullYear()}`;

            const kmRecorridos = currCarga.km - prevCarga.km;
            const costoCarga = currCarga.litros * currCarga.precioLitro;

            if (kmRecorridos > 0) {
                const costoKm = costoCarga / kmRecorridos;
                if (!costoPorMes[mesAño]) {
                    costoPorMes[mesAño] = { totalCosto: 0, count: 0 };
                }
                costoPorMes[mesAño].totalCosto += costoKm;
                costoPorMes[mesAño].count++;
            }
        }

        const resultado = {};
        for (const mesAño in costoPorMes) {
            resultado[mesAño] = costoPorMes[mesAño].totalCosto / costoPorMes[mesAño].count;
        }
        return resultado;
    }

    function calcularGastoTotalPorCarga(data) {
        const gastoPorCarga = {};
        data.forEach(carga => {
            const fecha = new Date(carga.fecha);
            const cargaId = `${fecha.toISOString().split('T')[0]} - ${carga.km}km`;
            gastoPorCarga[cargaId] = (carga.litros * carga.precioLitro);
        });
        return gastoPorCarga;
    }

    // --- Inicialización de la aplicación ---
    cargarDatos();
    actualizarResumen();
});