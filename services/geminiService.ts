
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import { NewsItem } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: "Chile alcanza récord de participación de energías renovables en matriz eléctrica",
    url: "https://www.energia.gob.cl",
    source: "energia.gob.cl",
    thumbnail: "https://images.unsplash.com/photo-1509391366360-fe5bb4489a93?q=80&w=400&auto=format&fit=crop",
    date: "Hace 2 horas"
  },
  {
    title: "Nuevos proyectos de almacenamiento BESS impulsan estabilidad del sistema",
    url: "https://www.revistaei.cl",
    source: "revistaei.cl",
    thumbnail: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=400&auto=format&fit=crop",
    date: "Hace 5 horas"
  },
  {
    title: "Avances en infraestructura de transmisión para conectar zonas remotas",
    url: "https://www.coordinador.cl",
    source: "coordinador.cl",
    thumbnail: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=400&auto=format&fit=crop",
    date: "Ayer"
  },
  {
    title: "Digitalización en plantas solares mejora eficiencia operativa en un 15%",
    url: "https://www.generadoras.cl",
    source: "generadoras.cl",
    thumbnail: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400&auto=format&fit=crop",
    date: "Hace 1 día"
  },
  {
    title: "Tendencias globales en energía eólica marina y su potencial en Chile",
    url: "https://www.acera.cl",
    source: "acera.cl",
    thumbnail: "https://images.unsplash.com/photo-1466611653046-2f52075b0511?q=80&w=400&auto=format&fit=crop",
    date: "Hace 2 días"
  }
];

export const getEnergyNews = async (): Promise<NewsItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: "Busca las últimas 5 noticias relevantes sobre el sector eléctrico: plantas de energía renovable (solar, eólica), sistemas de almacenamiento de energía por batería (BESS), infraestructura de transmisión y cómo la tecnología digital optimiza estas plantas. Enfócate en noticias de Chile y el mercado global de energía." }]
        }
      ],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      return chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any, index: number) => {
          const title = chunk.web.title || "Noticia del Sector Energía";
          const url = chunk.web.uri;
          const source = new URL(url).hostname.replace('www.', '');

          // IDs de fotos de Unsplash verificados para evitar enlaces rotos
          // 1. Solar, 2. Wind, 3. Grid, 4. Energy Storage/Battery, 5. Control Center
          const energyPhotoIds = [
            'photo-1509391366360-fe5bb4489a93',
            'photo-1466611653046-2f52075b0511',
            'photo-1473341304170-971dccb5ac1e',
            'photo-1593941707882-a5bba14938c7',
            'photo-1581092160562-40aa08e78837'
          ];

          const photoId = energyPhotoIds[index % energyPhotoIds.length];
          const thumbnail = `https://images.unsplash.com/${photoId}?q=80&w=400&auto=format&fit=crop`;

          return {
            title,
            url,
            source,
            thumbnail,
            date: 'Hoy'
          };
        })
        .slice(0, 5);
    }
    return [];
  } catch (error) {
    console.warn("⚠️ Falling back to sample news due to API error:", error);
    return FALLBACK_NEWS;
  }
};

export const getLibraryDocuments = async () => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('metadata');

    if (error) throw error;

    const documentMap = new Map();
    const folderSet = new Set<string>();

    data.forEach((doc: any) => {
      const source = doc.metadata?.source || 'Desconocido';
      const folder = doc.metadata?.folder || 'Otros';
      folderSet.add(folder);

      if (!documentMap.has(source)) {
        documentMap.set(source, {
          name: source,
          folder: folder,
          segments: 0,
          type: source.split('.').pop()?.toUpperCase() || 'FILE'
        });
      }
      documentMap.get(source).segments++;
    });

    return {
      documents: Array.from(documentMap.values()),
      folders: Array.from(folderSet)
    };
  } catch (error) {
    console.error("Error fetching library documents:", error);
    return { documents: [], folders: [] };
  }
};

const searchDocuments = async (query: string) => {

  try {
    // 1. Generate embedding for query
    const embeddingResponse: any = await ai.models.embedContent({
      model: "models/gemini-embedding-001",
      contents: [
        {
          parts: [{ text: query }]
        }
      ]
    });



    const queryEmbedding = embeddingResponse.embedding?.values || embeddingResponse.embeddings?.[0]?.values;

    if (!queryEmbedding) {
      console.warn("Could not generate embedding for query");
      return [];
    }

    // 2. Search in Supabase
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, // Lower threshold for more results
      match_count: 10 // Increase count for better context coverage
    });


    if (error) {
      console.error("Supabase vector search error:", error);
      return [];
    }

    return documents;
  } catch (error) {
    console.error("Error searching documents:", error);
    return [];
  }
};

export const queryRAG = async (query: string, history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
  try {
    // 1. Retrieve Context
    const contextDocs = await searchDocuments(query);
    let contextText = "";

    if (contextDocs && contextDocs.length > 0) {
      contextText = contextDocs.map((doc: any) =>
        `[Fuente: ${doc.metadata.source}]\n${doc.content}`
      ).join("\n\n");
    }

    // 2. Build System Prompt with Context
    const systemPrompt = `Eres Enlasa-AI, el asistente inteligente de Enlasa.
    
    Tienes acceso a una BASE DE CONOCIMIENTOS (BIBLIOTECA) con documentos internos.
    Usa la siguiente información para responder a la pregunta del usuario.
    Si la respuesta se encuentra en el contexto, CITA el nombre del documento fuente.
    Si la respuesta NO está en el contexto, di "No encuentro información sobre eso en mis documentos internos" y luego intenta responder con tu conocimiento general pero aclarando que no es información oficial.
    
    CONTEXTO RECUPERADO:
    ${contextText}
    
    ---
    Fin del Contexto.
    Responde de forma profesional, moderna y eficiente.`;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const response = await chat.sendMessage({ message: query });
    return response.text || "Lo siento, no pude procesar tu consulta.";
  } catch (error) {
    console.error("Error in RAG query:", error);
    return "Ocurrió un error al consultar a la IA.";
  }
};
