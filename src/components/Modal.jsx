import { X, AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, message, type = 'info', onConfirm, onCancel, showConfirm = false }) {
  if (!isOpen) return null

  const iconMap = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: AlertCircle,
  }

  const Icon = iconMap[type] || Info
  // Use yellow/amber colors for all types
  const iconColor = 'text-amber-600'
  const headerColors = 'bg-amber-50 border-amber-200'
  const titleColor = 'text-amber-900'
  const messageColor = 'text-amber-700'
  const iconBgColor = 'bg-amber-100'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-amber-50 rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-scale-in border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 border-b-2 ${headerColors}`}>
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconBgColor}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>{title}</h3>
              )}
              <p className={`text-sm leading-relaxed ${messageColor}`}>{message}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-full p-1 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-amber-50 flex justify-end gap-3">
          {showConfirm && onCancel && (
            <button
              onClick={() => {
                if (onCancel) onCancel()
                else onClose()
              }}
              className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-all font-semibold text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (showConfirm && onConfirm) {
                onConfirm()
              } else {
                onClose()
              }
            }}
            className={`px-6 py-2.5 ${showConfirm ? 'bg-red-500 hover:bg-red-600 active:bg-red-700' : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'} text-white rounded-lg transition-all font-semibold text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2`}
          >
            {showConfirm ? 'Delete' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  )
}

