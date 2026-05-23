# Guía para publicar Tragalero en Google Play Store (TWA)

He agregado los archivos necesarios para convertir tu sitio web en una App de Android usando la tecnología **Trusted Web Activity (TWA)**, que es el estándar recomendado por Google para PWAs en su tienda.

## Archivos Creados:

1.  **`docs/.well-known/assetlinks.json`**:
    *   Este archivo establece la confianza entre tu sitio web (`tragalero.com`) y tu aplicación de Android.
    *   **Acción requerida**: Debes editar este archivo y reemplazar:
        *   `YOUR_PACKAGE_NAME`: El ID de tu paquete (ej. `com.tragalero.app`).
        *   `YOUR_SHA256_FINGERPRINT`: La huella digital SHA-256 de tu certificado de firma (lo obtienes en la consola de Google Play).

2.  **`twa-manifest.json`**:
    *   Es el archivo de configuración para `bubblewrap`, la herramienta oficial de Google para generar el archivo de la tienda.
    *   Contiene la configuración de colores, íconos y URL de inicio (`/app.html`).

## Pasos para generar la App (.aab o .apk):

Si tienes Node.js instalado, puedes seguir estos pasos:

1.  **Instalar la herramienta de Google**:
    ```bash
    npm install -g @bubblewrap/cli
    ```

2.  **Inicializar el proyecto (opcional si usas el twa-manifest.json)**:
    ```bash
    bubblewrap init --twaManifest=twa-manifest.json
    ```

3.  **Compilar la App**:
    ```bash
    bubblewrap build
    ```
    Esto generará un archivo `.aab` que es el que subes directamente a la Google Play Console.

## Notas sobre PWA:
*   Ya tienes un `manifest.json` y `sw.js` en la carpeta `docs/`.
*   Asegúrate de que el ícono que uses en la tienda sea de **512x512 píxeles** y cuadrado para que Google Play no lo rechace.
*   El Service Worker actual es básico pero cumple con los requisitos de instalación.

---
**Nota:** No he modificado ninguno de tus archivos existentes para respetar tu solicitud.
