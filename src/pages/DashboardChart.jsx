// src/pages/DashboardChart.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // Importe o supabase
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Precisamos do ID do usuário para a consulta
export default function DashboardChart({ userId, timePeriod }) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const periodText = timePeriod > 0 ? `Últimos ${timePeriod} dias` : 'Todo o Período';

  useEffect(() => {
    const fetchChartData = async () => {
      if (!userId) return;

      setIsLoading(true);
      // Chamando a função com o novo parâmetro 'days_param'
      const { data, error } = await supabase.rpc('get_daily_views_for_creator', {
        creator_id_param: userId,
        days_param: timePeriod // Enviando o período selecionado
      });

      if (error) {
        console.error("Erro ao buscar dados do gráfico:", error);
        setChartData([]);
      } else {
        setChartData(data);
      }
      setIsLoading(false);
    };

    fetchChartData();
  }, [userId, timePeriod]); // Adicionado 'timePeriod' à lista de dependências

  if (isLoading) {
    return <div className="bg-zinc-900 p-6 rounded-lg text-center">Carregando dados do gráfico...</div>;
  }

// src/pages/DashboardChart.jsx

    return (
        <div className="relative bg-zinc-900 p-4 sm:p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-6 text-white">Performance de Views ({periodText})</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis dataKey="view_date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} domain={[0, dataMax => (dataMax < 5 ? 5 : dataMax + 5)]}/>
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#f1c40f', borderRadius: '0.5rem' }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Line 
            type="monotone" 
            dataKey="views" 
            stroke="#f1c40f"
            strokeWidth={2}
            dot={{ r: 4, fill: '#f1c40f' }}
            activeDot={{ r: 8 }} 
            name="Visualizações"
          />
        </LineChart>
      </ResponsiveContainer>

      {chartData.length === 1 && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded-lg pointer-events-none">
          <p className="text-zinc-400 text-center text-sm font-semibold px-4">
            Continue assim! A tendência de views aparecerá a partir do segundo dia.
          </p>
        </div>
      )}
    </div>
  );
}