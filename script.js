let dataVisitados = [];
let dataMultimedia = {};

let currentCountry = null;
let currentCity = null;
let currentAlbum = null;
// --- VARIABLES YOUTUBE MUSIC ---
let ytPlayer = null;
let isMusicPlaying = false;
let wasMusicPlayingBeforeVideo = false;

// Cargar API de YouTube
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        playerVars: { 
            'autoplay': 0, 
            'controls': 0, 
            'playsinline': 1,
            'enablejsapi': 1,
            'origin': (window.location.protocol === 'file:' || window.location.hostname === '127.0.0.1') ? 'https://www.youtube.com' : window.location.origin
        },
        events: {
            'onReady': (event) => {
                console.log("Reproductor listo");
            },
            'onStateChange': onPlayerStateChange,
            'onError': (event) => {
                console.error("Error en reproductor YouTube:", event.data);
            }
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        // Loop de la música si termina
        ytPlayer.playVideo();
    }
}

function extractYouTubeID(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function toggleMusic() {
    if (!ytPlayer || !currentAlbum || !currentAlbum.musica) return;
    
    const btnMusic = document.getElementById('btn-music');
    
    if (isMusicPlaying) {
        ytPlayer.pauseVideo();
        isMusicPlaying = false;
        btnMusic.innerHTML = '🎵 PLAY MÚSICA';
    } else {
        ytPlayer.playVideo();
        isMusicPlaying = true;
        btnMusic.innerHTML = '⏸️ PAUSAR MÚSICA';
    }
}

// Variables para el control del PLAY (Slideshow)
let slideshowTimer = null;
let slideshowIndex = 0;const SLIDE_DURATION = 5000; // Cambiado a 5 segundos para las imágenes

// Variables para eliminación de multimedia
let isDeleteMode = false;
let selectedMediaIndices = [];
function createMediaElement(url, className, useControls = false) {
    const cleanedUrl = url.replace('#video', '');
    let finalUrl = cleanedUrl;
    let fileId = null;

    const isDrive = cleanedUrl.includes('drive.google.com') || cleanedUrl.includes('docs.google.com');

    if (isDrive) {
        const match = cleanedUrl.match(/\/d\/([^/]+)/);
        if (match && match[1]) {
            fileId = match[1];
        } else {
            const urlParams = new URLSearchParams(cleanedUrl.substring(cleanedUrl.indexOf('?')));
            if (urlParams.has('id')) {
                fileId = urlParams.get('id');
            }
        }
    }

    if (checkIsVideo(url)) {
        // SI ES UN VIDEO
        if (isDrive && fileId) {
            if (className === 'gallery-item') {
                const thumbContainer = document.createElement('div');
                thumbContainer.className = className;
                thumbContainer.style.display = 'flex';
                thumbContainer.style.alignItems = 'center';
                thumbContainer.style.justifyContent = 'center';
                thumbContainer.style.backgroundColor = '#111111';
                thumbContainer.style.color = '#ffffff';
                thumbContainer.style.fontSize = '2.5rem';
                thumbContainer.innerHTML = '▶'; 
                return thumbContainer;
            } else {
                const iframe = document.createElement('iframe');
                iframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
                iframe.className = className;
                iframe.style.border = 'none';
                iframe.style.width = '80vw';
                iframe.style.height = '70vh';
                iframe.setAttribute('allow', 'autoplay');
                return iframe;
            }
        }

        const video = document.createElement('video');
        video.src = finalUrl;
        video.className = className;
        if (useControls) video.controls = true;
        video.muted = true;
        video.playsInline = true;
        return video;
        
    }
        else {
        // SI ES UNA IMAGEN
        if (isDrive && fileId) {
            // TRUCO: Usamos el servidor de contenido interno de Google para burlar el bloqueo
            finalUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        }
        
        const img = document.createElement('img');
        img.src = finalUrl;
        img.className = className;
        img.alt = "Recuerdo";
        img.onerror = function() {
            this.onerror = null;
            this.src = `https://placehold.co/250x200?text=Error+al+cargar`;
        };
        return img;
    }
}
const todosLosPaises = [
    { es: "Alemania", en: "Germany" },
    { es: "Argentina", en: "Argentina" },
    { es: "Bolivia", en: "Bolivia" }, { es: "Brasil", en: "Brazil" }, 
    { es: "Chile", en: "Chile" },{ es: "Colombia", en: "Colombia" }, 
    { es: "Ecuador", en: "Ecuador" }, 
    { es: "España", en: "Spain" }, { es: "Estados Unidos", en: "United States" }, { es: "Francia", en: "France" }, 
    { es: "Italia", en: "Italy" }, { es: "Reino Unido", en: "United Kingdom" }, { es: "México", en: "Mexico" }, 
    { es: "Paraguay", en: "Paraguay" }, { es: "Perú", en: "Peru" }, { es: "Uruguay", en: "Uruguay" }, 
    { es: "Venezuela", en: "Venezuela" }
];

async function loadData() {
    try {
        const resVisitados = await fetch('visitados.json');
        dataVisitados = await resVisitados.json();
    } catch (error) {
        dataVisitados = [];
    }

    try {
        const resMultimedia = await fetch('multimedia.json');
        dataMultimedia = await resMultimedia.json();
    } catch (error) {
        dataMultimedia = {};
    }

    // NUEVO: Carga automatizada de la carpeta aventuras
    try {
        const resAventuras = await fetch('aventuras/index.json');
        const archivosAventuras = await resAventuras.json();
        
        for (const archivo of archivosAventuras) {
            try {
                const resUnaAventura = await fetch(`aventuras/${archivo}`);
                const dataAventura = await resUnaAventura.json();
                if (dataAventura.aventura && dataAventura.eventos) {
                    // Evitamos duplicados antes de insertar
                    if (!aventurasGuardadas.some(a => a.aventura.titulo === dataAventura.aventura.titulo)) {
                        aventurasGuardadas.push(dataAventura);
                    }
                }
            } catch (err) {
                console.error(`Error al cargar la aventura: ${archivo}`, err);
            }
        }
        renderAventurasGuardadas();
    } catch (error) {
        console.log("No se pudo cargar el índice de aventuras o la carpeta no existe aún.");
    }

    populateCountrySelect();
    renderCountries();
}

let geoJsonGlobalProvincias = null;

async function populateCountrySelect() {
    const select = document.getElementById('select-paises');
    if (!select) return;
    select.innerHTML = '<option value="">Cargando países...</option>';
    
    try {
        if (!currentGeoJsonMundo) {
            const response = await fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
            currentGeoJsonMundo = await response.json();
        }
        
        const paises = currentGeoJsonMundo.features
            .map(f => f.properties.name)
            .filter(name => name)
            .sort();
            
        select.innerHTML = '<option value="">-- Selecciona un País --</option>';
        paises.forEach(pais => {
            const option = document.createElement('option');
            option.value = pais;
            option.innerText = pais;
            select.appendChild(option);
        });
    } catch (e) {
        select.innerHTML = '<option value="">Error al cargar países</option>';
    }
}

function switchScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screen}`).classList.add('active');
    document.getElementById('btn-recuerdos').classList.remove('active');
    document.getElementById('btn-pantalla2').classList.remove('active');
    document.getElementById(`btn-${screen}`).classList.add('active');
    
    if (screen === 'pantalla2') {
        if(typeof cerrarCalendarioSuenos === 'function') cerrarCalendarioSuenos();
        if(typeof renderAventurasGuardadas === 'function') renderAventurasGuardadas();
    }
}

// Saber si un enlace es de video
function checkIsVideo(url) {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const urlLower = url.toLowerCase();
    // Ahora también detectará si la URL termina o contiene '#video'
    return videoExtensions.some(ext => urlLower.includes(ext)) || urlLower.includes('video') || urlLower.includes('#video');
}

function renderCountries() {
    currentCountry = null;
    currentCity = null;
    resetView('Países Visitados', false, false);
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';

    dataVisitados.forEach(pais => {
        grid.appendChild(createCard(pais.nombre, pais.portada, () => selectCountry(pais)));
    });
}

function selectCountry(pais) {
    currentCountry = pais;
    currentCity = null;
    resetView(`Ciudades de ${pais.nombre}`, true, false);
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';

    if (pais.ciudades) {
        pais.ciudades.forEach(ciudad => {
            grid.appendChild(createCard(ciudad.nombre, ciudad.portada, () => selectCity(ciudad)));
        });
    }
}

function selectCity(ciudad) {
    currentCity = ciudad;
    resetView(`Recuerdos en ${ciudad.nombre}`, true, false);
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';

    if (ciudad.albumes) {
        ciudad.albumes.forEach(album => {
            grid.appendChild(createCard(album.nombre, album.portada, () => selectAlbum(album)));
        });
    }
}

function selectAlbum(album) {
    currentAlbum = album;
    resetView(`Recuerdo: ${album.nombre}`, true, true);
    
    document.getElementById('cards-grid').style.display = 'none';

    // Lógica de carga de música
    const btnMusic = document.getElementById('btn-music');
    if (album.musica && ytPlayer) {
        const videoId = extractYouTubeID(album.musica) || album.musica;
        ytPlayer.cueVideoById(videoId);
        btnMusic.style.display = 'inline-block';
        btnMusic.innerHTML = '🎵 PLAY MÚSICA';
        isMusicPlaying = false;
    }
    const gallery = document.getElementById('media-gallery');
    gallery.style.display = 'grid';
    gallery.innerHTML = '';

    currentMediaList = dataMultimedia[album.id] || [];

    if(currentMediaList.length === 0) {
        gallery.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--secondary); padding:2rem;">
            No hay fotos vinculadas para este recuerdo todavía.<br>
            Asigna enlaces en multimedia.json usando el ID: <strong>${album.id}</strong>
        </p>`;
        return;
    }

    isDeleteMode = false;
    selectedMediaIndices = [];
    document.getElementById('btn-delete-media').style.backgroundColor = '';

    currentMediaList.forEach((url, index) => {
        const mediaEl = createMediaElement(url, 'gallery-item', false);
        mediaEl.onclick = () => {
            if (isDeleteMode) {
                toggleMediaSelection(index, mediaEl);
            } else {
                openLightbox(url);
            }
        };
        gallery.appendChild(mediaEl);
    });
}

