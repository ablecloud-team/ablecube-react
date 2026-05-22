// 클라우드센터VM 마이그레이션 대상 노드 선택 모달입니다.
import React from "react";
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

interface CloudClusterMigrationModalProps {
  isOpen: boolean;
  nodes: string[];
  onClose: () => void;
  onConfirm: (targetNode: string) => void;
}

export default function CloudClusterMigrationModal({
  isOpen,
  nodes,
  onClose,
  onConfirm,
}: CloudClusterMigrationModalProps) {
  const [targetNode, setTargetNode] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setTargetNode("");
    }
  }, [isOpen]);

  const hasNodes = nodes.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="small"
      aria-label="클라우드센터VM 마이그레이션"
      className="ct-action-confirm-modal"
    >
      <ModalHeader title="클라우드센터VM 마이그레이션" />
      <ModalBody>
        <div className="ct-action-confirm-modal__body">
          <Content component="p">클라우드센터VM 마이그레이션할 노드를 선택해주세요.</Content>
          {hasNodes ? (
            <label className="ct-action-confirm-modal__field">
              <span>대상 노드</span>
              <select
                value={targetNode}
                onChange={(event) => setTargetNode(event.currentTarget.value)}
              >
                <option value="">노드를 선택해주세요.</option>
                {nodes.map((node) => (
                  <option key={node} value={node}>
                    {node}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Content component="p" className="ct-action-confirm-modal__danger-text">
              마이그레이션 가능한 대상 노드가 없습니다.
            </Content>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isDisabled={!targetNode}
          onClick={() => onConfirm(targetNode)}
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
