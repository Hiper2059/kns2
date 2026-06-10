import { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/ui/Toast';
import MessagePopup from '../components/ui/MessagePopup';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info'
  });

  // --- Toasts ---
  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    addToast(message, type, duration);
  }, [addToast]);

  const showSuccess = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const showError = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const showWarning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const showInfo = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  // --- Modals/Popups ---
  const showModal = useCallback((message, title = 'Thông báo', variant = 'info') => {
    setModalState({
      isOpen: true,
      title,
      message,
      variant
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <UIContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showModal,
        closeModal
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <MessagePopup 
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        variant={modalState.variant}
        onClose={closeModal}
      />
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
