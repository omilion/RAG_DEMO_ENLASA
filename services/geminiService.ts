
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
      model: "gemini-1.5-flash", // Use 1.5 flash for faster reliable JSON
      contents: [
        {
          role: "user",
          parts: [{ text: "Busca las últimas 5 noticias más relevantes (de hoy o ayer) sobre el sector eléctrico y energía en Chile y el mundo. Incluye: plantas renovables, BESS, transmisión y tecnología digital. \n\nDevuelve la información estrictamente como un array JSON válido facilitando estos campos: title, url, source, excerpt (resumen de 2 líneas), date." }]
        }
      ],
      config: {
        tools: [{ googleSearch: {} }],
      } as any,
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = responseText.match(/\[.*\]/s);

    if (jsonMatch) {
      const newsData = JSON.parse(jsonMatch[0]);

      return newsData.map((item: any, index: number) => {
        const energyPhotoIds = [
          'photo-1509391366360-fe5bb4489a93',
          'photo-1466611653046-2f52075b0511',
          'photo-1473341304170-971dccb5ac1e',
          'photo-1593941707882-a5bba14938c7',
          'photo-1581092160562-40aa08e78837'
        ];
        const photoId = energyPhotoIds[index % energyPhotoIds.length];

        return {
          ...item,
          thumbnail: `https://images.unsplash.com/${photoId}?q=80&w=400&auto=format&fit=crop`
        };
      }).slice(0, 5);
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

export const getUpcomingBirthdays = async () => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('content')
      .eq('metadata->>source', 'cumpleanos_50_colaboradores.xlsx');

    if (error || !data || data.length === 0) return [];

    const fullContent = data.map(d => d.content).join('\n');
    const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });

    const prompt = `
      Basado en la siguiente lista de colaboradores y sus cumpleaños:
      ${fullContent}
      
      Hoy es ${today}. Identifica los 3 cumpleaños más cercanos (empezando por hoy).
      Devuelve ÚNICAMENTE un array JSON con este formato:
      [
        { "name": "Nombre completo", "date": "Hoy" o "Mañana" o "DD Mes", "department": "Area/Depto", "photo": "https://picsum.photos/seed/[nombre]/100/100" }
      ]
    `;

    const response = await (ai as any).models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = responseText.match(/\[.*\]/s);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];

  } catch (error) {
    console.error("Error fetching upcoming birthdays:", error);
    return [];
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