function createCard(title, imagePath, onClickEvent) {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = onClickEvent;
    // Agregamos 'this.onerror=null;' para romper el bucle si la segunda imagen falla
    // Cambiamos a placehold.co que es un servicio más estable actualmente
    card.innerHTML = `
        <img src="${imagePath}" alt="${title}" onerror="this.onerror=null; this.src='https://placehold.co/250x200?text=${encodeURIComponent(title)}'">
        <div class="card-title">${title}</div>
    `;
    return card;
}

function resetView(title, showBack, showPlay) {
    document.getElementById('view-title').innerText = title;
    document.getElementById('btn-back').style.display = showBack ? 'block' : 'none';
    document.getElementById('btn-play').style.display = showPlay ? 'block' : 'none';
    
    // Esconder siempre el botón de música al cambiar de vista
    const btnMusic = document.getElementById('btn-music');
    if (btnMusic) btnMusic.style.display = 'none';
    
    // Detener música al salir del álbum
    if (!showPlay && ytPlayer && isMusicPlaying) {
        toggleMusic();
    }
    
    const btnAddCountry = document.getElementById('btn-add-country');
    const btnAddCity = document.getElementById('btn-add-city');
    const btnAddAlbum = document.getElementById('btn-add-album');

    const btnDeleteMedia = document.getElementById('btn-delete-media');

    // Control estricto de visibilidad de botones administrativos
    if (!showBack) {
        btnAddCountry.style.display = 'block';
        btnAddCity.style.display = 'none';
        btnAddAlbum.style.display = 'none';
        btnDeleteMedia.style.display = 'none';
    } else if (showBack && !showPlay && currentCity === null) {
        btnAddCountry.style.display = 'none';
        btnAddCity.style.display = 'block';
        btnAddAlbum.style.display = 'none';
        btnDeleteMedia.style.display = 'none';
    } else if (showBack && !showPlay && currentCity !== null) {
        btnAddCountry.style.display = 'none';
        btnAddCity.style.display = 'none';
        btnAddAlbum.style.display = 'block'; // Viendo recuerdos de una ciudad
        btnDeleteMedia.style.display = 'none';
    } else {
        btnAddCountry.style.display = 'none';
        btnAddCity.style.display = 'none';
        btnAddAlbum.style.display = 'none';
        btnDeleteMedia.style.display = 'block'; // Viendo contenido de un álbum
    }
    
    document.getElementById('cards-grid').style.display = 'grid';
    document.getElementById('media-gallery').style.display = 'none';
}

function goBack() {
    if (document.getElementById('media-gallery').style.display === 'grid') {
        selectCity(currentCity);
    } else if (currentCity && document.getElementById('view-title').innerText.includes('Recuerdos')) {
        selectCountry(currentCountry);
    } else {
        renderCountries();
    }
}

