import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata = { title: "Política de privacidad — Sinnergia Studio" };

export default function PrivacidadPage() {
  return (
    <LegalPageLayout
      kicker="Legal"
      title="Política de privacidad"
      updatedAt="2026-07-03"
    >
      <LegalSection title="1. Información que recopilamos">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
          veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
          commodo consequat.
        </p>
      </LegalSection>

      <LegalSection title="2. Cómo usamos tu información">
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
          dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
          proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookies y tecnologías similares">
        <p>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab
          illo inventore veritatis et quasi architecto beatae vitae dicta sunt
          explicabo.
        </p>
      </LegalSection>

      <LegalSection title="4. Con quién compartimos tu información">
        <p>
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut
          fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem
          sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor
          sit amet, consectetur, adipisci velit.
        </p>
      </LegalSection>

      <LegalSection title="5. Seguridad de los datos">
        <p>
          Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis
          suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis
          autem vel eum iure reprehenderit qui in ea voluptate velit esse quam
          nihil molestiae consequatur.
        </p>
      </LegalSection>

      <LegalSection title="6. Tus derechos sobre tus datos">
        <p>
          At vero eos et accusamus et iusto odio dignissimos ducimus qui
          blanditiis praesentium voluptatum deleniti atque corrupti quos dolores
          et quas molestias excepturi sint occaecati cupiditate non provident.
        </p>
      </LegalSection>

      <LegalSection title="7. Contacto">
        <p>
          Ante consultas sobre esta política, escribinos a{" "}
          <a href="mailto:sinnergiasistemas@gmail.com" className="link-underline text-ink">
            sinnergiasistemas@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
