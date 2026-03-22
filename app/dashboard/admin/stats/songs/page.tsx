import { SongStatsPage as SongStatsCharts } from '@/components/songs/stats';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { redirect } from 'next/navigation';
import { getSongDatabaseStatistics } from '@/lib/services/song-analytics';
import { SongStatsTable } from '@/components/dashboard/admin/SongStatsTable';
import { SendAdminReportButton } from '@/components/dashboard/admin/SendAdminReportButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function SongStatsPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();

  if (!user) {
    redirect('/sign-in');
  }

  if (!isAdmin && !isTeacher) {
    redirect('/dashboard');
  }

  const healthStats = await getSongDatabaseStatistics();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Song Statistics & Health</h1>
            <p className="text-muted-foreground">
              Detailed analytics about the song library, usage, and metadata health.
            </p>
          </div>
          <SendAdminReportButton />
        </div>
      </div>

      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Analytics Charts</TabsTrigger>
          <TabsTrigger value="health">Database Health</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <SongStatsCharts />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Metadata Health</h2>
              <p className="text-sm text-muted-foreground">
                Monitor and improve the quality of your song library metadata.
              </p>
            </div>
            <SongStatsTable stats={healthStats} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