// Modales - Gestión de País y Ciudad
function openCountryModal() { document.getElementById('modal-agregar-pais').classList.add('active'); }
function closeCountryModal() { document.getElementById('modal-agregar-pais').classList.remove('active'); }
function confirmAddCountry() {
    const paisSeleccionado = document.getElementById('select-paises').value;
    if (dataVisitados.some(p => p.nombre.toLowerCase() === paisSeleccionado.toLowerCase())) {
        alert("Este país ya está registrado."); return;
    }
    const nombreNormalizado = paisSeleccionado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    dataVisitados.push({ nombre: paisSeleccionado, portada: `portadas/${nombreNormalizado}.jpg`, ciudades: [] });
    closeCountryModal(); renderCountries();
}

async function openCityModal() {
    if (!currentCountry) return;
    const modal = document.getElementById('modal-agregar-ciudad');
    const select = document.getElementById('select-ciudades');
    modal.classList.add('active');
    select.innerHTML = '<option value="">Cargando ciudades...</option>';
    
    try {
        if (!geoJsonGlobalProvincias) {
            const response = await fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson");
            geoJsonGlobalProvincias = await response.json();
        }
        
        const provincias = geoJsonGlobalProvincias.features
            .filter(f => f.properties.admin.toLowerCase() === currentCountry.nombre.toLowerCase())
            .map(f => f.properties.name)
            .filter(name => name)
            .sort();
            
        select.innerHTML = '<option value="">-- Selecciona --</option>';
        if (provincias.length > 0) {
            provincias.forEach(prov => {
                let opt = document.createElement('option'); opt.value = prov; opt.innerText = prov; select.appendChild(opt);
            });
        } else {
            select.innerHTML = '<option value="">No se encontraron ciudades (usa campo manual)</option>';
        }
    } catch (e) { 
        select.innerHTML = '<option value="">Usa el campo manual inferior</option>'; 
    }
}
function closeCityModal() { document.getElementById('modal-agregar-ciudad').classList.remove('active'); }
function confirmAddCity() {
    let ciudad = document.getElementById('select-ciudades').value || document.getElementById('input-ciudad-fallback').value.trim();
    if (!ciudad) return alert("Elige o escribe una provincia.");
    if (!currentCountry.ciudades) currentCountry.ciudades = [];
    if (currentCountry.ciudades.some(c => c.nombre.toLowerCase() === ciudad.toLowerCase())) return alert("Ya existe.");
    const nombreNormalizado = ciudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
    currentCountry.ciudades.push({ nombre: ciudad, portada: `portadas/${nombreNormalizado}.jpg`, albumes: [] });
    closeCityModal(); selectCountry(currentCountry);
}

// Modales - Gestión de Recuerdos (NUEVO)
function openAlbumModal() {
    document.getElementById('modal-agregar-recuerdo').classList.add('active');
    document.getElementById('input-recuerdo-nombre').value = '';
}
function closeAlbumModal() {
    document.getElementById('modal-agregar-recuerdo').classList.remove('active');
}
function confirmAddAlbum() {
    const nombreRecuerdo = document.getElementById('input-recuerdo-nombre').value.trim();
    if (!nombreRecuerdo) return alert("Asigna un nombre al recuerdo.");

    if (!currentCity.albumes) currentCity.albumes = [];

    // Creamos un ID único irrepetible usando la fecha y hora exacta
    const nuevoId = "recuerdo_" + Date.now();

    const nuevoAlbum = {
        id: nuevoId,
        nombre: nombreRecuerdo,
        portada: "portadas/default_recuerdo.jpg"
    };

    currentCity.albumes.push(nuevoAlbum);
    closeAlbumModal();
    
    // Le informamos al usuario el ID para que configure su multimedia.json
    alert(`¡Recuerdo creado con éxito!\n\nPara añadirle fotos/videos, abre multimedia.json y añade enlaces bajo la clave:\n"${nuevoId}"`);
    
    selectCity(currentCity);
}

// Descargar JSON de países actualizado
function downloadVisitadosJson() {
    if (dataVisitados.length === 0) return alert("No hay datos.");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataVisitados, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "visitados.json");
    document.body.appendChild(dl); dl.click(); dl.remove();
}
// --- Lógica de Eliminación de Multimedia ---
function toggleDeleteMode() {
    const btnDelete = document.getElementById('btn-delete-media');
    if (!isDeleteMode) {
        isDeleteMode = true;
        btnDelete.style.backgroundColor = '#ffb703'; // Color de advertencia activo
        alert("Modo selección activado. Haz clic en las fotos que desees eliminar y luego presiona de nuevo el tacho de basura.");
    } else {
        if (selectedMediaIndices.length > 0) {
            openDeleteConfirmModal();
        } else {
            isDeleteMode = false;
            btnDelete.style.backgroundColor = '';
            alert("Modo selección desactivado.");
        }
    }
}

function toggleMediaSelection(index, element) {
    const idxPos = selectedMediaIndices.indexOf(index);
    if (idxPos === -1) {
        selectedMediaIndices.push(index);
        element.classList.add('selected');
    } else {
        selectedMediaIndices.splice(idxPos, 1);
        element.classList.remove('selected');
    }
}

function openDeleteConfirmModal() {
    document.getElementById('delete-count').innerText = selectedMediaIndices.length;
    document.getElementById('modal-confirmar-eliminar').classList.add('active');
}

function closeDeleteConfirmModal() {
    document.getElementById('modal-confirmar-eliminar').classList.remove('active');
}

function confirmDeleteMedia() {
    selectedMediaIndices.sort((a, b) => b - a); // Ordenar de mayor a menor para borrar de atrás hacia adelante
    
    selectedMediaIndices.forEach(index => {
        dataMultimedia[currentAlbum.id].splice(index, 1);
    });

    closeDeleteConfirmModal();
    downloadMultimediaJson();
    selectAlbum(currentAlbum); // Recargar la vista actual
}

function downloadMultimediaJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataMultimedia, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "multimedia.json");
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
}
// Visualización Lightbox Individual
function openLightbox(url) {
    const container = document.getElementById('lightbox-media-container');
    container.innerHTML = '';
    container.appendChild(createMediaElement(url, '', true));
    document.getElementById('lightbox').classList.add('active');
}
function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.getElementById('lightbox-media-container').innerHTML = '';
}

