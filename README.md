# VCM2
Un album de recuerdos

## Cómo ejecutar
1. Desde la raíz del repositorio (`/workspace/VCM2`), levanta un servidor estático.
   - Opción Python: `python3 -m http.server 8000`
   - Opción VSCode: Live Server apuntando a la raíz del repo.
2. Abre la app en el navegador con `http://localhost:8000/index.html` (ajusta el puerto si usas otro).
3. **No uses `file://` ni abras `index.html` con doble clic**, porque las peticiones a recursos como `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson` pueden fallar por políticas del navegador.
4. Verifica en DevTools > Network que `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson` responde `200`.

## Solución de problemas de consola
- **`Failed to load resource: the server responded with a status of 404 ()`**
  - Significa que el navegador está pidiendo un archivo que no existe en la ruta actual.
  - En este repo, el CSS principal es `styles.css`. Si en DevTools aparece `tailwind.css`, revisa que no estés usando una versión vieja en caché y recarga con hard refresh (`Ctrl+F5` / `Cmd+Shift+R`).
- **`You are using the in-browser Babel transformer...`**
  - Es una advertencia de Babel Standalone (normalmente cuando existe un `<script type="text/babel">`).
  - Esta app está preparada para correr con `script.js` directo; no necesita Babel en navegador para producción.
  - Si aparece esa advertencia, verifica extensiones del navegador o una copia antigua de `index.html`.
