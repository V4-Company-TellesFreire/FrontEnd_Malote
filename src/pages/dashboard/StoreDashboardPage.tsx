import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Download, FileSpreadsheet, Loader2, RefreshCw, BarChart2, Shield, Layers, AlertTriangle, PackageCheck, FlaskConical } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useStoreMetrics, useNetworkMetrics } from '../../features/dashboard/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { type ServiceOrderStatus } from '../../lib/constants';

export interface StoreDashboardPageProps {
  isNetwork?: boolean;
}

export function StoreDashboardPage({ isNetwork = false }: StoreDashboardPageProps) {
  const toast = useToast();
  const storeId = useAuthStore((s) => s.selectedStoreId);
  const storeName = useAuthStore((s) => s.selectedStoreName);

  const activeStoreId = storeId || '';
  const title = isNetwork ? 'Consolidado da Rede' : `Métricas da Filial — ${storeName || 'Carol'}`;

  // Queries
  const { data: storeData, isLoading: storeLoading, refetch: refetchStore } = useStoreMetrics(activeStoreId);
  const { data: networkData, isLoading: networkLoading, refetch: refetchNetwork } = useNetworkMetrics();

  const metrics = isNetwork ? networkData : storeData;
  const isLoading = isNetwork ? networkLoading : storeLoading;

  const chartData = React.useMemo(() => {
    if (!metrics) return [];
    const stageMap: Record<string, { count: number; color: string }> = {
      'Malote':      { count: 0, color: '#FFC20E' },
      'Laboratório': { count: 0, color: '#4338CA' },
      'Montagem':    { count: 0, color: '#DC8C0A' },
      'Qualidade':   { count: 0, color: '#64748B' },
      'Triagem':     { count: 0, color: '#0891B2' },
      'Pronto para Expedição':   { count: 0, color: '#7C3AED' },
      'Em Rota':     { count: 0, color: '#0369A1' },
      'Entregue':    { count: 0, color: '#0D9F6F' },
    };

    const statusToStage: Record<ServiceOrderStatus, string> = {
      'Chegada de Malote':      'Malote',
      'Envio Laboratório':      'Laboratório',
      'Montagem':               'Montagem',
      'Controle de Qualidade':  'Qualidade',
      'Separando':              'Triagem',
      'Pronto para Expedição':  'Pronto para Expedição',
      'Em Rota':                'Em Rota',
      'Entregue na Loja':       'Entregue',
      'Entregue c/ Ressalva':   'Entregue',
      'Entregue ao Cliente':    'Entregue',
    };

    Object.entries(metrics.ordersByStatus).forEach(([status, count]) => {
      const stage = statusToStage[status as ServiceOrderStatus];
      if (stage && stageMap[stage]) {
        stageMap[stage].count += count;
      }
    });

    return Object.entries(stageMap).map(([name, data]) => ({
      name,
      Quantidade: data.count,
      color: data.color,
    }));
  }, [metrics]);

  const pieData = React.useMemo(() => {
    if (!metrics) return [];
    return [
      { name: 'Katz Central', value: metrics.mountingsKatz, color: '#1F3F77' },
      { name: 'Parceiro Externo', value: metrics.mountingsExternal, color: '#1B9AAA' },
    ].filter(v => v.value > 0);
  }, [metrics]);

  const handleExportCSV = () => {
    if (!metrics) return;
    toast.success('Relatório CSV gerado. Download iniciado!');
    
    // Simulate CSV building
    const rows = [
      ['Métrica', 'Valor'],
      ['Total de Pedidos', metrics.totalOrders],
      ['Urgências', metrics.urgentCount],
      ['Terceirizados (Lab Externo)', metrics.externalLabCount],
      ['Montagens Katz', metrics.mountingsKatz],
      ['Montagens Externas', metrics.mountingsExternal],
      ['Entregas Concluídas Hoje', metrics.deliveredToday],
    ];

    const csvContent = '\uFEFF' + rows.map(e => e.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_metrics_${isNetwork ? 'network' : storeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header bar actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 leading-tight">
            {title}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Visualização em tempo real de fluxos operacionais e tempos de produção
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto self-end sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => isNetwork ? refetchNetwork() : refetchStore()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            className="font-bold border-neutral-300 text-neutral-600 hover:bg-neutral-100"
          >
            Sincronizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-4 w-4" />}
            className="font-bold font-display"
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Aggregated widgets cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-neutral-200 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Volume no Pipeline
              </span>
              <span className="text-2xl font-black text-brand-900 font-display block mt-1">
                {metrics?.totalOrders || 0}
              </span>
            </div>
            <div className="h-9 w-9 rounded-[2px] bg-brand flex items-center justify-center shrink-0">
              <Layers className="h-4.5 w-4.5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Urgências Ativas
              </span>
              <span className="text-2xl font-black text-brand-900 font-display block mt-1">
                {metrics?.urgentCount || 0}
              </span>
            </div>
            <div className="h-9 w-9 rounded-[2px] bg-brand flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4.5 w-4.5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Entregues Hoje
              </span>
              <span className="text-2xl font-black text-brand-900 font-display block mt-1">
                {metrics?.deliveredToday || 0}
              </span>
            </div>
            <div className="h-9 w-9 rounded-[2px] bg-brand flex items-center justify-center shrink-0">
              <PackageCheck className="h-4.5 w-4.5 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Lab Terceirizado
              </span>
              <span className="text-2xl font-black text-brand-900 font-display block mt-1">
                {metrics?.externalLabCount || 0}
              </span>
            </div>
            <div className="h-9 w-9 rounded-[2px] bg-brand flex items-center justify-center shrink-0">
              <FlaskConical className="h-4.5 w-4.5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Pipeline distribution */}
        <Card className="lg:col-span-2 border-neutral-200 shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs">
              <BarChart2 className="h-4.5 w-4.5 text-neutral-500" />
              <span>Distribuição por Etapa do Kanban</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} fontStyle="bold" />
                <YAxis stroke="#94A3B8" fontSize={9} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E7EC',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'Inter',
                  }}
                  cursor={{ fill: '#F8FAFB' }}
                />
                <Bar dataKey="Quantidade" fill="#1F3F77" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mounting origin split */}
        <Card className="border-neutral-200 shadow-xs">
          <CardHeader>
            <CardTitle className="text-xs">Locais de Montagem</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex flex-col items-center justify-center relative">
            {pieData.length === 0 ? (
              <span className="text-neutral-400 text-xs font-semibold">Nenhum óculos montado hoje</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Legend split */}
            <div className="absolute bottom-4 flex justify-center gap-4 w-full px-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-[10px] text-neutral-600 font-bold">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network power BI frame placeholder (admin only) */}
      {isNetwork && (
        <Card className="border-neutral-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100">
            <CardTitle className="flex items-center gap-2 text-xs">
              <Shield className="h-4.5 w-4.5 text-warning" />
              <span>Painel Executivo Power BI Incorporado</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Simulation frame representation container */}
            <div className="h-96 w-full bg-neutral-50 flex flex-col items-center justify-center gap-4 text-center border-t border-neutral-200">
              <FileSpreadsheet className="h-12 w-12 text-neutral-400 animate-pulse" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-neutral-700">Embed Power BI Integrado via Iframe</span>
                <span className="text-[10px] text-neutral-400 max-w-xs leading-normal">
                  Este container carrega o iframe seguro com os relatórios analíticos de faturamento do Grupo Katz
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default StoreDashboardPage;