function startSlideshow() {
    if (currentMediaList.length === 0) {
        return alert("No hay elementos multimedia en este recuerdo para reproducir.");
    }
    slideshowIndex = 0;
    document.getElementById('slideshow').classList.add('active');
    renderSlide();
}

function renderSlide() {
    // Limpiamos cualquier temporizador activo previo para evitar saltos dobles
    if (slideshowTimer) clearTimeout(slideshowTimer);

    const container = document.getElementById('slideshow-media-container');
    container.innerHTML = '';
    
    const currentUrl = currentMediaList[slideshowIndex];
    const isVideo = checkIsVideo(currentUrl);

    // Creamos el elemento multimedia (sin silenciar y con controles habilitados por si quieren pausar)
    // Creamos el elemento multimedia (sin silenciar y con controles habilitados por si quieren pausar)
    const mediaEl = createMediaElement(currentUrl, '', true);
    container.appendChild(mediaEl);

    if (isVideo) {
        // Si la música está sonando, la pausamos y guardamos el estado
        if (isMusicPlaying) {
            wasMusicPlayingBeforeVideo = true;
            ytPlayer.pauseVideo();
        } else {
            wasMusicPlayingBeforeVideo = false;
        }

        // Le quitamos el silencio por defecto y forzamos la reproducción automática
        mediaEl.muted = false;
        mediaEl.autoplay = true;
        
        // Ejecutamos el play automáticamente dándole tiempo al navegador a cargarlo
        setTimeout(() => {
            mediaEl.play().catch(err => console.log("Autoplay bloqueado por el navegador:", err));
        }, 50);

        // EVENTO CLAVE: Cuando el video termine por completo, pasa a la siguiente diapositiva
        mediaEl.onended = function() {
            if (wasMusicPlayingBeforeVideo && ytPlayer) {
                ytPlayer.playVideo();
            }
            nextSlide();
        };

        // Respaldo de seguridad: Si el video falla en cargar por conexión, pasa tras 30 segundos
        slideshowTimer = setTimeout(nextSlide, 30000); 
    } else {
        // Si es una imagen, espera exactamente los 5 segundos configurados
        slideshowTimer = setTimeout(nextSlide, SLIDE_DURATION);
    }
}

function nextSlide() {
    slideshowIndex++;
    if (slideshowIndex >= currentMediaList.length) {
        slideshowIndex = 0; // Reinicia al llegar al final
    }
    renderSlide();
}

function prevSlide() {
    slideshowIndex--;
    if (slideshowIndex < 0) {
        slideshowIndex = currentMediaList.length - 1; // Va al último si retrocede en el primero
    }
    renderSlide();
}

function stopSlideshow() {
    if (slideshowTimer) clearTimeout(slideshowTimer);
    document.getElementById('slideshow').classList.remove('active');
    
    // Vaciamos el contenedor para cortar inmediatamente el audio de cualquier video en reproducción
    document.getElementById('slideshow-media-container').innerHTML = '';

    // Restaurar la música si fue pausada por un video de la presentación
    if (wasMusicPlayingBeforeVideo && ytPlayer) {
        ytPlayer.playVideo();
        wasMusicPlayingBeforeVideo = false;
    }
}
let semanaActual = 0;
const MAX_SEMANAS = 5;
let aventurasGuardadas = [];
// --- SECCIÓN SUEÑOS Y PLANIFICADOR DE AVENTURAS ---
let aventuraActiva = null;
let aventuraEventos = [];
let eventoEnEdicion = null;

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HORA_INICIO = 7;
const HORA_FIN = 23;

function obtenerIntervalosHorarios() {
    const intervalos = [];
    for (let h = HORA_INICIO; h <= HORA_FIN; h++) {
        intervalos.push(`${String(h).padStart(2, '0')}:00`);
        intervalos.push(`${String(h).padStart(2, '0')}:30`);
    }
    return intervalos;
}

const INTERVALOS_HORARIOS = obtenerIntervalosHorarios();

async function openAventuraModal() {
    document.getElementById('modal-crear-aventura').classList.add('active');
    const selectP = document.getElementById('select-su सपनों-pais') || document.getElementById('select-suenos-pais');
    selectP.innerHTML = '<option value="">Cargando países...</option>';
    
    try {
        if (!currentGeoJsonMundo) {
            const response = await fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
            currentGeoJsonMundo = await response.json();
        }
        
        const paises = currentGeoJsonMundo.features
            .map(f => f.properties.name)
            .filter(name => name)
            .sort();
            
        selectP.innerHTML = '<option value="">-- Selecciona un País --</option>';
        paises.forEach(pais => {
            const option = document.createElement('option');
            option.value = pais;
            option.innerText = pais;
            selectP.appendChild(option);
        });
        onAventuraPaisChange();
    } catch (e) {
        selectP.innerHTML = '<option value="">Error al cargar países</option>';
    }
}

function closeAventuraModal() {
    document.getElementById('modal-crear-aventura').classList.remove('active');
}

async function onAventuraPaisChange() {
    const paisSeleccionado = (document.getElementById('select-suenos-pais') || document.getElementById('select-su सपनों-pais')).value;
    const selectCiudad = document.getElementById('select-suenos-ciudad');
    selectCiudad.innerHTML = '<option value="">Cargando ciudades...</option>';
    
    if (!paisSeleccionado) {
        selectCiudad.innerHTML = '<option value="Capital">Centro/Capital Principal</option>';
        return;
    }
    
    try {
        if (!geoJsonGlobalProvincias) {
            const response = await fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson");
            geoJsonGlobalProvincias = await response.json();
        }
        
        const provincias = geoJsonGlobalProvincias.features
            .filter(f => f.properties.admin.toLowerCase() === paisSeleccionado.toLowerCase())
            .map(f => f.properties.name)
            .filter(name => name)
            .sort();
            
        selectCiudad.innerHTML = '';
        if (provincias.length > 0) {
            provincias.forEach(prov => {
                let opt = document.createElement('option');
                opt.value = prov;
                opt.innerText = prov;
                selectCiudad.appendChild(opt);
            });
        } else {
            selectCiudad.innerHTML = '<option value="Capital">Centro/Capital Principal</option>';
        }
    } catch (e) {
        selectCiudad.innerHTML = '<option value="Capital">Centro/Capital Principal</option>';
    }
}

