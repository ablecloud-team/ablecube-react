// SSH Port 변경 입력 및 확인 모달입니다.
import React from "react";
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

interface SshPortChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (beforePort: string, afterPort: string) => void;
}

const isValidPort = (value: string) => {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535;
};

export default function SshPortChangeModal({
  isOpen,
  onClose,
  onConfirm,
}: SshPortChangeModalProps) {
  const [beforePort, setBeforePort] = React.useState("");
  const [afterPort, setAfterPort] = React.useState("");
  const [isChecked, setIsChecked] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setBeforePort("");
      setAfterPort("");
      setIsChecked(false);
    }
  }, [isOpen]);

  const isExecutable =
    isChecked &&
    isValidPort(beforePort) &&
    isValidPort(afterPort) &&
    beforePort !== afterPort;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="small"
      aria-label="SSH Port 변경"
      className="ct-action-confirm-modal"
    >
      <ModalHeader title="SSH Port 변경" />
      <ModalBody>
        <div className="ct-action-confirm-modal__body">
          <Content component="p">SSH Port를 변경하시겠습니까?</Content>
          <label className="ct-action-confirm-modal__field">
            <span>현재 SSH 포트</span>
            <input
              type="number"
              min="1"
              max="65535"
              placeholder="example: 22"
              value={beforePort}
              onChange={(event) => setBeforePort(event.currentTarget.value)}
            />
          </label>
          <label className="ct-action-confirm-modal__field">
            <span>변경할 SSH 포트</span>
            <input
              type="number"
              min="1"
              max="65535"
              placeholder="example: 10022"
              value={afterPort}
              onChange={(event) => setAfterPort(event.currentTarget.value)}
            />
          </label>
          <label className="ct-action-confirm-modal__check">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(event) => setIsChecked(event.currentTarget.checked)}
            />
            <span>SSH Port 확인</span>
          </label>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isDisabled={!isExecutable}
          onClick={() => onConfirm(beforePort, afterPort)}
        >
          실행
        </Button>
        <Button variant="link" onClick={onClose}>
          취소
        </Button>
      </ModalFooter>
    </Modal>
  );
}
