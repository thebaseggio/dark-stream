// src/pages/DashboardChart.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // Importe o supabase
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Precisamos do ID do usuário para a consulta
export default function DashboardChart({ userId }) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!userId) return;

      setIsLoading(true);
      // Chamando nossa função do Supabase via RPC
      const { data, error } = await supabase.rpc('get_daily_views_for_creator', {
        creator_id_param: userId
      });

      if (error) {
        console.error("Erro ao buscar dados do gráfico:", error);
        setChartData([]); // Em caso de erro, exibe um gráfico vazio
      } else {
        setChartData(data);
      }
      setIsLoading(false);
    };

    fetchChartData();
  }, [userId]);

  if (isLoading) {
    return <div className="bg-zinc-900 p-6 rounded-lg text-center">Carregando dados do gráfico...</div>;
  }

  return (
    <div className="bg-zinc-900 p-4 sm:p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-6 text-white">Performance de Views (Últimos 7 dias)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData} // Usando nossos dados reais!
          margin={{
            top: 5,
            right: 20,
            left: -10, // Ajuste para o YAxis ficar mais próximo
            bottom: 5,
          }}
        >
          {/* Grid de fundo para facilitar a leitura */}
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          
          {/* Eixo X (datas) */}
         <XAxis dataKey="view_date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />

        {/* Eixo Y (contagem de views) */}
        <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} domain={[0, dataMax => (dataMax < 5 ? 5 : dataMax + 5)]}/>

          {/* Tooltip que aparece ao passar o mouse */}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', // zinc-900
              borderColor: '#f1c40f',
              borderRadius: '0.5rem' 
            }}
            labelStyle={{ color: '#ffffff' }}
          />

          {/* A linha do gráfico */}
          <Line 
            type="monotone" 
            dataKey="views" 
            stroke="#f1c40f" // Amarelo Dark Stream
            strokeWidth={2}
            dot={{ r: 4, fill: '#f1c40f' }}
            activeDot={{ r: 8 }} 
            name="Visualizações"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}