function confirmarCrearAventura() {
    const pais = (document.getElementById('select-suenos-pais') || document.getElementById('select-su सपनों-pais')).value;
    const ciudad = document.getElementById('select-suenos-ciudad').value || "Capital";
    const tipoDestino = document.getElementById('select-suenos-destino-tipo').value;
    
    let tituloAventura = (tipoDestino === 'pais') ? pais : ciudad;
    
    aventuraActiva = {
        pais: pais,
        ciudad: ciudad,
        titulo: tituloAventura
    };
    
    aventuraEventos = [];
    semanaActual = 0;
    
    abrirCalendarioSuenos();
    closeAventuraModal();
    renderCalendario();
}

function abrirCalendarioSuenos() {
    document.getElementById('suenos-grid').style.display = 'none';
    document.getElementById('suenos-titulo-aventura').innerText = `Plan de Viaje: ${aventuraActiva.titulo}`;
    document.getElementById('suenos-container').style.display = 'block';
    document.getElementById('suenos-semana-titulo').innerText = `Semana ${semanaActual + 1}`;
}

function cerrarCalendarioSuenos() {
    document.getElementById('suenos-container').style.display = 'none';
    document.getElementById('suenos-grid').style.display = 'grid';
}

function cambiarSemana(direccion) {
    let nuevaSemana = semanaActual + direccion;
    if (nuevaSemana >= 0 && nuevaSemana < MAX_SEMANAS) {
        semanaActual = nuevaSemana;
        document.getElementById('suenos-semana-titulo').innerText = `Semana ${semanaActual + 1}`;
        renderCalendario();
    }
}

function renderCalendario() {
    const grid = document.getElementById('suenos-calendario-grid');
    grid.innerHTML = '';
    
    const esquina = document.createElement('div');
    esquina.className = 'calendar-header';
    esquina.innerText = 'Hora';
    grid.appendChild(esquina);
    
    DIAS_SEMANA.forEach(dia => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerText = dia;
        grid.appendChild(header);
    });
    
    const DIAS_TOTALES = MAX_SEMANAS * 7;
    const matrizCeldas = Array(DIAS_TOTALES).fill(null).map(() => Array(INTERVALOS_HORARIOS.length).fill(null).map(() => ({
        eventos: [],
        bloqueado: false,
        colorClase: ''
    })));
    
    aventuraEventos.forEach(ev => {
        if (ev.tipo === 'viaje-salida' || ev.tipo === 'actividad' || ev.tipo === 'restaurante') {
            let totalSlots = ev.durationSlots;
            let currentDay = ev.day;
            let currentSlot = ev.slot;
            
            for (let i = 0; i < totalSlots; i++) {
                if (currentSlot >= INTERVALOS_HORARIOS.length) {
                    currentSlot = 0;
                    currentDay = currentDay + 1;
                }
                
                if (currentDay < DIAS_TOTALES) {
                    matrizCeldas[currentDay][currentSlot].bloqueado = true;
                    matrizCeldas[currentDay][currentSlot].colorClase = `bg-${ev.tipo}`;
                    
                    if (i === 0) {
                        matrizCeldas[currentDay][currentSlot].eventos.push(ev);
                    }
                }
                currentSlot++;
            }
        } else {
            if (ev.day >= 0 && ev.day < DIAS_TOTALES && ev.slot >= 0 && ev.slot < INTERVALOS_HORARIOS.length) {
                matrizCeldas[ev.day][ev.slot].eventos.push(ev);
                matrizCeldas[ev.day][ev.slot].colorClase = `bg-${ev.tipo}`;
            }
        }
    });
    
    INTERVALOS_HORARIOS.forEach((horaStr, slotIdx) => {
        const timeCell = document.createElement('div');
        timeCell.className = 'calendar-time-cell';
        timeCell.innerText = horaStr;
        grid.appendChild(timeCell);
        
        DIAS_SEMANA.forEach((dia, dayIdx) => {
            const diaAbsoluto = (semanaActual * 7) + dayIdx;
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            
            const infoCelda = matrizCeldas[diaAbsoluto][slotIdx];
            
            if (infoCelda.bloqueado && infoCelda.colorClase) {
                cell.classList.add('cell-blocked');
                cell.classList.add(infoCelda.colorClase);
            }
            
            infoCelda.eventos.forEach(ev => {
                const originalIndex = aventuraEventos.indexOf(ev);
                const badge = document.createElement('div');
                badge.className = `event-badge bg-${ev.tipo}`;
                badge.style.display = 'flex';
                badge.style.justifyContent = 'space-between';
                badge.style.alignItems = 'center';
                badge.style.gap = '6px';
                
                const badgeText = document.createElement('span');
                badgeText.innerText = ev.texto;
                badge.appendChild(badgeText);

                const deleteBtn = document.createElement('span');
                deleteBtn.innerHTML = '&times;';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.fontWeight = 'bold';
                deleteBtn.style.fontSize = '1.2rem';
                deleteBtn.style.color = '#ff4d4d';
                deleteBtn.style.padding = '0 2px';
                deleteBtn.title = 'Eliminar etiqueta';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    aventuraEventos.splice(originalIndex, 1);
                    renderCalendario();
                };
                badge.appendChild(deleteBtn);
                
                badge.draggable = true;
                badge.ondragstart = (e) => {
                    e.dataTransfer.setData('text/plain', originalIndex);
                };
                
                badge.onclick = (e) => {
                    e.stopPropagation();
                    abrirEdicionEvento(originalIndex);
                };
                
                cell.appendChild(badge);
            });
            cell.ondragover = (e) => e.preventDefault();
            cell.ondrop = (e) => {
                e.preventDefault();
                const draggedIndex = e.dataTransfer.getData('text/plain');
                if (draggedIndex !== "") {
                    const ev = aventuraEventos[draggedIndex];
                    if (ev) {
                        ev.day = diaAbsoluto;
                        ev.slot = slotIdx;
                        renderCalendario();
                    }
                }
            };
            
            cell.onclick = () => openEventoModal(diaAbsoluto, slotIdx);
            grid.appendChild(cell);
        });
    });
}

function openEventoModal(dayIdx, slotIdx) {
    eventoEnEdicion = null;
    document.getElementById('evento-dia-idx').value = dayIdx;
    document.getElementById('evento-slot-idx').value = slotIdx;
    document.getElementById('modal-agregar-evento').classList.add('active');
    
    const selectActHoraFin = document.getElementById('actividad-hora-fin');
    const selectHospCheckOut = document.getElementById('hospedaje-checkout-hora');
    
    selectActHoraFin.innerHTML = '';
    selectHospCheckOut.innerHTML = '';
    
    INTERVALOS_HORARIOS.forEach((h, idx) => {
        if (idx > slotIdx) {
            let opt1 = document.createElement('option');
            opt1.value = idx; opt1.innerText = h;
            selectActHoraFin.appendChild(opt1);
        }
        let opt2 = document.createElement('option');
        opt2.value = idx; opt2.innerText = h;
        selectHospCheckOut.appendChild(opt2);
    });
    
    onEventoTipoChange();
}

