import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { committeeApi, type CommitteeMember } from "@/lib/api";
import { Phone, Mail, UserCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const mockCommittee: CommitteeMember[] = [
  { id: 1, name: "Rajesh Gupta", designation: "President", phone: "9876500001", email: "president@shyamkunj.com", photo_url: null, bio: "Leading RWA Shyam Kunj since 2022 with a focus on infrastructure and resident welfare.", display_order: 1, is_active: true },
  { id: 2, name: "Kavita Sharma", designation: "Vice President", phone: "9876500002", email: "vp@shyamkunj.com", photo_url: null, bio: "Oversees community events and resident relations.", display_order: 2, is_active: true },
  { id: 3, name: "Amit Patel", designation: "Secretary", phone: "9876500003", email: "secretary@shyamkunj.com", photo_url: null, bio: "Manages correspondence, minutes of meetings, and official records.", display_order: 3, is_active: true },
  { id: 4, name: "Sunita Mehta", designation: "Treasurer", phone: "9876500004", email: "treasurer@shyamkunj.com", photo_url: null, bio: "Responsible for financial management, fee collection, and audits.", display_order: 4, is_active: true },
  { id: 5, name: "Vikram Singh", designation: "Joint Secretary", phone: "9876500005", email: null, photo_url: null, bio: "Assists the Secretary and coordinates with maintenance teams.", display_order: 5, is_active: true },
  { id: 6, name: "Anita Joshi", designation: "Member", phone: "9876500006", email: null, photo_url: null, bio: "Handles grievances and resident feedback.", display_order: 6, is_active: true },
];

const Committee = () => {
  const { data: committee = mockCommittee } = useQuery({
    queryKey: ["committee"],
    queryFn: committeeApi.getAll,
    placeholderData: mockCommittee,
  });

  const active = committee.filter((m) => m.is_active);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Your Representatives</p>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">RWA Committee</h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
              Meet the elected members of the Shyam Kunj Residents Welfare Association managing committee, working to make our community better every day.
            </p>
          </div>

          {/* Committee grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {active.map((member) => (
              <div
                key={member.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-accent/30 transition-all duration-300 group"
              >
                {/* Photo area */}
                <div className="bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center h-40">
                  {member.photo_url ? (
                    <img
                      src={`${API_BASE}${member.photo_url}`}
                      alt={member.name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-background shadow-md"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-background border-4 border-background shadow-md flex items-center justify-center">
                      <UserCircle className="w-16 h-16 text-accent/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="text-center mb-4">
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-3 py-1 rounded-full mb-2">
                      {member.designation}
                    </span>
                    <h3 className="font-serif text-xl font-semibold group-hover:text-accent transition-colors">
                      {member.name}
                    </h3>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-muted-foreground text-center leading-relaxed mb-4">
                      {member.bio}
                    </p>
                  )}

                  <div className="space-y-1.5">
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        {member.phone}
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-accent transition-colors truncate"
                      >
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        {member.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Committee;
