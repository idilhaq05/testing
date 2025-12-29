interface ConfirmOverlayProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function ConfirmOverlay({ message, onConfirm, onCancel, confirmText = 'Ya', cancelText = 'Batal', loading = false }: ConfirmOverlayProps) {
  return (
    <div className="fixed inset-0 z-90 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 w-full max-w-xs shadow-lg">
        <div className="text-center text-lg font-semibold mb-6">{message}</div>
        <div className="flex justify-center gap-4">
          <button onClick={onCancel} disabled={loading} className="w-full py-2 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-100 transition">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={loading} className="w-full py-2 rounded-xl bg-[#25E82F] text-white font-semibold hover:bg-green-600 transition">
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