function abrirEdicionEvento(index) {
    eventoEnEdicion = index;
    const ev = aventuraEventos[index];
    
    document.getElementById('evento-dia-idx').value = ev.day;
    document.getElementById('evento-slot-idx').value = ev.slot;
    
    const selectTipo = document.getElementById('select-evento-tipo');
    let tipoForm = ev.tipo;
    if (ev.tipo.includes('viaje')) tipoForm = 'viaje-salida';
    if (ev.tipo.includes('hospedaje')) tipoForm = 'hospedaje';
    
    selectTipo.value = tipoForm;
    onEventoTipoChange();
    
    const selectActHoraFin = document.getElementById('actividad-hora-fin');
    const selectHospCheckOut = document.getElementById('hospedaje-checkout-hora');
    selectActHoraFin.innerHTML = '';
    selectHospCheckOut.innerHTML = '';
    
    INTERVALOS_HORARIOS.forEach((h, idx) => {
        if (idx > ev.slot) {
            let opt1 = document.createElement('option'); opt1.value = idx; opt1.innerText = h;
            selectActHoraFin.appendChild(opt1);
        }
        let opt2 = document.createElement('option'); opt2.value = idx; opt2.innerText = h;
        selectHospCheckOut.appendChild(opt2);
    });
    
    document.getElementById('modal-agregar-evento').classList.add('active');
}

function onEventoTipoChange() {
    const tipo = document.getElementById('select-evento-tipo').value;
    document.querySelectorAll('.evento-subform').forEach(f => f.style.display = 'none');
    
    if (tipo === 'viaje-salida') {
        document.getElementById('form-viaje-salida').style.display = 'block';
    } else if (tipo === 'actividad') {
        document.getElementById('form-actividad').style.display = 'block';
    } else if (tipo === 'restaurante') {
        document.getElementById('form-restaurante').style.display = 'block';
    } else if (tipo === 'hospedaje') {
        document.getElementById('form-hospedaje').style.display = 'block';
    }
}
function closeEventoModal() {
    const modal = document.getElementById('modal-agregar-evento');
    if (modal) {
        modal.classList.remove('active');
    }
    eventoEnEdicion = null; // Limpiamos la variable al cerrar
}
function guardarEvento() {
    if (eventoEnEdicion !== null) {
        aventuraEventos.splice(eventoEnEdicion, 1);
        eventoEnEdicion = null;
    }
    
    const dayIdx = parseInt(document.getElementById('evento-dia-idx').value);
    const slotIdx = parseInt(document.getElementById('evento-slot-idx').value);
    const tipo = document.getElementById('select-evento-tipo').value;
    
    if (tipo === 'viaje-salida') {
        const origen = document.getElementById('viaje-origen').value.trim() || "Origen";
        const destino = document.getElementById('viaje-destino').value.trim() || "Destino";
        const duracionHoras = parseFloat(document.getElementById('viaje-duracion').value) || 2;
        
        const durationSlots = Math.max(1, Math.round(duracionHoras * 2));
        
        aventuraEventos.push({
            tipo: 'viaje-salida',
            texto: `✈️ Salida: ${origen} ➔ ${destino}`,
            day: dayIdx,
            slot: slotIdx,
            durationSlots: durationSlots
        });
        
        let totalSlotsLlegada = dayIdx * INTERVALOS_HORARIOS.length + slotIdx + durationSlots;
        let llegadaDayIdx = Math.floor(totalSlotsLlegada / INTERVALOS_HORARIOS.length);
        let llegadaSlotIdx = totalSlotsLlegada % INTERVALOS_HORARIOS.length;
        
        if(llegadaDayIdx < (MAX_SEMANAS * 7)) {
            aventuraEventos.push({
                tipo: 'viaje-llegada',
                texto: `🛬 Llegada: ${destino}`,
                day: llegadaDayIdx,
                slot: llegadaSlotIdx,
                durationSlots: 1
            });
        }
        
    } else if (tipo === 'actividad') {
        const nombre = document.getElementById('actividad-nombre').value.trim() || "Actividad";
        const slotFin = parseInt(document.getElementById('actividad-hora-fin').value);
        
        const durationSlots = Math.max(1, slotFin - slotIdx);
        
        aventuraEventos.push({
            tipo: 'actividad',
            texto: `🗺️ ${nombre}`,
            day: dayIdx,
            slot: slotIdx,
            durationSlots: durationSlots
        });
        
    } else if (tipo === 'restaurante') {
        const nombre = document.getElementById('restaurante-nombre').value.trim() || "Restaurante";
        const momento = document.getElementById('restaurante-momento').value;
        
        aventuraEventos.push({
            tipo: 'restaurante',
            texto: `🍔 ${momento}: ${nombre}`,
            day: dayIdx,
            slot: slotIdx,
            durationSlots: 4
        });
        
    } else if (tipo === 'hospedaje') {
        const nombre = document.getElementById('hospedaje-nombre').value.trim() || "Hotel";
        const noches = parseInt(document.getElementById('hospedaje-noches').value) || 1;
        const parsedSlot = parseInt(document.getElementById('hospedaje-checkout-hora').value);
        const slotCheckOut = isNaN(parsedSlot) ? 10 : parsedSlot;
        
        aventuraEventos.push({
            tipo: 'hospedaje-checkin',
            texto: `🏨 Check-in: ${nombre}`,
            day: dayIdx,
            slot: slotIdx,
            durationSlots: 1
        });
        
        let checkoutDayIdx = dayIdx + noches;
        
        if(checkoutDayIdx < (MAX_SEMANAS * 7)) {
            aventuraEventos.push({
                tipo: 'hospedaje-checkout',
                texto: `🔑 Check-out: ${nombre}`,
                day: checkoutDayIdx,
                slot: slotCheckOut,
                durationSlots: 1
            });
        }
    }
    
    
    renderCalendario();
    closeEventoModal();
}
function guardarAventuraJson() {
    if (!aventuraActiva || aventuraEventos.length === 0) return alert("No hay datos en la aventura para guardar.");
    const exportData = {
        aventura: aventuraActiva,
        eventos: aventuraEventos
    };
    const nombreArchivo = aventuraActiva.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_") + "_plan.json";
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", nombreArchivo);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    
    if (!aventurasGuardadas.some(a => a.aventura.titulo === aventuraActiva.titulo)) {
        aventurasGuardadas.push(exportData);
        renderAventurasGuardadas();
    }
    alert("Aventura guardada y descargada exitosamente.");
}


