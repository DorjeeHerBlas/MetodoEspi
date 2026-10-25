# METODOESPI2 · Web para GitHub Pages

Versión web estática del estudio musical, con tipografía del sistema, superficies lavanda y melocotón, cabecera y menú en tinta, controles segmentados y animaciones suaves. El movimiento respeta la preferencia del dispositivo de reducir animaciones. Funciona en ordenador, Android y iPhone desde el navegador. No requiere WordPress, base de datos remota, claves de API ni servidor de aplicación. El micrófono, la síntesis, la mezcla y la exportación se procesan en el dispositivo.

## Subir el ZIP preparado

1. Descomprime `METODOESPI2-WEB-GITHUB-PAGES.zip`.
2. Crea un repositorio en GitHub, por ejemplo `metodoespi2`. Para GitHub Free, utiliza un repositorio público.
3. Sube **el contenido descomprimido** a la raíz de la rama `main`. `index.html` tiene que quedar directamente en la raíz, junto a `styles.css`, `src`, `vendor`, `music-data.json`, `sw.js` y `.nojekyll`. No subas el ZIP como un único archivo.
4. En **Settings → Pages → Build and deployment**, selecciona **Deploy from a branch**, rama **main** y carpeta **/(root)**. Pulsa **Save**.
5. Espera a que GitHub termine el despliegue. La dirección aparecerá en Pages; normalmente será `https://TU-USUARIO.github.io/metodoespi2/`.

