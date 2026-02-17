---
name: gemini-rag-expert
description: Especialista en implementación de RAG con Google Gemini, enfocado en persistencia de UI, sincronización robusta y prompts inteligentes.
---

# Gemini RAG Expert Skill

Este skill recopila las mejores prácticas aprendidas durante el desarrollo del Enlasa HR Intelligence Hub para implementar sistemas de RAG (Retrieval-Augmented Generation) modernos y resilientes.

## 🏗️ Arquitectura de Datos

### Base de Datos Vectorial
- **Engine**: Supabase con la extensión `pgvector`.
- **Dimensiones**: 3072 para el modelo `text-embedding-004` o 768 para `gemini-embedding-001`.
- **Sync**: Siempre usar lógica de `batch` (paginación) para recuperar metadatos si la biblioteca supera los 1000 fragmentos.

### Ingesta de Documentos
- **Formatos**: PDF (`pdf-parse`), DOCX (`mammoth`), y XLSX (`xlsx`).
- **Spreadsheets**: Extraer cada fila como un fragmento independiente incluyendo los encabezados de columna para mantener el contexto semántico.
- **Limpieza**: Ofrecer siempre un script `clean-db.ts` para truncar tablas antes de re-sincronizaciones masivas.

## 🤖 Inteligencia Artificial (Gemini)

### Selección de Modelos
- **Primario**: `gemini-3-flash-preview` para máxima velocidad y capacidades de razonamiento actualizadas.
- **Embedding**: `gemini-embedding-001` (estable y eficiente).

### Prompt Engineering
- **Conciencia Temporal**: Inyectar siempre la fecha y hora local del usuario en el `System Prompt` para que la IA entienda conceptos como "hoy", "mañana" o "procedimientos vencidos".
- **Formateo**: Instruir explícitamente el uso de **Tablas Markdown** para datos numéricos o comparativos.
- **Citas**: Obligar a la IA a citar el nombre del archivo fuente contenido en el metadato del contexto.

## 🎨 Interfaz y Persistencia (React)

### Persistencia del Chat
- **Lift State**: No guardar el historial del chat dentro del componente `AIChat`. Moverlo al estado raíz (`App.tsx`) para que la conversación no se pierda al navegar por el dashboard.
- **Props**: Pasar `messages` y `setMessages` como props al componente de chat.

### Renderizado de Texto
- **Markdown**: Usar `react-markdown`.
- **Tablas**: Instalar y configurar `remark-gfm` como plugin de `react-markdown`.
- **Estilos**: Añadir CSS global para `.markdown-body table` (bordes, padding, colores de cabecera) para asegurar legibilidad.

### Estados de Carga
- Usar **Skeletons** o animaciones de pulso para widgets alimentados por IA mientras se espera la respuesta (especialmente para noticias y listas de cumpleaños).

## 🚀 Despliegue y Git
- Commits descriptivos que separen infraestructura (Sync) de UI (Persistencia).
- Scripts de verificación (`check-sources.ts`) para auditar la salud de la base de datos sin entrar a la consola de Supabase.
