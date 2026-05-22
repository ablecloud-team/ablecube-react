// 상단 "설정파일 다운로드" 버튼에서 사용하는 다운로드 목록 모달입니다.
import React from "react";
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@patternfly/react-core";
import cockpit from "cockpit";

type DownloadStatus = "loading" | "ready" | "error";

interface DownloadFileDefinition {
  key: string;
  label: string;
  filename: string;
  paths: string[];
}

interface DownloadFileState extends DownloadFileDefinition {
  status: DownloadStatus;
  href?: string;
  error?: string;
}

interface ConfigFileDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DOWNLOAD_FILES: DownloadFileDefinition[] = [
  {
    key: "private-ssh-key",
    label: "Private SSH Key 다운로드",
    filename: "id_rsa",
    paths: ["/root/.ssh/id_rsa"],
  },
  {
    key: "public-ssh-key",
    label: "Public SSH Key 다운로드",
    filename: "id_rsa.pub",
    paths: ["/root/.ssh/id_rsa.pub"],
  },
  {
    key: "cluster-json",
    label: "Cluster.json 파일 다운로드",
    filename: "cluster.json",
    paths: [
      "/usr/share/cockpit/ablestack/tools/properties/cluster.json",
      "/root/ablecube-react/tools/properties/cluster.json",
    ],
  },
];

const downloadHref = (content: string) =>
  `data:attachment/text;charset=utf-8,${encodeURIComponent(content)}`;

async function readFirstAvailable(paths: string[]) {
  let lastError = "";

  for (const path of paths) {
    try {
      const content = await cockpit.file(path).read();
      if (content) {
        return { content, path };
      }
      lastError = `${path} 파일이 비어 있습니다.`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError || "파일을 읽을 수 없습니다.");
}

export default function ConfigFileDownloadModal({
  isOpen,
  onClose,
}: ConfigFileDownloadModalProps) {
  const [files, setFiles] = React.useState<DownloadFileState[]>(
    DOWNLOAD_FILES.map((file) => ({ ...file, status: "loading" }))
  );

  React.useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    setFiles(DOWNLOAD_FILES.map((file) => ({ ...file, status: "loading" })));

    DOWNLOAD_FILES.forEach((file) => {
      readFirstAvailable(file.paths)
        .then(({ content }) => {
          if (!isCurrent) return;
          setFiles((prev) =>
            prev.map((item) =>
              item.key === file.key
                ? { ...item, status: "ready", href: downloadHref(content), error: undefined }
                : item
            )
          );
        })
        .catch((error) => {
          if (!isCurrent) return;
          setFiles((prev) =>
            prev.map((item) =>
              item.key === file.key
                ? {
                    ...item,
                    status: "error",
                    href: undefined,
                    error: error instanceof Error ? error.message : String(error),
                  }
                : item
            )
          );
        });
    });

    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="small"
      aria-label="설정파일 다운로드"
      className="ct-config-file-download-modal"
    >
      <ModalHeader title="설정파일 다운로드" />
      <ModalBody>
        <Content component="p">다운로드할 서버 설정파일을 클릭해주세요</Content>
        <div className="ct-config-file-download-modal__list">
          {files.map((file) => (
            <div className="ct-config-file-download-modal__item" key={file.key}>
              <span className="ct-config-file-download-modal__label">- {file.label} :</span>
              {file.status === "loading" && (
                <span className="ct-config-file-download-modal__loading">
                  <Spinner size="sm" aria-label={`${file.label} 확인 중`} />
                  파일 확인 중
                </span>
              )}
              {file.status === "ready" && file.href && (
                <a
                  className="pf-v6-c-button pf-m-link"
                  href={file.href}
                  download={file.filename}
                >
                  파일을 다운로드 하시려면 클릭하십시오
                </a>
              )}
              {file.status === "error" && (
                <span className="ct-config-file-download-modal__error">
                  {file.error || "파일이 존재하지 않습니다."}
                </span>
              )}
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose}>
          닫기
        </Button>
      </ModalFooter>
    </Modal>
  );
}
