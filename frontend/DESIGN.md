---
name: EnergIA
description: Priorización de anomalías de medidores eléctricos, presentada como órdenes de trabajo con su evidencia.
colors:
  form-paper: "#f6f7f4"
  sheet-white: "#ffffff"
  data-ink: "#1b1f1d"
  muted-ink: "#55605a"
  form-green: "#1f5b48"
  form-green-deep: "#16463a"
  form-green-wash: "#edf4ef"
  form-rule: "#c6d6cc"
  form-rule-strong: "#8fae9f"
  greenbar: "#e8f1eb"
  stamp-vermilion: "#b93a22"
  stamp-vermilion-wash: "#fbece8"
  stamp-ochre: "#8f6206"
  stamp-ochre-wash: "#fbf2de"
typography:
  display:
    fontFamily: "Courier Prime, ui-monospace, monospace"
    fontSize: "3.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.29
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 92"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'tnum' 1"
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 72"
  data:
    fontFamily: "Courier Prime, ui-monospace, monospace"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "-0.01em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.form-green}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.form-green-deep}"
  button-secondary:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.form-green}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.form-green-wash}"
  field:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.data-ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px 10px"
  input:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.data-ink}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "40px"
  stamp-critical:
    backgroundColor: "{colors.stamp-vermilion}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  stamp-alert:
    backgroundColor: "{colors.stamp-ochre-wash}"
    textColor: "{colors.stamp-ochre}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
---

# Design System: EnergIA

## Overview

**Creative North Star: "El talonario de órdenes"**

EnergIA se ve como el talonario de órdenes de trabajo de una empresa de energía: un formulario preimpreso en una sola tinta verde, llenado a máquina, con sellos de goma para el estado. La IA no pinta alarmas: emite órdenes numeradas y priorizadas, y cada una lleva su evidencia adjunta. Es una herramienta de operación (modo Operate): densa donde el operador compara cifras y tranquila donde nada requiere atención.

El sistema tiene tres capas y cada una tiene un solo trabajo. La **capa preimpresa** (verde de formulario) dibuja la estructura: reglas finas, casillas y etiquetas condensadas en mayúsculas. La **capa llenada** (tinta de datos, máquina de escribir) contiene los valores medidos. La **capa de sellos** (bermellón y ocre) marca el estado. Un medidor normal no lleva sello: el silencio también es información.

Se rechazan de forma explícita la grilla de tarjetas KPI sobre una gráfica brillante (el default de la categoría), el papel falso (texturas, sombras, esquinas dobladas) y el color usado para decorar.

**Key Characteristics:**
- Formulario preimpreso: casillas con etiqueta arriba a la izquierda y valor debajo.
- Cifras en máquina de escribir, tabulares y alineadas.
- Estado con sellos que siempre llevan texto.
- Bandas green-bar en las tablas largas.
- Sin esquinas redondeadas ni sombras.

## Colors

Restringido: neutros de papel y tinta, un verde de formulario para la estructura, y dos tintas de sello reservadas al estado.

### Primary
- **Verde de formulario** (form-green): la tinta preimpresa. Reglas de encabezado, etiquetas, botón primario, pestaña activa, foco del teclado y relleno del contador de confianza.
- **Verde de formulario profundo** (form-green-deep): el hover y el borde del botón primario.
- **Lavado de formulario** (form-green-wash): banda del talón de la orden, hover de filas y de botones secundarios.

### Secondary
- **Sello bermellón** (stamp-vermilion): solo el estado Crítica y la severidad Alta. Nunca se usa en texto largo ni como decoración.
- **Sello ocre** (stamp-ochre): solo el estado Alerta y la severidad Media, siempre sobre su lavado ocre.

### Neutral
- **Papel de formulario** (form-paper): fondo de la página. Un blanco frío, no crema.
- **Hoja blanca** (sheet-white): el fondo de cada hoja, tabla y casilla.
- **Tinta de datos** (data-ink): texto principal y valores.
- **Tinta tenue** (muted-ink): notas, texto secundario y la severidad Baja.
- **Regla** (form-rule) y **regla fuerte** (form-rule-strong): divisiones de casillas, bordes de controles y barras de días normales.
- **Green-bar** (greenbar): las filas pares de las tablas.

### Named Rules
**La regla del sello.** El color de estado solo aparece en sellos, en la severidad y en filos de 1px. El texto de las explicaciones siempre es acromático.

**La regla del silencio.** Un medidor normal no lleva sello ni color: escribe "Normal" en tinta tenue.

**La regla de nunca solo color.** Cada sello lleva su palabra; cada severidad, su forma (flechas dobles, flecha simple o guion) y su palabra.

## Typography

**Display Font:** Courier Prime (con ui-monospace)
**Body Font:** Archivo Variable (con system-ui)
**Label Font:** Archivo Variable al 72 % de ancho

**Character:** Archivo es la voz impresa del formulario: una sola familia que se condensa para las etiquetas y se abre para leer. Courier Prime es lo que se escribió a máquina sobre el formulario: códigos de medidor, cifras, horas e IDs de análisis. Nunca se usa para prosa.

### Hierarchy
- **Display** (400, 3.5rem, 1): el código del medidor en la orden principal y en la investigación (M-109).
- **Headline** (700, 1.75rem, 1.29, ancho 92 %): el título de cada pantalla.
- **Title** (600, 0.9375rem): el encabezado de cada hoja, sobre la regla verde.
- **Body** (400, 0.9375rem, 1.6, máximo 62–65ch): la explicación de la IA y la acción recomendada.
- **Label** (600, 0.6875rem, +0.06em, MAYÚSCULAS, ancho 72 %): etiquetas preimpresas de casillas y columnas.
- **Data** (400, 1.125rem): valores de las casillas y celdas numéricas.

