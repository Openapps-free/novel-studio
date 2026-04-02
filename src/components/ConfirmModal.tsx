import { create } from "zustand";

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel: string;
  cancelLabel: string;
  variant: "danger" | "warning" | "info";
}

interface ConfirmModalStore {
  modal: ConfirmModalState;
  confirm: (options: Omit<ConfirmModalState, "isOpen" | "onConfirm" | "onCancel">) => Promise<boolean>;
  close: () => void;
}

export const useConfirmModal = create<ConfirmModalStore>((set) => ({
  modal: {
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "warning",
  },

  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        modal: {
          isOpen: true,
          title: options.title,
          message: options.message,
          onConfirm: () => {
            resolve(true);
            set((s) => ({ modal: { ...s.modal, isOpen: false } }));
          },
          onCancel: () => {
            resolve(false);
            set((s) => ({ modal: { ...s.modal, isOpen: false } }));
          },
          confirmLabel: options.confirmLabel || "Confirm",
          cancelLabel: options.cancelLabel || "Cancel",
          variant: options.variant || "warning",
        },
      });
    });
  },

  close: () => {
    set((s) => ({ modal: { ...s.modal, isOpen: false } }));
  },
}));

export function ConfirmModal() {
  const { modal } = useConfirmModal();

  if (!modal.isOpen) return null;

  const variantClasses: Record<string, string> = {
    danger: "modal-danger",
    warning: "modal-warning",
    info: "modal-info",
  };

  return (
    <div className="modal-overlay" onClick={modal.onCancel}>
      <div className={`modal-content ${variantClasses[modal.variant]}`} onClick={(e) => e.stopPropagation()}>
        <h3>{modal.title}</h3>
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={modal.onCancel}>
            {modal.cancelLabel}
          </button>
          <button
            className={`btn ${modal.variant === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={modal.onConfirm}
          >
            {modal.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export async function showConfirm(
  title: string,
  message: string,
  options?: {
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
  }
): Promise<boolean> {
  return useConfirmModal.getState().confirm({
    title,
    message,
    confirmLabel: options?.confirmLabel || "Confirm",
    cancelLabel: options?.cancelLabel || "Cancel",
    variant: options?.variant || "warning",
  });
}
