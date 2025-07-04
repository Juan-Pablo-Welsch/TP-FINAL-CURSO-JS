Simulador de Consumo de Combustible

Este proyecto es un simulador interactivo para registrar y analizar el consumo de combustible de un vehículo. Permite al usuario llevar un control de sus cargas de combustible, visualizar un historial detallado, obtener un resumen clave y analizar tendencias a través de gráficos.

Características:

* Registro de Cargas: Permite ingresar la fecha, kilómetros actuales, litros cargados, precio por litro, lugar y tipo de combustible de cada carga.

* Resumen Rápido: Muestra métricas importantes como consumo medio, costo por kilómetro y totales de kilómetros, litros y gasto.

* Historial Detallado: Presenta todas las cargas registradas en una tabla interactiva.

* Análisis Gráfico: Visualiza el consumo mensual, el costo por kilómetro y el gasto total por carga a través de gráficos. Los gráficos se pueden filtrar por mes y año.

* Estaciones Económicas: Identifica las estaciones de servicio más económicas basándose en las cargas del último mes.

* Persistencia de Datos: Los datos se cargan desde un archivo JSON simulando una base de datos, y las nuevas cargas se añaden a esta estructura en memoria (sin persistencia real en el JSON, es para simular el flujo del TP).

Cómo usar el simulador:

1.  Pestaña "Inicio":Al cargar la aplicación, verás un resumen general de tu consumo y las estaciones más económicas.
2.  Pestaña "Carga": Utiliza el formulario para añadir una nueva carga de combustible. Asegúrate de que los kilómetros ingresados sean mayores que los de la última carga para que el cálculo sea correcto.
3.  Pestaña "Historial": Aquí podrás ver un listado completo de todas tus cargas registradas.
4.  Pestaña "Gráficos": Observa las tendencias de tu consumo. Puedes usar el desplegable para filtrar los gráficos por un mes/año específico.

Estructura del proyecto:

* `index.html`: Documento principal de la interfaz de usuario.
* `css/estilos.css`: Archivo de estilos CSS para la aplicación.
* `js/app.js`: Contiene toda la lógica JavaScript del simulador.
* `js/cargas.json`: Simula la base de datos de las cargas de combustible.



