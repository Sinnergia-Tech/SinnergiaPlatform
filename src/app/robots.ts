import type { MetadataRoute } from "next";

// robots.txt dinámico. Mientras ALLOW_INDEXING no sea "true", se le dice a los
// buscadores que NO crawleen nada (sitio en construcción). Al lanzar, setear
// ALLOW_INDEXING="true" en Vercel y re-deployar.
export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.ALLOW_INDEXING === "true";
  return {
    rules: allowIndexing
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
  };
}
