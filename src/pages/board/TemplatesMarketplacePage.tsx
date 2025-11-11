import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/layout/PageHeader';
import { LayoutGrid } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
const API_BASE = APP_CONFIG.API_BASE_URL;

export default function TemplatesMarketplacePage() {
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description?: string; category?: string }>>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/templates`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          setTemplates(Array.isArray(json.data) ? json.data : []);
        }
      } catch {}
    };
    run();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Templates"
          subtitle="Kickstart with prebuilt board templates"
          icon={LayoutGrid}
          iconColor="from-purple-600 to-blue-600"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-10 text-center text-muted-foreground">No templates yet.</CardContent>
            </Card>
          ) : (
            templates.map(t => (
              <Card key={t.id} className="bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle>{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{t.description || 'Template'}</p>
                  <Button variant="outline" size="sm" disabled>
                    Preview (coming soon)
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


