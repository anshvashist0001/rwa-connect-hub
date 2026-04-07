import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, Download, FolderOpen } from "lucide-react";
import { documentsApi, type Document } from "@/lib/api";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Documents = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: documentsApi.getAll,
  });

  const grouped = data?.grouped || {};

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-10">
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Resources</p>
            <h1 className="text-3xl md:text-5xl font-bold">Documents</h1>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="h-5 bg-secondary rounded w-40 mb-4 animate-pulse" />
                  <div className="space-y-3">
                    {[1, 2].map((j) => (
                      <div key={j} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                        <div className="h-4 bg-secondary rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No documents available at this time.</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, docs]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <FolderOpen className="w-5 h-5 text-accent" />
                    <h2 className="font-serif text-xl font-semibold">{category}</h2>
                  </div>
                  <div className="space-y-3">
                    {(docs as Document[]).map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url.startsWith("http") ? doc.file_url : (doc.file_url.startsWith("blob:") || doc.file_url.startsWith("data:") ? doc.file_url : `${API_BASE}${doc.file_url}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-medium group-hover:text-accent transition-colors">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">{doc.file_type} · {doc.file_size}</p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Documents;
