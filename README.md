Compiz.js — Demo web de efectos Compiz

Recreación en JS vanilla de los efectos clásicos de Compiz, con todo el código separado en compiz.js.
Estructura

compiz-demo/
├── index.html  # maquetación, ventanas, dock, overlays
├── compiz.js   # toda la lógica: wobbly, cubo, expo, scale, lámpara, fuego/quemado
└── readme.md   # este archivo

Sin dependencias. Funciona con file://, no requiere servidor.
Uso

    Abrir index.html con doble-click en cualquier navegador moderno (Chrome / Firefox).
    Arrastrar ventanas desde la barra de título.
    Usar los botones de la barra superior o los atajos de teclado.

Efectos incluidos

    Wobbly Windows: deformación elástica al arrastrar (skew + muelle amortiguado). Se puede desactivar.
    Desktop Cube: 4 workspaces en un cubo 3D (rotateY + translateZ). Transición de 0.9s.
    Expo: vista en rejilla 2x2 de los 4 workspaces. Click en una celda para ir a ese workspace.
    Scale: vista de todas las ventanas abiertas. Click para enfocar (y cambiar de cara si hace falta).
    Magic Lamp / Genie: al minimizar, la ventana colapsa con onda sinusoidal hacia el icono 📦 del dock.
    Burn + Firepaint: al cerrar (o doble-click en título) la ventana se quema con partículas en canvas. Con Shift + arrastrar se pinta fuego libre.

Controles
Barra superior
Botón 	Acción
◀ Cubo / Cubo ▶ 	Girar el cubo a la cara anterior / siguiente
Expo 	Mostrar / ocultar rejilla de workspaces
Scale 	Mostrar / ocultar todas las ventanas
Wobbly: ON/OFF 	Activar / desactivar gelatina
Pintar fuego (Shift) 	Modo fuego permanente (sin pulsar Shift)
Lámpara 	Minimiza la primera ventana visible
Quemar 	Quema la primera ventana visible
Ventana

    Arrastrar desde .titlebar = mover + wobbly.
    Botón amarillo = minimizar con lámpara.
    Botón verde = maximizar / restaurar.
    Botón rojo o doble-click en barra = quemar y cerrar.

Dock inferior

    🏠 = restaurar todas las minimizadas (fade + scale).
    📦 = punto destino de la animación de lámpara.
    ＋ = crear ventana nueva en la cara actual.

Teclado
Atajo 	Acción
Ctrl+Alt+← / → 	Girar cubo
E 	Expo
S 	Scale
Shift (mantener + mover con click) 	Pintar fuego
Doble-click en fondo 	Girar cubo a siguiente cara
Personalización rápida

Todo está en compiz.js:

    Añadir ventana inicial: makeWindow(cara, x, y, "Título", "html"), cara 0-3.
    Duración del cubo: transition en #cube en index.html (0.9s).
    Intensidad wobbly: factores 0.35, rigidez 0.18, amortiguación 0.82 en enableDrag / wobbleStep.
    Fuego: spawnFire(x, y, n) y colores en el array col.
    Lámpara: constante DUR = 650 en magicLampMin.

Notas / límites

    Es una demo DOM, no afecta a ventanas reales del sistema.
    El cubo usa 50vw como profundidad (halfW()), se recalcula en resize.
    Las partículas usan <canvas id="fx"> a pantalla completa, límite de 1200 partículas.
    Si no ves efectos 3D, activa aceleración por hardware en el navegador.
