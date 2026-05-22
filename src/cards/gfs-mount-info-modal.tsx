// GFS 마운트 경로 클릭 시 디스크 상세 정보를 보여주는 모달입니다.
import React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

export interface GfsMountInfo {
  mountPath: string;
  status: string;
  devices: string;
  multipaths: string;
  physicalVolume: string;
  volumeGroup: string;
  diskSize: string;
  resourceStatus: string[];
}

interface GfsMountInfoModalProps {
  isOpen: boolean;
  mountInfo: GfsMountInfo | null;
  onClose: () => void;
}

const renderValue = (value?: string) => value && value.trim() ? value : "N/A";

export default function GfsMountInfoModal({
  isOpen,
  mountInfo,
  onClose,
}: GfsMountInfoModalProps) {
  if (!mountInfo) {
    return null;
  }

  const rows = [
    ["디스크 마운트 상태", mountInfo.status],
    ["마운트 경로", mountInfo.mountPath],
    ["물리 볼륨", `${renderValue(mountInfo.devices)} ( ${renderValue(mountInfo.multipaths)} )`],
    ["볼륨 그룹", mountInfo.volumeGroup || mountInfo.physicalVolume],
    ["디스크 크기", mountInfo.diskSize],
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="medium"
      aria-label="GFS 디스크 상세 정보"
      className="ct-gfs-mount-info-modal ct-clvm-disk-modal ct-clvm-disk-modal--medium"
    >
      <ModalHeader title="GFS 디스크 상세 정보" />
      <ModalBody>
        <div className="ct-gfs-mount-info-modal__body">
          {rows.map(([label, value]) => (
            <div className="ct-gfs-mount-info-modal__row" key={label}>
              <strong>{label}</strong>
              <span>{renderValue(value)}</span>
            </div>
          ))}

          <div className="ct-gfs-mount-info-modal__row ct-gfs-mount-info-modal__row--top">
            <strong>GFS 리소스 상태</strong>
            <span>
              {mountInfo.resourceStatus.length > 0
                ? mountInfo.resourceStatus.map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))
                : "N/A"}
            </span>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>
          확인
        </Button>
      </ModalFooter>
    </Modal>
  );
}
