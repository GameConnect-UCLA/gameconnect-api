# Instrucciones de Desarrollo: Módulos `Meili` y `Search` (Explorer)

Este documento contiene las especificaciones y directrices de arquitectura para implementar el sistema de búsqueda global y el módulo de exploración utilizando **Meilisearch** y **Prisma** en el proyecto GameConnect.

---

## 🏗️ 1. Arquitectura General y Roles

El sistema se dividirá en dos módulos independientes para respetar el principio de Responsabilidad Única (SRP):

1. **`MeiliModule` (Capa de Infraestructura):** Se encarga exclusivamente de la conexión de bajo nivel con el contenedor de Docker (`gameconnect_search`), la gestión de credenciales y la exposición del cliente nativo. No maneja lógica de negocio.
2. **`SearchModule` (Capa de Dominio/Negocio):** Orquesta la lógica del buscador ("Explorer"), maneja los filtros, las reglas de ordenamiento por relevancia/prioridad, y se encarga de formatear las respuestas para el frontend.

---

## 🛠️ 2. Especificaciones de Implementación

Paso 2: Creación del Módulo Global MeiliModule
Genera un módulo global en src/modules/meili/ que exponga el servicio de conexión:

meili.service.ts:

Inicializa la clase MeiliSearch de la librería oficial meilisearch.

Utiliza las variables de entorno MEILI_URL y MEILI_MASTER_KEY.

Implementa OnModuleInit para verificar la conexión con client.health().

Expone un método getClient() que devuelva la instancia activa.

meili.module.ts: Debe estar decorado con @Global() y exportar el MeiliService.

Paso 3: Creación del SearchModule (Explorer)
Genera el módulo en src/modules/search/ para controlar la lógica del negocio de búsqueda. Debe importar MeiliModule y tu módulo de Prisma.

A. Configuración del Índice Único (SearchService)
En el método onModuleInit() de tu SearchService, debes obtener el índice llamado 'explorer' y configurar los siguientes ajustes obligatorios mediante updateSettings():

Atributos Filtrables (filterableAttributes): ['type', 'hashtags']

Atributos Buscables (searchableAttributes): ['title', 'content', 'searchableText']

Reglas de Desempate y Ranking (rankingRules):
Aplica el siguiente orden estricto de prioridades para que el buscador devuelva primero los posts, luego los perfiles de videojuegos y al final los usuarios en la búsqueda global sin filtros:

[
  'words',
  'typo',
  'attribute',
  'rankingScore:desc', // 🚨 Criterio de desempate personalizado
  'exactness'
]

B. Estructura de Documentos del Índice explorer
Cuando se indexe información, los documentos JSON guardados en Meilisearch deben tener un campo común rankingScore asignado según su tipo:

Posts: rankingScore: 3

Juegos (Perfiles): rankingScore: 2

Usuarios: rankingScore: 1

C. Controladores y Endpoints (SearchController)
Crea un endpoint GET /search (o dentro del contexto del explorer) que reciba dos parámetros opcionales por Query Params (q para el texto de búsqueda, y type para el filtro de pestaña):

Búsqueda Global (Sin filtros): Si viene q pero no viene type, consulta el índice 'explorer' trayendo todos los registros que coincidan, ordenados automáticamente por el rankingScore descendente.

Búsqueda Con Filtro Activo: Si el usuario selecciona una pestaña (ej: usuarios), aplica un filtro nativo de Meilisearch: filter: ['type = user'].

🔄 3. Estrategia de Sincronización de Datos
El agente debe preparar dos métodos clave para la consistencia de datos:

Sincronización Inicial (Bulk/Seed): Un método dentro de SearchService (ej: syncLocalDatabase()) que pueda ser llamado para leer todos los registros actuales de User, Game y Post desde PostgreSQL usando Prisma, transformarlos al esquema plano del índice explorer e inyectarlos de golpe en Meilisearch.

Sincronización en Tiempo Real: El diseño debe prever hooks, interceptores o llamadas directas desde los servicios de creación, edición y eliminación de posts, usuarios y juegos para replicar el cambio inmediatamente en Meilisearch.

Estructura de datos del documento JSON en Meilisearch
Todos los documentos indexados en el índice explorer deben seguir esta estructura base:
{
  "id": "<id_interno_bd>", // ID único de la entidad (UUID o Serial)
  "type": "<tipo_entidad>", // "post", "game" o "user"
  "rankingScore": <numero>, // 3 para posts, 2 para juegos, 1 para usuarios
  
  // Campos específicos para Posts
  "title": "<titulo_del_post>",
  "content": "<cuerpo_del_post>", // Texto completo (puede ser largo)
  "searchableText": "<combinación_optimizada>", // Ej: "Título + contenido abreviado + hashtags"
  "hashtags": ["javascript", "nodejs"], // Array de strings
  // aqui se deberian tomar otros campos como el de las imagenes
  
  // Campos específicos para Juegos (Perfiles)
  "name": "<nombre_del_juego>",
  "metadata": {
    "description": "<descripcion_del_juego>",
    "coverImage": "<url_portada>"
  },
  "score": <numero>,
  
  // Campos específicos para Usuarios
  "username": "<nombre_usuario>",
  "displayName": "<nombre_display>",
  "bio": "<descripcion_usuario>",
  "profilePic": "<url_imagen>",
  "verified": true
}