### Named Rules
**La regla de las dos capas.** Si el texto lo imprimió el formulario, va en Archivo; si lo llenó el sistema (una medición, un código, una hora), va en Courier Prime.

**La regla sin kicker.** Una etiqueta preimpresa va en una casilla o en la banda del talón, nunca flotando encima de un título.

## Layout

Contenedor de hasta 88rem con márgenes de 16px en móvil y 24px desde `sm`. El despacho usa dos columnas en `xl`: las órdenes a la izquierda (2fr) y el estado de la planta a la derecha (1fr, mínimo 20rem). Las demás pantallas apilan hojas a lo ancho, con separaciones de 20px. Las casillas se agrupan en grillas con 1px de separación sobre la regla, así la división la dibuja la regla y no un borde doble. En móvil todo se apila, las tablas conservan sus columnas clave y se desplazan en horizontal, y la barra de despacho baja la navegación a una segunda fila.

## Elevation & Depth

Sin sombras. La profundidad es tonal y de línea: el papel frío atrás, las hojas blancas encima, y la jerarquía la marcan el grosor y el color del borde (regla fina, borde verde, doble borde verde en la acción recomendada). La barra de despacho es el único elemento fijo: queda pegada arriba con el papel casi opaco.

### Named Rules
**La regla plana.** Nada flota. Si algo necesita más jerarquía, gana un borde verde o más escala, nunca una sombra.

## Shapes

Esquinas rectas en todo (0px): hojas, casillas, botones, sellos y controles. Las líneas son el material: reglas de 1px, el borde verde de la hoja activa, 2px en la acción recomendada, y una línea punteada de perforación entre el talón y el cuerpo de una orden. Los sellos tienen un borde de 2px y una inclinación de −2°.

## Components

### Buttons
- **Forma:** rectangular, sin radio (0px).
- **Primario:** fondo verde de formulario, texto blanco, 40px de alto. Es la acción principal de cada contexto (Run AI Analysis, Entrar, Abrir investigación).
- **Hover / Focus:** pasa a verde profundo; foco con contorno verde de 2px y 2px de separación. Al presionar baja 1px.
- **Secundario:** fondo blanco, borde de regla fuerte y texto verde; en hover, borde verde y lavado verde.
- **Deshabilitado:** 55 % de opacidad; el botón de análisis cambia su texto a "Analizando…".

### Casilla (Field)
La unidad del sistema: etiqueta preimpresa arriba a la izquierda, valor en máquina de escribir y una nota opcional en tinta tenue. Se usa para KPIs, cifras del medidor, variables eléctricas y cifras de la ventana analizada.

### Hoja (Sheet)
Sección de contenido: hoja blanca con borde de regla y un encabezado con título sobre una regla verde. La nota del encabezado dice qué se compara contra qué.

### Inputs / Fields
- **Estilo:** 40px de alto, borde de regla fuerte, fondo blanco, valor en máquina de escribir y cursor verde.
- **Focus:** el borde pasa a verde, con el anillo de foco global.
- **Error:** borde bermellón y mensaje debajo, conectado con `aria-describedby`.
- **Desplegables:** `select` nativo con flecha verde dibujada.

### Navigation
Barra de despacho fija: marca, tres enlaces, último análisis, Run AI Analysis y salir. El enlace activo va en tinta de datos y seminegrita, con una barra verde de 3px sobre la regla inferior; los inactivos van en tinta tenue.

### Sello (signature)
Crítica: sello lleno bermellón. Alerta: sello de contorno ocre sobre su lavado. No escalar: sello de contorno neutro. Entra "presionándose" una vez (escala 1,08 → 1 en 180ms).

### Orden de trabajo (signature)
La orden principal lleva un talón con número y hora de detección, una línea de perforación, el código del medidor en display, el sello y el cuerpo en dos columnas: qué encontró la IA y la acción. Las órdenes compactas repiten la anatomía a menor escala, con toda la tarjeta como enlace.

### Contador de confianza (signature)
Diez celdas; cada una es una décima y se llena en verde. Siempre va con el número (0,95) y, donde hay espacio, con la palabra (Alta). Está expuesto como `role="meter"`.

### Hoja de pasos del análisis (signature)
Aparece bajo la barra al presionar Run AI Analysis, sin ser un modal. Tiene siete pasos numerados que se chequean con el polling y, al terminar, un sello con el total y el enlace a las órdenes.

## Do's and Don'ts

### Do:
- **Do** poner cada cifra medida en Courier Prime y cada etiqueta en Archivo condensado en mayúsculas.
- **Do** marcar el estado con un sello que diga su palabra, y dejar sin sello lo que está normal.
- **Do** separar grupos de casillas con 1px de regla, no con espacio vacío ni con sombras.
- **Do** mostrar las horas del dataset como hora de planta, sin convertirlas.
- **Do** acompañar toda confianza con su número.

### Don't:
- **Don't** usar esquinas redondeadas, sombras ni degradados.
- **Don't** simular papel: nada de texturas, esquinas dobladas ni rotaciones fuera de los sellos.
- **Don't** usar bermellón u ocre en texto largo, fondos grandes o decoración.
- **Don't** poner una etiqueta pequeña encima de un título (kicker).
- **Don't** usar Courier Prime para prosa ni Archivo para cifras en tablas.
