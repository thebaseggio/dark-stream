// src/pages/DashboardChart.jsx

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Dados de exemplo para visualizarmos o gráfico antes de conectar com o Supabase
const sampleData = [
  { date: '10/08', views: 23 },
  { date: '11/08', views: 45 },
  { date: '12/08', views: 78 },
  { date: '13/08', views: 55 },
  { date: '14/08', views: 98 },
  { date: '15/08', views: 150 },
  { date: '16/08', views: 130 },
];

export default function DashboardChart() {

  return (
    <div className="bg-zinc-900 p-4 sm:p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-6 text-white">Performance de Views (Últimos 7 dias)</h3>
      {/* ResponsiveContainer garante que o gráfico se ajuste ao tamanho do container */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={sampleData} // Usando nossos dados de exemplo por enquanto
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
          <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />

          {/* Eixo Y (contagem de views) */}
          <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />

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