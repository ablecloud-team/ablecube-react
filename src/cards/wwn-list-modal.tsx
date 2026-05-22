// 스토리지센터 클러스터 카드의 HBA WWN 목록 조회 모달입니다.
import React from "react";
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

interface WwnInfo {
  hostname: string;
  wwn: string[];
}

interface WwnListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WWN_LIST: WwnInfo[] = [
  {
    hostname: "ablecube1",
    wwn: ["21000024ff7a8b01", "21000024ff7a8b02"],
  },
  {
    hostname: "ablecube2",
    wwn: ["21000024ff7a8c01", "21000024ff7a8c02"],
  },
  {
    hostname: "ablecube3",
    wwn: ["21000024ff7a8d01", "21000024ff7a8d02"],
  },
];

export default function WwnListModal({ isOpen, onClose }: WwnListModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="medium"
      aria-label="WWN 목록"
      className="ct-wwn-list-modal"
    >
      <ModalHeader title="WWN 목록" />
      <ModalBody>
        {WWN_LIST.length > 0 ? (
          <div className="ct-wwn-list-modal__table-wrap">
            <table className="ct-wwn-list-modal__table">
              <thead>
                <tr>
                  <th>호스트명</th>
                  <th>WWN</th>
                </tr>
              </thead>
              <tbody>
                {WWN_LIST.map((item) => (
                  <tr key={item.hostname}>
                    <td>{item.hostname}</td>
                    <td>
                      {item.wwn.map((value) => (
                        <div key={value}>{value}</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Content component="p">데이터가 존재하지 않습니다.</Content>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>
          확인
        </Button>
      </ModalFooter>
    </Modal>
  );
}
