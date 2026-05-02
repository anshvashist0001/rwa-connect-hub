import { Building2, FileText, CheckCircle2 } from "lucide-react";

const AboutUs = () => {
  return (
    <section className="py-20 bg-background" id="about-us">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">About Us</h2>
            <div className="w-16 h-1 bg-accent mx-auto rounded-full"></div>
          </div>

          <div className="prose prose-lg dark:prose-invert mx-auto text-muted-foreground">
            <p className="text-lg leading-relaxed mb-6">
              <strong className="text-foreground">Residents Welfare Society, Shyam Kunj</strong> is a registered association formed under the <em>Societies Registration Act (XXI) of 1860</em>. The society was officially registered in the year 2005 with Registration No. <strong className="text-foreground">S/1309/2005</strong>, under the jurisdiction of the Registrar of Societies, Government of NCT of Delhi.
            </p>

            <p className="text-lg leading-relaxed mb-8">
              Located in <strong className="text-foreground">Shyam Kunj, Goyala Extension, New Delhi – 110071</strong>, the society has been established with the objective of promoting the welfare, harmony, and overall development of the residents of the colony.
            </p>

            <div className="bg-secondary/30 rounded-xl p-8 mb-8 border border-border/50 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                Our RWA works actively to:
              </h3>
              <ul className="space-y-4">
                {[
                  "Maintain a safe and organized living environment",
                  "Address common issues related to infrastructure and civic amenities",
                  "Organize community events and meetings",
                  "Represent residents’ concerns to local authorities"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-foreground/80">
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-lg leading-relaxed mb-12">
              We are committed to building a cooperative and well-managed community where every resident’s voice is heard and valued. Through collective efforts and responsible management, Residents Welfare Society, Shyam Kunj continues to strive towards improving the quality of life for all its members.
            </p>

            <div className="border-t border-border pt-10 mt-10">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                Registration Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6 bg-card rounded-xl p-6 border border-border shadow-sm">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Registered Under</div>
                  <div className="font-medium text-foreground">Societies Registration Act (XXI) of 1860</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Registration Number</div>
                  <div className="font-medium text-foreground">S/1309/2005</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Registered At</div>
                  <div className="font-medium text-foreground">Delhi</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Governing Authority</div>
                  <div className="font-medium text-foreground">Registrar of Societies, Govt. of NCT of Delhi</div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12 pt-8">
              <p className="text-xl font-serif italic text-accent font-medium">
                "Together, we build a better community."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
