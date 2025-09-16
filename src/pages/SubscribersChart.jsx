import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SubscribersChart({ userId, timePeriod }) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const periodText = timePeriod > 0 ? `Últimos ${timePeriod} dias` : 'Todo o Período';


  useEffect(() => {
    const fetchChartData = async () => {
      if (!userId) return;
      setIsLoading(true);

      const { data, error } = await supabase.rpc('get_daily_subscribers_for_creator', {
        creator_id_param: userId,
        days_param: timePeriod
      });

      if (error) {
        console.error("Erro ao buscar dados de inscritos:", error);
        setChartData([]);
      } else {
        setChartData(data);
      }
      setIsLoading(false);
    };

    fetchChartData();
  }, [userId, timePeriod]);

  if (isLoading) {
    return <div className="bg-zinc-900 p-6 rounded-lg text-center text-zinc-400">Carregando gráfico de inscritos...</div>;
  }

    return (
        <div className="relative bg-zinc-900 p-4 sm:p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-6 text-white">Novos Inscritos ({periodText})</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis dataKey="subscribe_date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#8e44ad', borderRadius: '0.5rem' }}
            labelStyle={{ color: '#ffffff' }}
            cursor={{ fill: '#ffffff10' }}
          />
          <Bar dataKey="subscribers" fill="#8e44ad" name="Novos Inscritos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}