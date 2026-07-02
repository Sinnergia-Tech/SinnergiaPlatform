import { auth } from "@/auth";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problema } from "@/components/Problema";
import { ComoFunciona } from "@/components/ComoFunciona";
import { Servicios } from "@/components/Servicios";
import { RedSinnergia } from "@/components/RedSinnergia";
import { Sumate } from "@/components/Sumate";
import { Portfolio } from "@/components/Portfolio";
import { QuienesSomos } from "@/components/QuienesSomos";
import { Manifiesto } from "@/components/Manifiesto";
import { CTABand } from "@/components/CTABand";
import { Footer } from "@/components/Footer";

export default async function Home() {
  const session = await auth();
  const account = session?.user
    ? {
        nombre: session.user.name ?? "Mi cuenta",
        href: session.user.role === "admin" ? "/admin" : "/cuenta",
      }
    : null;

  return (
    <main>
      <Nav account={account} />
      <Hero />
      <Problema />
      <ComoFunciona />
      <Servicios />
      <RedSinnergia />
      <Sumate />
      <Portfolio />
      <QuienesSomos />
      <Manifiesto />
      <CTABand />
      <Footer />
    </main>
  );
}