function renderAventurasGuardadas() {
    const grid = document.getElementById('suenos-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    aventurasGuardadas.forEach(data => {
        const nombreNormalizado = data.aventura.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
        const portadaPath = `portadas/${nombreNormalizado}.jpg`;
        
        const card = createCard(data.aventura.titulo, portadaPath, () => {
            aventuraActiva = data.aventura;
            aventuraEventos = data.eventos;
            semanaActual = 0;
            abrirCalendarioSuenos();
            renderCalendario();
        });
        grid.appendChild(card);
    });
}
window.onload = () => {
    loadData();
    initMap();
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};
// --- LÓGICA DE D3.JS Y MAPA INTERACTIVO ---
let mapNivelActual = 'mundo'; 
let paisContexto = null;
let regionContexto = null;
let currentGeoJsonMundo = null;

const width = 900;
const height = 500;
const svgMap = d3.select("#mapa-svg");
const gMap = d3.select("#mapa-grupo");

// Proyección mundial inicial
const projection = d3.geoMercator().scale(140).translate([width / 2, height / 1.6]);
const pathGenerator = d3.geoPath().projection(projection);

// Zoom y Paneo
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        gMap.attr("transform", event.transform);
    });
svgMap.call(zoom);

async function initMap() {
    try {
        // Obtenemos un GeoJSON público del mundo
        const response = await fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
        currentGeoJsonMundo = await response.json();
        renderizarMundo();
    } catch (error) {
        console.error("Error cargando el mapa mundial:", error);
    }
}

function renderizarMundo() {
    mapNivelActual = 'mundo';
    document.getElementById('btn-volver-mundo').style.display = 'none';
    cerrarMenuContextual();
    
    // Transición suave de reseteo de zoom
    svgMap.transition().duration(750).call(zoom.transform, d3.zoomIdentity);

    // Limpiar mapa previo
    gMap.selectAll("*").remove();

    // Dibujar países
    gMap.selectAll("path")
        .data(currentGeoJsonMundo.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("class", d => {
            let className = "pais";
            // Aquí puedes conectar con dataVisitados
            const nombre = d.properties.name;
            const visitado = dataVisitados.some(p => p.nombre.toLowerCase() === nombre.toLowerCase());
            if (visitado) className += " visitado";
            return className;
        })
        .on("mouseover", mostrarTooltip)
        .on("mousemove", moverTooltip)
        .on("mouseout", ocultarTooltip)
        .on("click", clickEnRegion);
}

function mostrarTooltip(event, d) {
    const tooltip = d3.select("#tooltip");
    tooltip.style("opacity", 1)
           .html(d.properties.name || d.properties.NAME_1); // Soporte para mundo y provincias
}

function moverTooltip(event) {
    const tooltip = d3.select("#tooltip");
    const container = document.getElementById('world-map');
    const containerRect = container.getBoundingClientRect();
    const containerCoords = d3.pointer(event, container);
    
    let left = containerCoords[0];
    let top = containerCoords[1] - 15;
    
    const tooltipNode = tooltip.node();
    const tooltipWidth = tooltipNode.offsetWidth || 140;
    const tooltipHeight = tooltipNode.offsetHeight || 45;
    
    if (left - tooltipWidth / 2 < 15) {
        left = tooltipWidth / 2 + 15;
    } else if (left + tooltipWidth / 2 > containerRect.width - 15) {
        left = containerRect.width - tooltipWidth / 2 - 15;
    }
    
    if (top - tooltipHeight < 15) {
        top = containerCoords[1] + 25;
        tooltip.style("transform", "translate(-50%, 0%)");
    } else {
        tooltip.style("transform", "translate(-50%, -100%)");
    }
    
    tooltip.style("left", left + "px")
           .style("top", top + "px");
}

function ocultarTooltip() {
    d3.select("#tooltip").style("opacity", 0);
}

function clickEnRegion(event, d) {
    event.stopPropagation();
    const containerCoords = d3.pointer(event, document.getElementById('world-map'));
    const nombreRegion = d.properties.name || d.properties.NAME_1;
    
    if (mapNivelActual === 'mundo') {
        paisContexto = d;
        regionContexto = null;
        document.getElementById('opcion-explorar').style.display = 'block';
    } else {
        regionContexto = d;
        document.getElementById('opcion-explorar').style.display = 'none';
    }

    document.getElementById('menu-titulo').innerText = nombreRegion;
    
    const menu = d3.select("#menu-contextual");
    const containerRect = document.getElementById('world-map').getBoundingClientRect();
    
    menu.style("display", "block")
        .style("left", function() {
            let menuWidth = 220; 
            let leftPos = containerCoords[0] + 15;
            if (leftPos + menuWidth > containerRect.width) {
                return (containerCoords[0] - menuWidth - 15) + "px";
            }
            return leftPos + "px";
        })
        .style("top", function() {
            let menuHeight = 180; 
            let topPos = containerCoords[1] + 15;
            if (topPos + menuHeight > containerRect.height) {
                return (containerCoords[1] - menuHeight - 15) + "px";
            }
            return topPos + "px";
        });
}

function cerrarMenuContextual() {
    d3.select("#menu-contextual").style("display", "none");
}

// Ocultar menú al hacer clic fuera del mapa
d3.select("#world-map").on("click", cerrarMenuContextual);

async function explorarRegionMap() {
    cerrarMenuContextual();
    if (!paisContexto) return;
    
    const nombrePais = paisContexto.properties.name;
    const idPais = paisContexto.id;
    
    try {
        const response = await fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson");
        if (!response.ok) throw new Error("GeoJSON global no encontrado");
        
        const dataGlobal = await response.json();
        
        const provinciasDelPais = dataGlobal.features.filter(
            feature => feature.properties.adm0_a3 === idPais || feature.properties.admin === nombrePais
        );
        
        if (provinciasDelPais.length === 0) {
            throw new Error("No se encontraron provincias para este país en el GeoJSON");
        }

        const dataProvincias = {
            type: "FeatureCollection",
            features: provinciasDelPais
        };
        
        renderizarProvincias(dataProvincias, paisContexto);
        
    } catch (error) {
        console.warn(`No se pudo cargar el mapa detallado para ${nombrePais}. Usando provincias de simulación para pruebas.`, error);
        
        const mockGeoJson = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: { NAME_1: `${paisContexto.properties.name} (Zona Norte)` },
                    geometry: paisContexto.geometry
                },
                {
                    type: "Feature",
                    properties: { NAME_1: `${paisContexto.properties.name} (Zona Sur)` },
                    geometry: paisContexto.geometry
                }
            ]
        };
        
        renderizarProvincias(mockGeoJson, paisContexto);
    }
}

