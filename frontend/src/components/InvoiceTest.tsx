import React from 'react';
import InvoiceCard from './InvoiceCard';

const InvoiceTest: React.FC = () => {
  const handlePaymentMethod = (method: 'credit' | 'pix' | 'boleto') => {
    alert(`Payment method selected: ${method}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* WhatsApp-style messages */}
        <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
          <div className="bg-gray-100 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-800">Olá João!</p>
          </div>

          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-800">
              Olha que novidade legal! A partir de agora sua fatura pode chegar diretamente no seu whatsapp e você poderá iniciar até o pagamento por aqui!
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-800">
              Aproveite e pague agora mesmo sua fatura de dezembro que chegou! ⚡
            </p>
            <p className="text-xs text-gray-500 mt-1">11:45</p>
          </div>
        </div>

        {/* Invoice Card */}
        <InvoiceCard
          customerName="João"
          accountNumber="123423453"
          brandName="Sua Marca"
          dueDate="11/10/2025"
          amount={200.00}
          billPeriod="dezembro"
          onPaymentMethod={handlePaymentMethod}
        />
      </div>
    </div>
  );
};

export default InvoiceTest;