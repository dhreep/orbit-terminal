import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CryptoView } from './CryptoView';
import { ForexView } from './ForexView';
import { InsiderView } from './InsiderView';
import { EconomicView } from './EconomicView';
import { SentimentView } from './SentimentView';

export function DataExplorer() {
  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-auto">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Data Explorer</h2>
      <Tabs defaultValue="crypto">
        <TabsList variant="line">
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
          <TabsTrigger value="forex">Forex</TabsTrigger>
          <TabsTrigger value="insider">Insider</TabsTrigger>
          <TabsTrigger value="economic">Economic</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
        </TabsList>
        <TabsContent value="crypto"><CryptoView /></TabsContent>
        <TabsContent value="forex"><ForexView /></TabsContent>
        <TabsContent value="insider"><InsiderView /></TabsContent>
        <TabsContent value="economic"><EconomicView /></TabsContent>
        <TabsContent value="sentiment"><SentimentView /></TabsContent>
      </Tabs>
    </div>
  );
}
