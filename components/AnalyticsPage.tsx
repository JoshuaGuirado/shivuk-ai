
import React, { useState } from 'react';
import { useLibrary } from '../contexts/LibraryContext';
import { BarChart2, TrendingUp, Layers, PieChart, Users, Zap, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const AnalyticsPage: React.FC = () => {
  const { items } = useLibrary();
  const [isDownloading, setIsDownloading] = useState(false);

  // Cálculo de Métricas
  const totalPosts = items.length;
  
  // Posts nos últimos 7 dias
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const postsThisWeek = items.filter(i => i.timestamp > oneWeekAgo).length;

  // Distribuição por Plataforma
  const platformCounts: Record<string, number> = {};
  let topPlatform = 'N/A';
  let maxCount = 0;

  items.forEach(item => {
    // Se o item for antigo e não tiver platformId, conta como 'legacy'
    const pid = item.platformId || 'genérico';
    platformCounts[pid] = (platformCounts[pid] || 0) + 1;
    if (platformCounts[pid] > maxCount) {
      maxCount = platformCounts[pid];
      topPlatform = pid;
    }
  });

  // Distribuição por Persona (apenas para exibição se disponível)
  const personaCounts: Record<string, number> = {};
  items.forEach(item => {
    if (item.personaId) {
      personaCounts[item.personaId] = (personaCounts[item.personaId] || 0) + 1;
    }
  });

  // Função auxiliar para nomes amigáveis
  const formatId = (id: string) => id ? id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ') : 'N/A';

  const handleDownloadReport = () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
        const date = new Date().toLocaleDateString();
        const topPersona = Object.keys(personaCounts).length > 0 
            ? formatId(Object.keys(personaCounts).reduce((a, b) => personaCounts[a] > personaCounts[b] ? a : b)) 
            : 'N/A';

        // Conteúdo do Relatório
        const reportContent = `
SHIVUK AI STUDIO - RELATÓRIO DE PERFORMANCE
Gerado em: ${date}
===========================================

RESUMO EXECUTIVO
----------------
Total de Ativos Criados: ${totalPosts}
Produção na Última Semana: ${postsThisWeek}
Plataforma Dominante: ${formatId(topPlatform)}
Persona Mais Utilizada: ${topPersona}

DISTRIBUIÇÃO POR CANAL
----------------------
${Object.entries(platformCounts).map(([pid, count]) => {
    const pct = totalPosts > 0 ? ((count / totalPosts) * 100).toFixed(1) : '0';
    return `- ${formatId(pid)}: ${count} posts (${pct}%)`;
}).join('\n')}

INSIGHT DO DIRETOR
------------------
Com base nos dados atuais, sua produção está concentrada em ${formatId(topPlatform)}.
Para maximizar o alcance, recomenda-se diversificar os formatos de conteúdo nas plataformas onde a frequência é menor.

HISTÓRICO RECENTE (Últimos 20 Itens)
------------------------------------
${items.slice(0, 20).map(item => {
    const dataStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Data N/A';
    const platStr = formatId(item.platformId || 'N/A');
    return `- [${dataStr}] ${item.title || 'Sem Título'} (${platStr})`;
}).join('\n')}

===========================================
Shivuk AI 2.0 - Intelligence System
        `.trim();

        // Download com suporte a UTF-8 (BOM \uFEFF)
        const blob = new Blob(['\uFEFF' + reportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `shivuk-report-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        
        // Limpeza
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setIsDownloading(false);
        }, 100);

    } catch (error) {
        console.error("Erro ao baixar relatório:", error);
        alert("Erro ao gerar o relatório. Tente novamente.");
        setIsDownloading(false);
    }
  };

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass p-6 rounded-[28px] border border-white/5 relative overflow-hidden group`}
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${color.replace('text-', 'bg-')} transition-transform group-hover:scale-110`} />
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${color.replace('text-', 'bg-')}/10 flex items-center justify-center mb-4 ${color}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-4xl font-brand font-bold text-white mb-2">{value}</p>
        <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
          <TrendingUp size={10} className="text-emerald-500" /> {sub}
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 pb-20">
      <header className="space-y-2">
        <h2 className="text-3xl font-display font-bold text-white tracking-tight">Performance Studio</h2>
        <p className="text-slate-400">Análise métrica da sua produção de conteúdo.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Ativos" 
          value={totalPosts} 
          sub="Posts gerados no total" 
          icon={Layers} 
          color="text-cyber-purple" 
        />
        <StatCard 
          title="Produção Semanal" 
          value={postsThisWeek} 
          sub="Nos últimos 7 dias" 
          icon={Zap} 
          color="text-cyber-cyan" 
        />
        <StatCard 
          title="Plataforma Top" 
          value={formatId(topPlatform)} 
          sub="Canal mais utilizado" 
          icon={PieChart} 
          color="text-emerald-400" 
        />
        <StatCard 
          title="Persona Favorita" 
          value={Object.keys(personaCounts).length > 0 ? formatId(Object.keys(personaCounts).reduce((a, b) => personaCounts[a] > personaCounts[b] ? a : b)) : 'N/A'} 
          sub="Tom de voz predominante" 
          icon={Users} 
          color="text-amber-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Barras Customizado (Platform Distribution) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass border border-white/5 rounded-[32px] p-8 space-y-6"
        >
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <BarChart2 className="text-cyber-purple" size={20} />
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Distribuição por Plataforma</h3>
          </div>

          <div className="space-y-6">
            {Object.entries(platformCounts).map(([pid, count], idx) => {
              const percentage = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
              return (
                <div key={pid} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white uppercase tracking-wider">{formatId(pid)}</span>
                    <span className="text-slate-500">{count} posts ({percentage}%)</span>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-cyber-purple to-cyber-blue rounded-full"
                    />
                  </div>
                </div>
              );
            })}
            
            {totalPosts === 0 && (
              <div className="text-center py-12 text-slate-600">
                <p className="text-xs uppercase tracking-widest">Nenhum dado disponível para análise.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Card Informativo / Dicas */}
        <div className="glass border border-white/5 rounded-[32px] p-8 space-y-6 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="w-12 h-12 rounded-2xl bg-cyber-purple/10 flex items-center justify-center mb-2">
             <Zap size={24} className="text-cyber-purple" />
          </div>
          <h3 className="text-xl font-brand font-bold text-white">Insight do Diretor</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Seus dados mostram que você prefere o formato <strong>{formatId(topPlatform)}</strong>. 
            Experimente variar os formatos para alcançar novos públicos. O algoritmo favorece consistência em múltiplas plataformas.
          </p>
          <div className="pt-4">
            <button 
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {isDownloading ? 'Gerando Relatório...' : 'Baixar Relatório Completo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
