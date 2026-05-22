// 단순 실행 확인이 필요한 카드 액션 모달을 공통으로 제공합니다.
import React from "react";
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel = "실행",
  cancelLabel = "취소",
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="small"
      aria-label={title}
      className="ct-action-confirm-modal"
    >
      <ModalHeader title={title} />
      <ModalBody>
        {typeof message === "string" ? (
          <Content component="p">{message}</Content>
        ) : message}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="link" onClick={onClose}>
          {cancelLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