Guía oficial: [configurar el origen de publicación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

El ZIP incluye solamente la web y las licencias. No contiene grabaciones personales, proyectos guardados, APK, credenciales ni archivos privados de Android Studio. Las bibliotecas se incluyen localmente: no hay que instalar paquetes para publicarlo. Las rutas son relativas y funcionan con el nombre de repositorio que elijas.

## Uso

- **Escalas y acordes**: 14 escalas, 12 tónicas, notación latina/internacional y sostenidos/bemoles. Fórmulas T/ST siempre visibles. Las notas suenan al elegirlas. Tras tres fallos de escala aparece una comparación roja/verde con la respuesta correcta, también exportable a PDF. Los acordes tienen grados romanos y una matriz ampliable con acceso a Pistas. Las pentatónicas y blues utilizan columnas variables y notas reales de la escala, con nombres según sus intervalos, sin forzar siete grados. Las filas adicionales son opcionales y conservan respuestas e intentos.
- **Instrumento**: distintos instrumentos y afinaciones, doce trastes, ajuste por cuerda, vista para zurdos y ampliación sin interrumpir el audio. La orientación automática depende del navegador; también puedes girar el teléfono manualmente.
- **Estudio**: metrónomo con acentos, subdivisión y práctica progresiva; compases habituales y escritos como `7/8` o `3+2+2/8` (1–32 pulsos, denominadores 1/2/4/8/16); dos pistas independientes; reproducción conjunta desde el mismo reloj; base repetida bajo el solo; cuenta de entrada con otro timbre y botón de activación al reproducir, independiente de grabación; volumen individual real en escucha/mezcla; importación, recorte no destructivo con escucha del original/selección, pausa y seek, y ajuste de latencia de 1/10 ms. El mini reproductor añade bucles y barra de posición por pista.
- **Piano roll**: varias ideas en pestañas con nombre, renombrado y duplicado, guardadas aunque no ocupen pistas. Escuchar idea permite preescucha independiente. Cuadrícula dispersa que crece, inserción de acordes, notas dibujadas y envío a Pista 1, Pista 2 o Ambas. Todos los borradores se adaptan al compás y tempo del metrónomo. En horizontal, el teclado se desplaza verticalmente por alturas y horizontalmente por tiempo, con acceso al reproductor. Las teclas y casillas se iluminan al reproducir las secuencias generadas. Las grabaciones de micrófono no se convierten en MIDI.
- **Progresiones**: lista optativa de progresiones comunes y texto personalizado, incluidos en el PDF. **Notas**: texto con guardado local. **Afinador** cromático con referencia de La4 ajustable, feedback verde/rojo, nota de referencia y marcas de afinación visibles incluso antes de detectar una nota.
- **Exportar**: mezcla de ambas pistas en WAV o MP3 real a 192 kbps. **Proyecto ZIP + PDF** incluye esa mezcla, un PDF cuyo contenido eliges (escalas/corrección, acordes, instrumento, todas las ideas de piano, progresiones y notas), y `proyecto.json` con las dos pistas y los datos editables. **Abrir proyecto** recupera ese ZIP con todas las pestañas y pistas, independientemente de las secciones seleccionadas para el PDF. Sin audio también puedes exportar el proyecto y el PDF.

Permite el micrófono cuando pulses Grabar o Iniciar afinador. GitHub Pages proporciona HTTPS, necesario para la captura. Los formatos de importación los decodifica el navegador: WAV/MP3 se han probado; M4A/AAC/OGG dependen de los códecs del dispositivo. La exportación WAV/MP3 no depende de esos códecs.

La entrada y salida disponibles las decide el navegador y el sistema. Cuando no se admite elegir la salida, se usa la salida del sistema. La latencia Bluetooth sigue existiendo: puedes compensar próximas tomas y alinear las existentes escuchando ambas pistas. Esta versión se ha probado en Chrome de Windows; faltan pruebas físicas de Safari/iPhone y de micrófonos/cascos reales.

Las tomas de micrófono tienen un límite de 120 segundos por pista. El piano roll crece sin un límite fijo de compases; el procesamiento comprueba un presupuesto máximo de memoria y avisa si la secuencia es demasiado grande. Se graba y mezcla en mono.

El audio y las notas se guardan en IndexedDB/localStorage de ese navegador y origen. No se sincronizan con la app Android ni entre dispositivos. Descarga un proyecto para trasladarlo o conservar una copia; borrar los datos del navegador elimina el guardado local. Con la página completamente cargada una primera vez, el caché permite abrir la interfaz sin conexión. La reproducción y captura se detienen al enviar la página al fondo; el trabajo se conserva.

## Ejecutar y modificar el código fuente

Esta sección se refiere a la carpeta `web` del proyecto fuente de Android Studio. El ZIP publicable contiene la salida lista para alojar y no incluye las herramientas de desarrollo. En el código fuente, con Node.js 24 o posterior:

```sh
node scripts/serve.mjs
```

Abre `http://127.0.0.1:4173/`. No abras `index.html` mediante `file://`: los módulos, workers y el micrófono necesitan un servidor HTTP local o HTTPS. `PORT` permite elegir otro puerto.

```sh
node --test tests/*.test.mjs
node scripts/build.mjs
```

`dist/` contiene los archivos listos para publicar. El build usa solo módulos incluidos en Node y genera una versión nueva del caché según el contenido. Tras subir una actualización, cierra las pestañas antiguas y vuelve a abrir la web.

Para probar el ZIP ya descomprimido, también puedes ejecutar `python -m http.server 8000` dentro de esa carpeta y abrir `http://localhost:8000/`.

## Mantener la teoría compartida con Android

`music-data.json` se genera con el motor real Kotlin de `shared`, sin recalcular otra teoría independiente en JavaScript. Incluye 336 combinaciones de escala/tónica/escritura; la capa web de armonización conserva los resultados diatónicos de Kotlin y amplía pentatónicas/blues hasta 11.160 prefijos de acordes comprobados, con notas explícitas. `music-source.json` y las pruebas verifican que el catálogo corresponde al código musical.

Desde la raíz del proyecto Android:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
.\gradlew.bat :shared:exportWebMusic :shared:jvmTest
node --test web/tests/*.test.mjs
node web/scripts/build.mjs
```

Si subes el repositorio de código completo, ya existe `.github/workflows/pages.yml`: selecciona **Settings → Pages → Source → GitHub Actions**. Publica `web/dist` al enviar cambios a `main`, después de ejecutar las pruebas. La regeneración del catálogo se hace antes del commit si cambias el motor Kotlin.

## Dependencias

Los avisos y licencias están en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Se incluyen jsPDF 4.2.1, JSZip 3.10.1 y lamejs 1.2.1, sin modificar y sin CDN. El código del codificador MP3 y sus textos de licencia acompañan al paquete.
