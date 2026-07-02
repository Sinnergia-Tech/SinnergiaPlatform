import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problema } from "@/components/Problema";
import { ComoFunciona } from "@/components/ComoFunciona";
import { Servicios } from "@/components/Servicios";
import { RedSinnergia } from "@/components/RedSinnergia";
import { Sumate } from "@/components/Sumate";
import { Portfolio } from "@/components/Portfolio";
import { Manifiesto } from "@/components/Manifiesto";
import { CTABand } from "@/components/CTABand";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Problema />
      <ComoFunciona />
      <Servicios />
      <RedSinnergia />
      <Sumate />
      <Portfolio />
      <Manifiesto />
      <CTABand />
      <Footer />
    </main>
  );
}
