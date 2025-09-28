import React, { useState } from 'react';
import AdminDashboard from '../components/AdminDashboard';
import ObservabilityDashboard from '../components/dashboard/ObservabilityDashboard';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'observability'>('queue');

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('queue')}
              className={`${activeTab === 'queue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Gerenciamento de Fila
            </button>
            <button
              onClick={() => setActiveTab('observability')}
              className={`${activeTab === 'observability'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Dashboard de Observabilidade
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'queue' ? <AdminDashboard /> : <ObservabilityDashboard />}
    </div>)

}

export default AdminPage;
