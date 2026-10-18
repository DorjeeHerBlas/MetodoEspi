# Bibliotecas de METODOESPI2 Web

Se distribuyen archivos originales de estas bibliotecas. Se cargan desde `vendor/`, sin CDN ni servicios de conversión de audio.

| Biblioteca | Versión | Uso | Licencia y fuente |
| --- | --- | --- | --- |
| jsPDF | 4.2.1 | Exportación PDF | MIT. [Fuente](https://github.com/parallax/jsPDF). Texto en `vendor/jspdf/LICENSE`. |
| JSZip | 3.10.1 | Exportación/importación de proyectos ZIP | Se utiliza bajo MIT. [Fuente](https://github.com/Stuk/jszip). Texto en `vendor/jszip/LICENSE.markdown`. |
| lamejs | 1.2.1 | Codificador MP3 JavaScript, port de LAME | LGPL-3.0. [Fuente](https://github.com/zhuker/lamejs), [LAME](https://lame.sourceforge.io/). Textos en `vendor/lamejs/LICENSE`, `COPYING.LESSER` y `COPYING`. |

LAME/lamejs se conserva como biblioteca separada y sin cambios. `vendor/lamejs/lame.all.js` es su distribución JavaScript legible. Se incluye también el código original en `vendor/lamejs/src/js/`, su `package.json`, `README.md` y `makeall.sh`. Puedes inspeccionar, modificar y sustituir esta biblioteca bajo su licencia, manteniendo su interfaz `lamejs.Mp3Encoder`. No hay ofuscación ni comprobaciones que impidan reemplazarla. Estas licencias se refieren a las bibliotecas indicadas.
