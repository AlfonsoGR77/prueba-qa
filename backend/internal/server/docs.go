package server

import (
	"net/http"

	"energyai/docs"
)

// swaggerUIVersion fija la versión de Swagger UI que se carga desde el CDN.
// La 5.x es la que entiende OpenAPI 3.1.
const swaggerUIVersion = "5.17.14"

// docsPage es la página de Swagger UI: sin la barra superior, con el token recordado entre recargas y con los
// endpoints colapsados.
const docsPage = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EnergIA API</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@` + swaggerUIVersion + `/swagger-ui.css">
  <style>.swagger-ui .topbar { display: none } body { margin: 0 }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@` + swaggerUIVersion + `/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: "/docs/openapi.json",
      dom_id: "#swagger-ui",
      persistAuthorization: true,
      docExpansion: "none",
      filter: true,
      tryItOutEnabled: true,
      displayRequestDuration: true
    });
  </script>
</body>
</html>`

// serveDocsPage responde la página de Swagger UI.
func serveDocsPage(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(docsPage))
}

// serveOpenAPI responde el spec OpenAPI generado por swag.
func serveOpenAPI(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_, _ = w.Write([]byte(docs.SwaggerInfo.ReadDoc()))
}

// redirectToDocs manda las rutas viejas (/swagger/...) a /docs.
func redirectToDocs(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/docs", http.StatusMovedPermanently)
}
