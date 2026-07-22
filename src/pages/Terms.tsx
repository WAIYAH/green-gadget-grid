import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

const SECTIONS = [
  {
    title: "1. Using Triple G",
    body: "You must be able to form a binding contract in your jurisdiction to create an account. You're responsible for the accuracy of what you submit — device condition, category, and ownership. Submitting a device you don't own, or misrepresenting its condition, is grounds for account suspension and forfeiture of any points earned from that submission.",
  },
  {
    title: "2. Points, tiers, and rewards",
    body: "Points are awarded once a submitted gadget is reviewed and approved by an administrator — submission alone does not earn points. Points have no cash value except where a specific reward or payout explicitly states otherwise, are non-transferable between accounts, and may be adjusted or revoked if awarded in error or through fraudulent submissions.",
  },
  {
    title: "3. Swap Center & Rewards Center",
    body: "Redemptions (refurbished devices, gift cards, donations) are deducted from your points balance at the moment you confirm the redemption and are final once confirmed, subject to stock availability at the time of the request.",
  },
  {
    title: "4. Account termination",
    body: "You may delete your own account at any time from Dashboard → Settings. We may suspend or terminate accounts that violate these terms, including fraudulent submissions or abuse of the rewards system.",
  },
  {
    title: "5. No warranty",
    body: "The platform, and any refurbished devices distributed through it, are provided as-is. We make reasonable efforts to verify submitted device condition but do not guarantee the condition of items received through swaps or rewards.",
  },
  {
    title: "6. Changes to these terms",
    body: "We may update these terms as the platform evolves. Continued use after a change constitutes acceptance of the updated terms.",
  },
];

const Terms = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="container mx-auto px-4 py-24 max-w-3xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: July 2026</p>
      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <Card key={s.title} className="p-6 glass-lg border-border/30">
            <h2 className="font-semibold text-lg mb-2">{s.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </Card>
        ))}
      </div>
    </div>
    <Footer />
  </div>
);

export default Terms;
