function mostrarGraficos() {
const contenedor = document.getElementById('contenedor-graficos'); // 
contenedor.innerHTML = '';

// Obtener años únicos y meses-años únicos
const aniosUnicos = [...new Set(cargas.map(c => c.fecha.split('/')[2]))];
const mesesAnioUnicos = [...new Set(cargas.map(c => {
const [d, m, a] = c.fecha.split('/');
return `${a}-${m.padStart(2, '0')}`; // ej: 2025-04
}))];

// Combinar en un solo array de opciones de filtro
const opcionesFiltro = [
{ valor: 'todos', label: 'Todos los datos' }, // Opción para ver todos los datos
...aniosUnicos.map(a => ({ valor: a, label: `Año ${a}` })),
...mesesAnioUnicos.map(m => ({ valor: m, label: formatearMes(m) }))
].sort((a,b) => { // Ordenar opciones de filtro (años y meses)
    if (a.valor === 'todos') return -1; // 'Todos los datos' primero
    if (b.valor === 'todos') return 1;
    return a.valor.localeCompare(b.valor);
  });


// Crear  gráfico 
crearGraficoConFiltro('Consumo (L/100 km)', calcularConsumo, 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 0.2)', 'line');
crearGraficoConFiltro('Costo por carga ($)', c => c.costo, 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.2)', 'bar');
crearGraficoConFiltro('Precio por litro ($)', c => c.precioLitro, 'rgba(255, 206, 86, 1)', 'rgba(255, 206, 86, 0.3)', 'line');

function crearGraficoConFiltro(label, calcularDato, borderColor, backgroundColor, tipoGrafico) {
const div = document.createElement('div');
div.className = 'grafico-con-filtro fade-in'; 

const select = document.createElement('select');
select.innerHTML = opcionesFiltro.map(opt => `<option value="${opt.valor}">${opt.label}</option>`).join('');
div.appendChild(select);

    const tituloGrafico = document.createElement('h3');
    tituloGrafico.textContent = label;
    div.prepend(tituloGrafico); 


const canvas = document.createElement('canvas');
div.appendChild(canvas);

contenedor.appendChild(div);

let chart;

function actualizarGrafico() {
const valorFiltro = select.value;
const datosFiltrados = cargas.filter(c => {
const [d, m, a] = c.fecha.split('/');
const mes = m.padStart(2, '0');
const anioMes = `${a}-${mes}`;
        if (valorFiltro === 'todos') return true; 
return valorFiltro.length === 4
? a === valorFiltro 
: anioMes === valorFiltro; 
});


    datosFiltrados.sort((a, b) => {
        const [dA, mA, yA] = a.fecha.split('/');
        const [dB, mB, yB] = b.fecha.split('/');
        return new Date(`${yA}-${mA}-${dA}`) - new Date(`${yB}-${mB}-${dB}`);
    });

const etiquetas = datosFiltrados.map(c => c.fecha);
const datos = datosFiltrados.map((c, i) => calcularDato(c, i, datosFiltrados));

if (chart) chart.destroy();

chart = new Chart(canvas.getContext('2d'), {
type: tipoGrafico,
data: {
labels: etiquetas,
datasets: [{
label,
data: datos,
borderColor,
backgroundColor,
fill: tipoGrafico === 'line', // Solo rellenar para gráficos de línea
tension: 0.3
}]
},
options: {
responsive: true,
scales: {
y: { beginAtZero: true,
                    ticks: {
                        color: '#eee' 
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)' 
                    }
                },
                x: {
                    ticks: {
                        color: '#eee' 
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)' 
                    }
                }
},
            plugins: {
                legend: {
                    labels: {
                        color: '#00ffff' 
                    }
                }
            }
}
});
}

select.addEventListener('change', actualizarGrafico);
actualizarGrafico();
}

function calcularConsumo(carga, i, arr) {
if (i === 0) return 0;
const kmRecorridos = arr[i].km - arr[i - 1].km;
return kmRecorridos > 0 ? ((carga.litros / kmRecorridos) * 100).toFixed(2) : 0;
}

function formatearMes(str) {
const [a, m] = str.split('-');
const fecha = new Date(`${a}-${m}-01`);
return fecha.toLocaleString('es-AR', { year: 'numeric', month: 'long' });
}
}