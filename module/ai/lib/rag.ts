import { pineconeIndex } from "@/lib/pinecone";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

export async function generateEmbedding(text: string) {
  const { embedding } = await embed({
    model: google.embeddingModel("gemini-embedding-001"),
    value: text,
    providerOptions: {
      google: {
        outputDimensionality: 768,
      },
    },
  });

  return embedding;
}

export async function indexCodebase(
  repoId: string,
  files: { path: string; content: string }[]
) {
  const vectors = [];
  let failedCount = 0;
  let firstError: string | null = null;

  for (const file of files) {
    const content = `File: ${file.path}\n\n${file.content}`;

    // Gemini embedding input limit safety
    const truncatedContent = content.slice(0, 8000);

    try {
      const embedding = await generateEmbedding(truncatedContent);

      vectors.push({
        id: `${repoId}-${file.path.replace(/\//g, "_")}`,
        values: embedding,
        metadata: {
          repoId,
          path: file.path,
          content: truncatedContent,
        },
      });
    } catch (error) {
      failedCount++;

      const errMsg =
        error instanceof Error ? error.message : String(error);

      if (!firstError) {
        firstError = `${file.path}: ${errMsg}`;
      }

      console.error(
        `Failed to embed ${file.path}:`,
        errMsg
      );
    }
  }


  // Upload embeddings to Pinecone
  if (vectors.length > 0) {
    const batchSize = 100;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(
        i,
        i + batchSize
      );

      await pineconeIndex.upsert({
        records: batch,
      });
    }
  }

  console.log(
    `Indexing complete: ${vectors.length}/${files.length}`
  );


  return {
    indexed: vectors.length,
    failed: failedCount,
    total: files.length,
    firstError,
  };
}


export async function retrieveContext(
  query: string,
  repoId: string,
  topK: number = 5
) {
  const embedding = await generateEmbedding(query);

  const results = await pineconeIndex.query({
    vector: embedding,
    filter: {
      repoId,
    },
    topK,
    includeMetadata: true,
  });


  return results.matches
    .map(
      (match) =>
        match.metadata?.content as string
    )
    .filter(Boolean);
}