function renderizarProvincias(geoJsonProvincias, featurePais) {
    mapNivelActual = 'provincia';
    document.getElementById('btn-volver-mundo').style.display = 'inline-block';
    
    // Enfocar el mapa en el país seleccionado
    let bounds = pathGenerator.bounds(featurePais);
    let dx = bounds[1][0] - bounds[0][0];
    let dy = bounds[1][1] - bounds[0][1];
    let x = (bounds[0][0] + bounds[1][0]) / 2;
    let y = (bounds[0][1] + bounds[1][1]) / 2;
    let scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));

    const nombrePais = featurePais.properties.name ? featurePais.properties.name.toLowerCase() : "";
    if (nombrePais === "usa" || nombrePais === "united states" || nombrePais === "united states of america") {
        x = 212;
        y = 220;
        scale = 4.5;
    } else if (nombrePais === "russia" || nombrePais === "russian federation") {
        x = 694;
        y = 135;
        scale = 2.0;
    } else if (nombrePais === "france") {
        x = 456;
        y = 195;
        scale = 7.0;
    }

    let translate = [width / 2 - scale * x, height / 2 - scale * y];
    svgMap.transition().duration(750).call(
        zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );

    // Renderizar Provincias
    gMap.selectAll("*").remove();
    gMap.selectAll("path")
        .data(geoJsonProvincias.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator)
        .attr("class", d => {
            const nombreProv = d.properties.NAME_1 || d.properties.name;
            if (paisContexto && nombreProv) {
                const paisEncontrado = dataVisitados.find(p => p.nombre.toLowerCase() === paisContexto.properties.name.toLowerCase());
                if (paisEncontrado) {
                    const visitada = paisEncontrado.ciudades.some(c => c.nombre.toLowerCase() === nombreProv.toLowerCase());
                    if (visitada) return "provincia visitado";
                }
            }
            return "provincia";
        })
        .on("mouseover", mostrarTooltip)
        .on("mousemove", moverTooltip)
        .on("mouseout", ocultarTooltip)
        .on("click", clickEnRegion);
}

function volverAlMundo() {
    renderizarMundo();
}

// Hooks de Integración (Callbacks para tu app)
function verRecuerdosMap() {
    cerrarMenuContextual();
    
    if (mapNivelActual === 'mundo' && paisContexto) {
        const nombrePaisMap = paisContexto.properties.name.toLowerCase();
        const paisEncontrado = dataVisitados.find(p => p.nombre.toLowerCase() === nombrePaisMap);
        
        if (paisEncontrado) {
            switchScreen('recuerdos');
            selectCountry(paisEncontrado);
        } else {
            alert("Aún no tienes recuerdos registrados en este país.");
        }
    } else if (mapNivelActual === 'provincia' && regionContexto && paisContexto) {
        const nombrePaisMap = paisContexto.properties.name.toLowerCase();
        const nombreCiudadMap = (regionContexto.properties.NAME_1 || regionContexto.properties.name).toLowerCase();
        
        const paisEncontrado = dataVisitados.find(p => p.nombre.toLowerCase() === nombrePaisMap);
        
        if (paisEncontrado && paisEncontrado.ciudades) {
            const ciudadEncontrada = paisEncontrado.ciudades.find(c => c.nombre.toLowerCase() === nombreCiudadMap);
            if (ciudadEncontrada) {
                switchScreen('recuerdos');
                currentCountry = paisEncontrado; 
                selectCity(ciudadEncontrada);
            } else {
                alert("Aún no tienes recuerdos registrados en esta ciudad o provincia.");
            }
        } else {
            alert("Aún no tienes recuerdos registrados en esta región.");
        }
    }
}
function crearRecuerdoMap() {
    cerrarMenuContextual();
    if (!paisContexto) return;

    switchScreen('recuerdos');

    let paisEncontrado = dataVisitados.find(p => p.nombre.toLowerCase() === paisContexto.properties.name.toLowerCase());
    if (!paisEncontrado) {
        const nombreNormalizado = paisContexto.properties.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
        paisEncontrado = { nombre: paisContexto.properties.name, portada: `portadas/${nombreNormalizado}.jpg`, ciudades: [] };
        dataVisitados.push(paisEncontrado);
    }

    if (mapNivelActual === 'mundo' || !regionContexto) {
        selectCountry(paisEncontrado);
        openCityModal();
    } else {
        const nombreCiudad = regionContexto.properties.NAME_1 || regionContexto.properties.name;
        let ciudadEncontrada = paisEncontrado.ciudades.find(c => c.nombre.toLowerCase() === nombreCiudad.toLowerCase());
        if (!ciudadEncontrada) {
            const nombreNormalizado = nombreCiudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
            ciudadEncontrada = { nombre: nombreCiudad, portada: `portadas/${nombreNormalizado}.jpg`, albumes: [] };
            paisEncontrado.ciudades.push(ciudadEncontrada);
        }
        selectCountry(paisEncontrado);
        selectCity(ciudadEncontrada);
        openAlbumModal();
    }
}

function planificarAventuraMap() {
    cerrarMenuContextual();
    
    const paisRaw = paisContexto.properties.name;
    const paisObj = todosLosPaises.find(p => p.en.toLowerCase() === paisRaw.toLowerCase() || p.es.toLowerCase() === paisRaw.toLowerCase());
    const paisEsp = paisObj ? paisObj.es : paisRaw;
    
    switchScreen('pantalla2');
    
    if (!regionContexto) {
        openAventuraModal();
        const selectPais = document.getElementById('select-suenos-pais') || document.getElementById('select-su सपनों-pais');
        if (selectPais) {
            selectPais.value = paisEsp;
            onAventuraPaisChange();
        }
    } else {
        const ciudad = regionContexto.properties.NAME_1 || regionContexto.properties.name;
        
        aventuraActiva = {
            pais: paisEsp,
            ciudad: ciudad,
            titulo: ciudad
        };
        
        aventuraEventos = [];
        semanaActual = 0;
        
        abrirCalendarioSuenos();
        renderCalendario();
    }
    
}