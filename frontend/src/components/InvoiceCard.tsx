import React from 'react';

interface InvoiceCardProps {
  customerName: string;
  accountNumber: string;
  brandName: string;
  dueDate: string;
  amount: number;
  billPeriod?: string;
  onPaymentMethod: (method: 'credit' | 'pix' | 'boleto') => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  customerName,
  accountNumber,
  brandName,
  dueDate,
  amount,
  billPeriod = "dezembro",
  onPaymentMethod
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-sm mx-auto">
      {/* Header with account info */}
      <div className="bg-gray-100 px-4 py-2 text-center">
        <p className="text-xs text-gray-600 font-medium">Conta Contrato {accountNumber}</p>
      </div>

      {/* Brand section */}
      <div className="bg-orange-400 px-4 py-3 flex items-center justify-between">
        <div className="text-white">
          <h3 className="text-lg font-bold">{brandName}</h3>
        </div>
        <div className="text-white text-xs">
          <p>Sua fatura chegou.</p>
        </div>
      </div>

      {/* Bill details */}
      <div className="px-4 py-3">
        <div className="text-xs text-gray-500 mb-2">
          <p>Sua fatura com vencimento em <span className="font-semibold text-blue-600">{dueDate}</span> no valor de <span className="font-semibold text-blue-600">R$ {amount.toFixed(2).replace('.', ',')}</span></p>
          <p className="mt-1">Está disponível para baixar com o número fatura acima</p>
        </div>

        {/* PDF attachment */}
        <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-md mb-3">
          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            PDF
          </div>
          <span className="text-sm text-gray-700">fatura-{billPeriod}.pdf</span>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center py-2 border-t border-gray-200">
          <span className="font-semibold text-gray-800">Total</span>
          <span className="font-bold text-lg text-gray-900">R$ {amount.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* Payment methods */}
      <div className="px-4 pb-4 space-y-2">
        <button
          onClick={() => onPaymentMethod('credit')}
          className="w-full bg-blue-500 text-white py-3 rounded-md font-medium hover:bg-blue-600 transition-colors"
        >
          Cartão de Crédito em até 24x
        </button>

        <button
          onClick={() => onPaymentMethod('pix')}
          className="w-full bg-teal-500 text-white py-3 rounded-md font-medium hover:bg-teal-600 transition-colors"
        >
          Pix
        </button>

        <button
          onClick={() => onPaymentMethod('boleto')}
          className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Boleto
        </button>
      </div>
    </div>
  );
};

export default InvoiceCard;