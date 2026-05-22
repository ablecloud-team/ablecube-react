import React from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Wizard,
  WizardStep,
  Title,
  Content,
  Form,
  FormGroup,
  Radio,
  Checkbox,
  TextInput,
  TextArea,
  FileUpload,
  FormSelect,
  FormSelectOption,
  Button,
  Label,
  Spinner,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Alert,
} from "@patternfly/react-core";
import { InfoCircleIcon } from "@patternfly/react-icons";

import ValidationErrorModal from "../components/common/ValidationErrorModal";
import "./storage-vm-deploy-wizard.scss";
import {
  duplicateMessage,
  getIpFromCidr,
  isHostname,
  isIpv4,
  optionalIpv4,
  requireHostname,
  requireIpv4,
  requireIpv4Cidr,
} from "./validation";

type DiskMode = "rp" | "lp";
type StorageTrafficMode = "np" | "npb" | "bn";
type HostsFileMode = "existing" | "new";

interface SelectOption {
  value: string;
  label: string;
}

interface DiskOption {
  id: string;
  value: string;
  label: string;
}

interface ClusterHostRow {
  hostName: string;
  hostIp: string;
  scvmMgmtIp: string;
  hostPnIp: string;
  scvmPnIp: string;
  scvmCnIp: string;
}

interface StorageVmDeployWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_HOSTS: ClusterHostRow[] = [
  {
    hostName: "ablecube21",
    hostIp: "10.10.2.1",
    scvmMgmtIp: "10.10.2.11",
    hostPnIp: "100.100.2.1",
    scvmPnIp: "100.100.2.11",
    scvmCnIp: "100.200.2.11",
  },
  {
    hostName: "ablecube22",
    hostIp: "10.10.2.2",
    scvmMgmtIp: "10.10.2.12",
    hostPnIp: "100.100.2.2",
    scvmPnIp: "100.100.2.12",
    scvmCnIp: "100.200.2.12",
  },
  {
    hostName: "ablecube23",
    hostIp: "10.10.2.3",
    scvmMgmtIp: "10.10.2.13",
    hostPnIp: "100.100.2.3",
    scvmPnIp: "100.100.2.13",
    scvmCnIp: "100.200.2.13",
  },
];

const ROOT_DISK = "150 GiB (THIN Provisioning)";

const RAID_DISKS: DiskOption[] = [
  { id: "raid-1", value: "0000:5e:00.0", label: "0000:5e:00.0 Broadcom MegaRAID SAS-3 Controller" },
  { id: "raid-2", value: "0000:af:00.0", label: "0000:af:00.0 Broadcom MegaRAID SAS-3 Controller" },
];

const LUN_DISKS: DiskOption[] = [
  { id: "lun-1", value: "/dev/disk/by-path/pci-0000:5e:00.0-scsi-0:2:0:0", label: "/dev/sdb running 1.8T INTEL_SSD" },
  { id: "lun-2", value: "/dev/disk/by-path/pci-0000:5e:00.0-scsi-0:2:1:0", label: "/dev/sdc running 1.8T INTEL_SSD" },
  { id: "lun-3", value: "/dev/disk/by-path/pci-0000:af:00.0-scsi-0:2:0:0", label: "/dev/sdd running 1.8T SAMSUNG_SSD" },
];

const BRIDGE_OPTIONS: SelectOption[] = [
  { value: "bridge0", label: "bridge0 (connected)" },
  { value: "bridge1", label: "bridge1 (connected)" },
  { value: "bridge2", label: "bridge2 (disconnected)" },
];

const NIC_OPTIONS: SelectOption[] = [
  { value: "0000:18:00.0", label: "eno1 ethernet 0000:18:00.0 (connected)" },
  { value: "0000:18:00.1", label: "eno2 ethernet 0000:18:00.1 (connected)" },
  { value: "0000:3b:00.0", label: "ens1f0 ethernet 0000:3b:00.0 (connected)" },
  { value: "0000:3b:00.1", label: "ens1f1 ethernet 0000:3b:00.1 (connected)" },
];

export default function StorageVmDeployWizardModal({
  isOpen,
  onClose,
}: StorageVmDeployWizardModalProps) {
  const [cpu, setCpu] = React.useState("8");
  const [memory, setMemory] = React.useState("16");
  const [diskMode, setDiskMode] = React.useState<DiskMode>("rp");
  const [selectedDisks, setSelectedDisks] = React.useState<string[]>([RAID_DISKS[0].value]);
  const [mgmtBridge, setMgmtBridge] = React.useState("bridge0");
  const [storageTrafficMode, setStorageTrafficMode] = React.useState<StorageTrafficMode>("np");
  const [storageNic1, setStorageNic1] = React.useState(NIC_OPTIONS[0].value);
  const [storageNic2, setStorageNic2] = React.useState(NIC_OPTIONS[1].value);
  const [replicaNic1, setReplicaNic1] = React.useState(NIC_OPTIONS[2].value);
  const [replicaNic2, setReplicaNic2] = React.useState(NIC_OPTIONS[3].value);
  const [storageBridge, setStorageBridge] = React.useState("bridge1");
  const [replicaBridge, setReplicaBridge] = React.useState("bridge2");
  const [hostsFileMode, setHostsFileMode] = React.useState<HostsFileMode>("existing");
  const [hostCount, setHostCount] = React.useState(3);
  const [hosts, setHosts] = React.useState<ClusterHostRow[]>(DEFAULT_HOSTS);
  const [currentHostname] = React.useState("ablecube21");

  const [scvmHostname, setScvmHostname] = React.useState("scvm1");
  const [mgmtIp, setMgmtIp] = React.useState("10.10.2.11/16");
  const [mgmtGateway, setMgmtGateway] = React.useState("10.10.0.1");
  const [mgmtDns, setMgmtDns] = React.useState("8.8.8.8");
  const [storageIp, setStorageIp] = React.useState("100.100.2.11/24");
  const [replicaIp, setReplicaIp] = React.useState("100.200.2.11/24");
  const [ccvmMgmtIp, setCcvmMgmtIp] = React.useState("10.10.2.10");

  const [sshPrivateKey, setSshPrivateKey] = React.useState("");
  const [sshPublicKey, setSshPublicKey] = React.useState("");
  const [sshPrivateFilename, setSshPrivateFilename] = React.useState("");
  const [sshPublicFilename, setSshPublicFilename] = React.useState("");

  const [reviewOpen, setReviewOpen] = React.useState({
    device: true,
    additional: true,
    ssh: true,
  });
  const [disableNav, setDisableNav] = React.useState(false);
  const [showDeployConfirm, setShowDeployConfirm] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [isDeployStarted, setIsDeployStarted] = React.useState(false);
  const [validationMessage, setValidationMessage] = React.useState("");
  const deployNextStepRef = React.useRef<(() => void) | null>(null);

  const resetState = React.useCallback(() => {
    setCpu("8");
    setMemory("16");
    setDiskMode("rp");
    setSelectedDisks([RAID_DISKS[0].value]);
    setMgmtBridge("bridge0");
    setStorageTrafficMode("np");
    setStorageNic1(NIC_OPTIONS[0].value);
    setStorageNic2(NIC_OPTIONS[1].value);
    setReplicaNic1(NIC_OPTIONS[2].value);
    setReplicaNic2(NIC_OPTIONS[3].value);
    setStorageBridge("bridge1");
    setReplicaBridge("bridge2");
    setHostsFileMode("existing");
    setHostCount(3);
    setHosts(DEFAULT_HOSTS);
    setScvmHostname("scvm1");
    setMgmtIp("10.10.2.11/16");
    setMgmtGateway("10.10.0.1");
    setMgmtDns("8.8.8.8");
    setStorageIp("100.100.2.11/24");
    setReplicaIp("100.200.2.11/24");
    setCcvmMgmtIp("10.10.2.10");
    setSshPrivateKey("");
    setSshPublicKey("");
    setSshPrivateFilename("");
    setSshPublicFilename("");
    setReviewOpen({ device: true, additional: true, ssh: true });
    setDisableNav(false);
    setShowDeployConfirm(false);
    setShowCancelConfirm(false);
    setIsDeployStarted(false);
    setValidationMessage("");
  }, []);

  const handleClose = () => {
    onClose();
    resetState();
  };

  const requestClose = () => {
    setShowCancelConfirm(true);
  };

  const updateHostCount = (nextCount: number) => {
    const safeCount = Math.max(3, Math.min(99, nextCount));
    setHostCount(safeCount);
    setHosts((prev) => {
      if (safeCount === prev.length) return prev;
      if (safeCount < prev.length) return prev.slice(0, safeCount);
      const extras = Array.from({ length: safeCount - prev.length }, (_, idx) => ({
        hostName: `ablecube${prev.length + idx + 21}`,
        hostIp: "",
        scvmMgmtIp: "",
        hostPnIp: "",
        scvmPnIp: "",
        scvmCnIp: "",
      }));
      return [...prev, ...extras];
    });
  };

  const updateHost = (index: number, key: keyof ClusterHostRow, value: string) => {
    setHosts((prev) => prev.map((host, hostIndex) => (
      hostIndex === index ? { ...host, [key]: value } : host
    )));
  };

  const readTextFile = (
    file: File,
    setFilename: (filename: string) => void,
    setText: (text: string) => void
  ) => {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setText(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  };

  const getOptionLabel = (options: SelectOption[], value: string) =>
    options.find((option) => option.value === value)?.label || value || "미입력";

  const currentDiskOptions = diskMode === "rp" ? RAID_DISKS : LUN_DISKS;
  const diskModeLabel = diskMode === "rp" ? "RAID Passthrough" : "LUN Passthrough";
  const storageTrafficModeLabel =
    storageTrafficMode === "np"
      ? "NIC Passthrough"
      : storageTrafficMode === "npb"
        ? "NIC Passthrough Bonding"
        : "Bridge Network";

  const selectedDiskLabels = selectedDisks
    .map((diskValue) => currentDiskOptions.find((disk) => disk.value === diskValue)?.label || diskValue)
    .filter(Boolean);

  const handleDiskModeChange = (nextMode: DiskMode) => {
    setDiskMode(nextMode);
    setSelectedDisks(nextMode === "rp" ? [RAID_DISKS[0].value] : [LUN_DISKS[0].value]);
  };

  const toggleSelectedDisk = (diskValue: string, checked: boolean) => {
    setSelectedDisks((prev) =>
      checked ? [...prev, diskValue] : prev.filter((value) => value !== diskValue)
    );
  };

  const handleStorageTrafficModeChange = (nextMode: StorageTrafficMode) => {
    setStorageTrafficMode(nextMode);
    if (nextMode === "bn") {
      setStorageBridge("bridge1");
      setReplicaBridge("bridge2");
      return;
    }
    setStorageNic1(NIC_OPTIONS[0].value);
    setStorageNic2(NIC_OPTIONS[1].value);
    setReplicaNic1(NIC_OPTIONS[2].value);
    setReplicaNic2(NIC_OPTIONS[3].value);
  };

  const buildHostsPreview = () => {
    const lines: string[] = [];
    lines.push(`${ccvmMgmtIp} ccvm-mngt ccvm`);
    hosts.slice(0, hostCount).forEach((row, index) => {
      const hostIndex = index + 1;
      lines.push(`${row.hostIp}\t${row.hostName}${row.hostName === currentHostname ? "\tablecube" : ""}`);
      lines.push(`${row.scvmMgmtIp}\tscvm${hostIndex}-mngt${row.hostName === currentHostname ? "\tscvm-mngt" : ""}`);
      lines.push(`${row.hostPnIp}\tpn-ablecube${hostIndex}${row.hostName === currentHostname ? "\tpn-ablecube" : ""}`);
      lines.push(`${row.scvmPnIp}\tscvm${hostIndex}${row.hostName === currentHostname ? "\tscvm" : ""}`);
      lines.push(`${row.scvmCnIp}\tcn-scvm${hostIndex}${row.hostName === currentHostname ? "\tcn-scvm" : ""}`);
    });
    return lines.join("\n");
  };

  const buildManagementTrafficReview = () => `관리용 : ${getOptionLabel(BRIDGE_OPTIONS, mgmtBridge)}`;

  const buildStorageTrafficReview = () => {
    if (storageTrafficMode === "bn") {
      return [
        `서버용1 : ${getOptionLabel(BRIDGE_OPTIONS, storageBridge)}`,
        `복제용1 : ${getOptionLabel(BRIDGE_OPTIONS, replicaBridge)}`,
      ];
    }
    if (storageTrafficMode === "npb") {
      return [
        `서버용1 : ${getOptionLabel(NIC_OPTIONS, storageNic1)}`,
        `서버용2 : ${getOptionLabel(NIC_OPTIONS, storageNic2)}`,
        `복제용1 : ${getOptionLabel(NIC_OPTIONS, replicaNic1)}`,
        `복제용2 : ${getOptionLabel(NIC_OPTIONS, replicaNic2)}`,
      ];
    }
    return [
      `서버용1 : ${getOptionLabel(NIC_OPTIONS, storageNic1)}`,
      `복제용1 : ${getOptionLabel(NIC_OPTIONS, replicaNic1)}`,
    ];
  };

  const validateStorageVmDeploy = () => {
    if (!cpu) return "CPU를 입력해주세요.";
    if (!memory) return "Memory를 입력해주세요.";
    if (selectedDisks.length === 0) return "디스크를 입력해주세요.";
    if (!mgmtBridge) return "관리 NIC용 Bridge를 입력해주세요.";

    if (storageTrafficMode === "bn") {
      if (!storageBridge) return "서버용 Bridge를 입력해주세요.";
      if (!replicaBridge) return "복제용 Bridge를 입력해주세요.";
      if (storageBridge === replicaBridge) return "Bridge Network 스토리지 트래픽 구성 값을 다르게 입력해주세요.";
    } else if (storageTrafficMode === "npb") {
      if (!storageNic1) return "서버용 NIC 1번을 입력해주세요.";
      if (!storageNic2) return "서버용 NIC 2번을 입력해주세요.";
      if (!replicaNic1) return "복제용 NIC 1번을 입력해주세요.";
      if (!replicaNic2) return "복제용 NIC 2번을 입력해주세요.";
      const duplicateNic = duplicateMessage(
        [storageNic1, storageNic2, replicaNic1, replicaNic2],
        "NIC Passthrough Bonding 스토리지 트래픽 구성 값을 다르게 입력해주세요."
      );
      if (duplicateNic) return duplicateNic;
    } else {
      if (!storageNic1) return "서버용 NIC 1번을 입력해주세요.";
      if (!replicaNic1) return "복제용 NIC 1번을 입력해주세요.";
      if (storageNic1 === replicaNic1) return "NIC Passthrough 스토리지 트래픽 구성 값을 다르게 입력해주세요.";
    }

    for (let index = 0; index < hostCount; index += 1) {
      const row = hosts[index];
      if (!row) return "클러스터 구성 프로파일 정보를 확인해 주세요.";
      const hostLabel = `${index + 1}번 호스트`;
      if (!row.hostName || !row.hostIp || !row.scvmMgmtIp || !row.hostPnIp || !row.scvmPnIp || !row.scvmCnIp) {
        return "클러스터 구성 프로파일 정보를 확인해 주세요.";
      }
      if (!isHostname(row.hostName)) return `${hostLabel} 호스트명 입력 형식을 확인해주세요.`;
      if (!isIpv4(row.hostIp)) return `${hostLabel} 호스트 IP 형식을 확인해주세요.`;
      if (!isIpv4(row.scvmMgmtIp)) return `${hostLabel} SCVM MNGT IP 형식을 확인해주세요.`;
      if (!isIpv4(row.hostPnIp)) return `${hostLabel} 호스트 PN IP 형식을 확인해주세요.`;
      if (!isIpv4(row.scvmPnIp)) return `${hostLabel} SCVM PN IP 형식을 확인해주세요.`;
      if (!isIpv4(row.scvmCnIp)) return `${hostLabel} SCVM CN IP 형식을 확인해주세요.`;
    }

    const hostNameMessage = requireHostname(scvmHostname);
    if (hostNameMessage) return hostNameMessage;
    const mgmtIpMessage = requireIpv4Cidr(mgmtIp, "관리 NIC IP");
    if (mgmtIpMessage) return mgmtIpMessage;
    const mgmtGatewayMessage = optionalIpv4(mgmtGateway, "관리 NIC Gateway");
    if (mgmtGatewayMessage) return mgmtGatewayMessage;
    const mgmtDnsMessage = optionalIpv4(mgmtDns, "관리 NIC DNS");
    if (mgmtDnsMessage) return mgmtDnsMessage;
    const storageIpMessage = requireIpv4Cidr(storageIp, "스토리지 서버 NIC IP");
    if (storageIpMessage) return storageIpMessage;
    const replicaIpMessage = requireIpv4Cidr(replicaIp, "스토리지 복제 NIC IP");
    if (replicaIpMessage) return replicaIpMessage;
    const ccvmIpMessage = requireIpv4(ccvmMgmtIp, "CCVM 관리 IP");
    if (ccvmIpMessage) return ccvmIpMessage;

    const duplicateProfileIpMessage = duplicateMessage(
      hosts.slice(0, hostCount).flatMap((row) => [
        row.hostIp,
        row.scvmMgmtIp,
        row.hostPnIp,
        row.scvmPnIp,
        row.scvmCnIp,
      ]),
      "클러스터 구성 프로파일에 중복된 IP가 존재합니다."
    );
    if (duplicateProfileIpMessage) return duplicateProfileIpMessage;
    const duplicateVmIpMessage = duplicateMessage(
      [getIpFromCidr(mgmtIp), getIpFromCidr(storageIp), getIpFromCidr(replicaIp), ccvmMgmtIp],
      "추가 네트워크 정보에 중복된 IP가 존재합니다."
    );
    if (duplicateVmIpMessage) return duplicateVmIpMessage;

    return "";
  };

  const executeMockDeploy = () => {
    const errorMessage = validateStorageVmDeploy();
    if (errorMessage) {
      setValidationMessage(errorMessage);
      setShowDeployConfirm(false);
      return;
    }

    setValidationMessage("");
    setShowDeployConfirm(false);
    setIsDeployStarted(true);
    deployNextStepRef.current?.();
  };

  const wizardFooter = (
    activeStep: any,
    goToNextStep: () => void,
    goToPrevStep: () => void,
    close: () => void
  ) => {
    if (!activeStep) return null;
    const stepId = String(activeStep.id);
    const isFirst = stepId === "storage-vm-overview";
    const isReview = stepId === "storage-vm-review";
    const isFinish = stepId === "storage-vm-finish";
    const isDeploy = stepId === "storage-vm-deploy";
    return (
      <div className="ct-storage-vm-wizard__footer">
        {!isFinish && (
          <Button
            variant="primary"
            onClick={() => {
              if (isReview) {
                deployNextStepRef.current = goToNextStep;
                setShowDeployConfirm(true);
                return;
              }
              goToNextStep();
            }}
          >
            {isReview ? "배포" : isDeploy ? "다음" : "다음"}
          </Button>
        )}
        {!isFirst && !isFinish && (
          <Button variant="secondary" onClick={goToPrevStep}>
            이전
          </Button>
        )}
        {!isFinish && (
          <Button
            variant="link"
            onClick={() => {
              if (isDeploy) {
                close();
                return;
              }
              setShowCancelConfirm(true);
            }}
          >
            취소
          </Button>
        )}
        {isFinish && (
          <Button variant="primary" onClick={close}>
            닫기
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      // onClose={handleClose}
      variant="large"
      aria-label="스토리지센터 가상머신 배포 마법사"
      className="ct-storage-vm-wizard__modal"
    >
      <Wizard
        onClose={requestClose}
        onSave={handleClose}
        width="100%"
        navAriaLabel="스토리지센터 가상머신 배포 단계"
        className={disableNav ? "ct-storage-vm-wizard ct-storage-vm-wizard--nav-locked" : "ct-storage-vm-wizard"}
        footer={wizardFooter}
        navProps={{ "aria-disabled": disableNav }}
        onStepChange={(_event, currentStep) => {
          const stepId = String(currentStep.id);
          setDisableNav(stepId === "storage-vm-finish");
        }}
        header={
          <div className="ct-storage-vm-wizard__header">
            <div>
              <Title headingLevel="h1" size="2xl" className="ct-storage-vm-wizard__title">
                ABLESTACK 스토리지센터 가상머신 배포 마법사
              </Title>
              <Content className="ct-storage-vm-wizard__subtitle">
                <Content component="p">
                  현재 호스트에 ABLESTACK 스토리지센터 클러스터를 구성하기 위해 스토리지 가상머신 배포를 단계별로 실행합니다.
                </Content>
              </Content>
            </div>
            <button
              type="button"
              className="ct-storage-vm-wizard__close"
              aria-label="Close"
              onClick={requestClose}
            >
              ×
            </button>
          </div>
        }
      >
        <WizardStep name="개요" id="storage-vm-overview">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지 가상머신 배포 마법사는 현재 호스트에 스토리지를 구성하고 컨트롤할 수 있는 스토리지 가상머신의 속성을 설정하고 배포합니다.
                스토리지 가상머신을 배포하기 위해서는 다음의 정보가 필요합니다.
              </Content>
              <Content component="ul">
                <Content component="li">가상머신의 컴퓨트 정보</Content>
                <Content component="li">가상머신에 연결할 스토리지용 디스크 정보</Content>
                <Content component="li">네트워크 트래픽 처리를 위한 NIC 정보</Content>
                <Content component="li">SSH Key 및 호스트 NIC 설정 등의 추가 배포 정보</Content>
              </Content>
              <Content component="p">
                필요한 정보를 먼저 준비하십시오. 정보가 준비되었다면 "다음" 버튼을 눌러 가상머신 배포를 시작합니다.
              </Content>
            </Content>
          </div>
        </WizardStep>

        <WizardStep
          name="가상머신 장치 구성"
          id="storage-vm-device"
          steps={[
            <WizardStep name="컴퓨트" id="storage-vm-compute" key="storage-vm-compute">
              <div className="ct-storage-vm-wizard__content">
                <Content>
                  <Content component="p">
                    스토리지 가상머신을 구성하기 위해 CPU, Memory 등을 어떻게 구성할지 결정해야 합니다.
                    다음의 컴퓨트 자원 항목에 구성하고자 하는 자원의 값을 입력하십시오.
                  </Content>
                </Content>
                <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
                  <FormGroup label="CPU" isRequired fieldId="storage-vm-cpu">
                    <FormSelect
                      id="storage-vm-cpu"
                      value={cpu}
                      onChange={(_event, value) => setCpu(String(value))}
                    >
                      <FormSelectOption value="8" label="8 vCore" />
                      <FormSelectOption value="16" label="16 vCore" />
                    </FormSelect>
                  </FormGroup>
                  <FormGroup label="Memory" isRequired fieldId="storage-vm-memory">
                    <FormSelect
                      id="storage-vm-memory"
                      value={memory}
                      onChange={(_event, value) => setMemory(String(value))}
                    >
                      <FormSelectOption value="16" label="16 GiB" />
                      <FormSelectOption value="32" label="32 GiB" />
                      <FormSelectOption value="48" label="48 GiB" />
                      <FormSelectOption value="64" label="64 GiB" />
                    </FormSelect>
                  </FormGroup>
                  <FormGroup label="ROOT Disk" fieldId="storage-vm-root-disk">
                    <TextInput id="storage-vm-root-disk" value={ROOT_DISK} isReadOnly />
                  </FormGroup>
                </Form>
                <Alert
                  isInline
                  title="컴퓨트 자원 구성 시 참고사항"
                  variant="info"
                  icon={<InfoCircleIcon />}
                  className="ct-storage-vm-wizard__info"
                >
                  <Content component="p">
                    스토리지의 성능 최적화를 위해 스토리지센터 가상머신의 컴퓨트 자원은 가상머신이 컨트롤 할
                    디스크의 수 및 가용량에 따라 적정하게 선택해야 합니다.
                  </Content>
                  <Content component="p">
                    가상머신이 컨트롤 할 호스트의 디스크가 10개 이내이면 8 vCore를, 그 이상이면 16 vCore를 선택하십시오.
                    메모리는 컨트롤할 호스트의 디스크 용량이 10TB 이내이면 16GiB를, 10 ~ 30 TB이면 32GiB를,
                    30TB를 초과하면 64GiB를 선택해야 합니다.
                  </Content>
                  <Content component="p">
                    ROOT Disk의 크기는 150GiB이며 디스크는 Thin Provisioning 방식으로 제공됩니다.
                  </Content>
                </Alert>
              </div>
            </WizardStep>,
            <WizardStep name="디스크" id="storage-vm-disk" key="storage-vm-disk">
              <div className="ct-storage-vm-wizard__content">
                <Content>
                  <Content component="p">
                    스토리지 가상머신이 스토리지용 디스크로 관리할 호스트의 디스크를 선택해야 합니다.
                    가상머신에 호스트의 디스크를 구성하는 방식을 먼저 선택한 후, 적합한 디스크를 선택하여 구성합니다.
                  </Content>
                </Content>
                <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
                  <FormGroup label="디스크 구성 방식" isRequired fieldId="storage-vm-disk-mode">
                    <div className="ct-storage-vm-wizard__inline">
	                      <Radio
	                        id="storage-vm-disk-raid"
	                        name="storage-vm-disk-mode"
	                        label="PCI Passthrough"
	                        isChecked={diskMode === "rp"}
	                        onChange={() => handleDiskModeChange("rp")}
	                      />
	                      <Radio
	                        id="storage-vm-disk-lun"
	                        name="storage-vm-disk-mode"
	                        label="LUN Passthrough"
	                        isChecked={diskMode === "lp"}
	                        onChange={() => handleDiskModeChange("lp")}
	                      />
	                    </div>
	                  </FormGroup>
	                  <FormGroup label="디스크 구성 대상 장치" isRequired fieldId="storage-vm-disk-target">
	                    <div className="ct-storage-vm-wizard__disk-list">
	                      {currentDiskOptions.map((disk) => (
	                        <div key={disk.id} className="ct-storage-vm-wizard__disk-item">
	                          <Checkbox
	                            id={`storage-vm-disk-${disk.id}`}
	                            label={disk.label}
	                            isChecked={selectedDisks.includes(disk.value)}
	                            onChange={(_event, checked) => toggleSelectedDisk(disk.value, checked)}
	                          />
	                        </div>
	                      ))}
	                    </div>
	                  </FormGroup>
                </Form>
                <Alert
                  isInline
                  title="디스크 자원 구성 시 참고사항"
                  variant="info"
                  icon={<InfoCircleIcon />}
                  className="ct-storage-vm-wizard__info"
                >
                  <Content component="p">
                    가장 좋은 성능을 제공하는 방식은 RAID Passthrough 입니다. 단, 호스트에 2개 이상의 RAID 장치가 있어서
                    호스트 OS RAID가 독립적으로 구성되어 있을 때 사용 가능합니다.
                  </Content>
                  <Content component="p">
                    RAID Passthrough를 사용할 수 없는 경우에는 디스크 전체를 가상머신에 할당하는 LUN Passthrough 방식을 선택하십시오.
                  </Content>
                </Alert>
              </div>
            </WizardStep>,
            <WizardStep name="네트워크" id="storage-vm-network" key="storage-vm-network">
              <div className="ct-storage-vm-wizard__content">
                <Content>
                  <Content component="p">
                    스토리지 가상머신을 클러스터링하고 관리할 뿐 아니라 데이터를 가상머신 간에 전송하고 복제할 수 있는
                    NIC를 가상머신에 구성해야 합니다. 가상머신의 NIC를 구성하기 위한 방식을 선택한 후 표시된 장치를 가상머신에 할당합니다.
                  </Content>
                </Content>
                <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
	                  <FormGroup label="관리 NIC용 Bridge" isRequired fieldId="storage-vm-mgmt-bridge">
	                    <FormSelect
	                      id="storage-vm-mgmt-bridge"
	                      value={mgmtBridge}
	                      onChange={(_event, value) => setMgmtBridge(String(value))}
	                    >
	                      {BRIDGE_OPTIONS.map((option) => (
	                        <FormSelectOption key={option.value} value={option.value} label={option.label} />
	                      ))}
	                    </FormSelect>
	                  </FormGroup>
	                  <FormGroup label="스토리지 NIC 구성 방식" isRequired fieldId="storage-vm-storage-mode">
	                    <div className="ct-storage-vm-wizard__inline">
	                      <Radio
	                        id="storage-vm-storage-passthrough"
	                        name="storage-vm-storage-mode"
	                        label="NIC Passthrough"
	                        isChecked={storageTrafficMode === "np"}
	                        onChange={() => handleStorageTrafficModeChange("np")}
	                      />
	                      <Radio
	                        id="storage-vm-storage-passthrough-bonding"
	                        name="storage-vm-storage-mode"
	                        label="NIC Passthrough Bonding"
	                        isChecked={storageTrafficMode === "npb"}
	                        onChange={() => handleStorageTrafficModeChange("npb")}
	                      />
	                      <Radio
	                        id="storage-vm-storage-bridge"
	                        name="storage-vm-storage-mode"
	                        label="Bridge Network"
	                        isChecked={storageTrafficMode === "bn"}
	                        onChange={() => handleStorageTrafficModeChange("bn")}
	                      />
	                    </div>
	                  </FormGroup>
	                  <FormGroup label={storageTrafficMode === "npb" ? "서버용 NIC 1/2" : "서버용 NIC"} isRequired fieldId="storage-vm-storage-nic">
	                    <div className="ct-storage-vm-wizard__stacked-selects">
	                      {storageTrafficMode === "bn" ? (
	                        <FormSelect
	                          id="storage-vm-storage-bridge"
	                          value={storageBridge}
	                          onChange={(_event, value) => setStorageBridge(String(value))}
	                        >
	                          {BRIDGE_OPTIONS.map((option) => (
	                            <FormSelectOption key={option.value} value={option.value} label={option.label} />
	                          ))}
	                        </FormSelect>
	                      ) : (
	                        <>
	                          <FormSelect
	                            id="storage-vm-storage-nic1"
	                            value={storageNic1}
	                            onChange={(_event, value) => setStorageNic1(String(value))}
	                          >
	                            {NIC_OPTIONS.map((option) => (
	                              <FormSelectOption key={option.value} value={option.value} label={option.label} />
	                            ))}
	                          </FormSelect>
	                          {storageTrafficMode === "npb" && (
	                            <FormSelect
	                              id="storage-vm-storage-nic2"
	                              value={storageNic2}
	                              onChange={(_event, value) => setStorageNic2(String(value))}
	                            >
	                              {NIC_OPTIONS.map((option) => (
	                                <FormSelectOption key={option.value} value={option.value} label={option.label} />
	                              ))}
	                            </FormSelect>
	                          )}
	                        </>
	                      )}
	                    </div>
	                  </FormGroup>
	                  <FormGroup label={storageTrafficMode === "npb" ? "복제용 NIC 1/2" : "복제용 NIC"} isRequired fieldId="storage-vm-replica-nic">
	                    <div className="ct-storage-vm-wizard__stacked-selects">
	                      {storageTrafficMode === "bn" ? (
	                        <FormSelect
	                          id="storage-vm-replica-bridge"
	                          value={replicaBridge}
	                          onChange={(_event, value) => setReplicaBridge(String(value))}
	                        >
	                          {BRIDGE_OPTIONS.map((option) => (
	                            <FormSelectOption key={option.value} value={option.value} label={option.label} />
	                          ))}
	                        </FormSelect>
	                      ) : (
	                        <>
	                          <FormSelect
	                            id="storage-vm-replica-nic1"
	                            value={replicaNic1}
	                            onChange={(_event, value) => setReplicaNic1(String(value))}
	                          >
	                            {NIC_OPTIONS.map((option) => (
	                              <FormSelectOption key={option.value} value={option.value} label={option.label} />
	                            ))}
	                          </FormSelect>
	                          {storageTrafficMode === "npb" && (
	                            <FormSelect
	                              id="storage-vm-replica-nic2"
	                              value={replicaNic2}
	                              onChange={(_event, value) => setReplicaNic2(String(value))}
	                            >
	                              {NIC_OPTIONS.map((option) => (
	                                <FormSelectOption key={option.value} value={option.value} label={option.label} />
	                              ))}
	                            </FormSelect>
	                          )}
	                        </>
	                      )}
	                    </div>
	                  </FormGroup>
	                </Form>
	                <Alert
	                  isInline
	                  title="네트워크 자원 구성 시 참고사항"
	                  variant="info"
	                  icon={<InfoCircleIcon />}
	                  className="ct-storage-vm-wizard__info"
	                >
	                  <Content component="p">
	                    네트워크는 관리 네트워크와 스토리지 네트워크로 구성됩니다. 관리 트래픽은 브릿지 방식으로 연결하고,
	                    스토리지 트래픽은 NIC Passthrough, NIC Passthrough Bonding, Bridge Network 중 하나를 선택합니다.
	                  </Content>
	                  <Content component="p">
	                    NIC Passthrough에서는 서버용 NIC와 복제용 NIC를 서로 다른 장치로 선택해야 하며, Bonding 구성은 서버용/복제용 NIC를 각각 2개씩 사용합니다.
	                  </Content>
	                </Alert>
	              </div>
	            </WizardStep>,
          ]}
        />

        <WizardStep name="추가 네트워크 정보" id="storage-vm-additional">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지 가상머신의 각종 네트워크 정보를 설정하기 위해 호스트명, IP 정보 등의 추가 네트워크 정보를 입력합니다.
                가상머신이 생성되면서 입력한 정보가 가상머신 내부에 자동으로 설정됩니다.
              </Content>
            </Content>

            <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
              <FormGroup label="클러스터 구성 파일 준비" isRequired fieldId="storage-vm-hosts-file-mode">
                <div className="ct-storage-vm-wizard__inline">
                  <Radio
                    id="storage-vm-hosts-file-existing"
                    name="storage-vm-hosts-file-mode"
                    label="해당 호스트 파일 사용"
                    isChecked={hostsFileMode === "existing"}
                    onChange={() => setHostsFileMode("existing")}
                  />
                  <Radio
                    id="storage-vm-hosts-file-new"
                    name="storage-vm-hosts-file-mode"
                    label="신규 생성"
                    isChecked={hostsFileMode === "new"}
                    onChange={() => setHostsFileMode("new")}
                  />
                </div>
              </FormGroup>
              <FormGroup label="현재 호스트명" isRequired fieldId="storage-vm-current-hostname">
                <TextInput id="storage-vm-current-hostname" value={currentHostname} isReadOnly />
              </FormGroup>
              <FormGroup label="구성할 호스트 수" isRequired fieldId="storage-vm-host-count">
                <div className="ct-storage-vm-wizard__stepper">
                  <Button
                    variant="control"
                    isDisabled={hostsFileMode === "existing"}
                    onClick={() => updateHostCount(hostCount - 1)}
                  >
                    -
                  </Button>
                  <div className="ct-storage-vm-wizard__stepper-value">{hostCount}</div>
                  <Button
                    variant="control"
                    isDisabled={hostsFileMode === "existing"}
                    onClick={() => updateHostCount(hostCount + 1)}
                  >
                    +
                  </Button>
                  <span className="ct-storage-vm-wizard__stepper-unit">대</span>
                </div>
              </FormGroup>

              <div className="ct-storage-vm-wizard__table-wrap">
                <div className="ct-storage-vm-wizard__table-title">클러스터 구성 프로파일</div>
                <table className="ct-storage-vm-wizard__table">
                  <thead>
                    <tr>
                      <th>순번</th>
                      <th>호스트명</th>
                      <th>호스트 IP</th>
                      <th>SCVM<br />MNGT IP</th>
                      <th>호스트 PN IP</th>
                      <th>SCVM PN IP</th>
                      <th>SCVM CN IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosts.slice(0, hostCount).map((row, idx) => (
                      <tr key={`storage-vm-host-row-${idx}`}>
                        <td>{idx + 1}</td>
                        <td>
                          <TextInput
                            aria-label={`호스트명 ${idx + 1}`}
                            value={row.hostName}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "hostName", value)}
                          />
                        </td>
                        <td>
                          <TextInput
                            aria-label={`호스트 IP ${idx + 1}`}
                            value={row.hostIp}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "hostIp", value)}
                          />
                        </td>
                        <td>
                          <TextInput
                            aria-label={`SCVM MNGT IP ${idx + 1}`}
                            value={row.scvmMgmtIp}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "scvmMgmtIp", value)}
                          />
                        </td>
                        <td>
                          <TextInput
                            aria-label={`호스트 PN IP ${idx + 1}`}
                            value={row.hostPnIp}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "hostPnIp", value)}
                          />
                        </td>
                        <td>
                          <TextInput
                            aria-label={`SCVM PN IP ${idx + 1}`}
                            value={row.scvmPnIp}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "scvmPnIp", value)}
                          />
                        </td>
                        <td>
                          <TextInput
                            aria-label={`SCVM CN IP ${idx + 1}`}
                            value={row.scvmCnIp}
                            isDisabled={hostsFileMode === "existing"}
                            onChange={(_event, value) => updateHost(idx, "scvmCnIp", value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <FormGroup label="호스트명(SCVM)" isRequired fieldId="storage-vm-hostname">
                <TextInput
                  id="storage-vm-hostname"
                  value={scvmHostname}
                  onChange={(_event, value) => setScvmHostname(value)}
                />
              </FormGroup>
              <FormGroup label="관리 NIC IP" isRequired fieldId="storage-vm-mgmt-ip">
                <TextInput
                  id="storage-vm-mgmt-ip"
                  value={mgmtIp}
                  placeholder="xxx.xxx.xxx.xxx/xx 형식으로 입력"
                  onChange={(_event, value) => setMgmtIp(value)}
                />
              </FormGroup>
              <FormGroup label="관리 NIC Gateway" fieldId="storage-vm-mgmt-gateway">
                <TextInput
                  id="storage-vm-mgmt-gateway"
                  value={mgmtGateway}
                  onChange={(_event, value) => setMgmtGateway(value)}
                />
              </FormGroup>
              <FormGroup label="관리 NIC DNS" fieldId="storage-vm-mgmt-dns">
                <TextInput
                  id="storage-vm-mgmt-dns"
                  value={mgmtDns}
                  onChange={(_event, value) => setMgmtDns(value)}
                />
              </FormGroup>
              <FormGroup label="스토리지 서버 NIC IP" isRequired fieldId="storage-vm-storage-ip">
                <TextInput
                  id="storage-vm-storage-ip"
                  value={storageIp}
                  placeholder="xxx.xxx.xxx.xxx/xx 형식으로 입력"
                  onChange={(_event, value) => setStorageIp(value)}
                />
              </FormGroup>
              <FormGroup label="스토리지 복제 NIC IP" isRequired fieldId="storage-vm-replica-ip">
                <TextInput
                  id="storage-vm-replica-ip"
                  value={replicaIp}
                  placeholder="xxx.xxx.xxx.xxx/xx 형식으로 입력"
                  onChange={(_event, value) => setReplicaIp(value)}
                />
              </FormGroup>
              <FormGroup label="CCVM 관리 IP" isRequired fieldId="storage-vm-ccvm-ip">
                <TextInput
                  id="storage-vm-ccvm-ip"
                  value={ccvmMgmtIp}
                  placeholder="xxx.xxx.xxx.xxx 형식으로 입력"
                  isDisabled={hostsFileMode === "existing"}
                  onChange={(_event, value) => setCcvmMgmtIp(value)}
                />
              </FormGroup>
            </Form>
          </div>
        </WizardStep>

        <WizardStep name="SSH Key 정보" id="storage-vm-ssh">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                호스트 및 스토리지센터 가상머신 간의 암호화된 통신을 위해 생성되는 가상머신에 SSH Key를 설정해야 합니다.
                기본적으로 현재 호스트의 SSH Key 파일을 자동으로 등록하며, 필요시 다운로드 한 SSH Key 파일로 등록 가능합니다.
              </Content>
            </Content>
            <Form className="ct-storage-vm-wizard__section ct-storage-vm-wizard__form-horizontal" isHorizontal>
              <FormGroup label="SSH 개인 Key 파일" isRequired fieldId="storage-vm-ssh-private">
                <FileUpload
                  id="storage-vm-ssh-private-file"
                  type="text"
                  value=""
                  filename={sshPrivateFilename}
                  filenamePlaceholder="현재 호스트 id_rsa 자동 사용 또는 파일 선택"
                  onFileInputChange={(_, file) => readTextFile(file, setSshPrivateFilename, setSshPrivateKey)}
                  hideDefaultPreview
                />
                <TextArea
                  className="ct-storage-vm-wizard__file-preview"
                  value={sshPrivateKey || "현재 호스트 SSH 개인 Key 파일을 자동으로 사용합니다."}
                  rows={4}
                  readOnly
                />
              </FormGroup>
              <FormGroup label="SSH 공개 Key 파일" isRequired fieldId="storage-vm-ssh-public">
                <FileUpload
                  id="storage-vm-ssh-public-file"
                  type="text"
                  value=""
                  filename={sshPublicFilename}
                  filenamePlaceholder="현재 호스트 id_rsa.pub 자동 사용 또는 파일 선택"
                  onFileInputChange={(_, file) => readTextFile(file, setSshPublicFilename, setSshPublicKey)}
                  hideDefaultPreview
                />
                <TextArea
                  className="ct-storage-vm-wizard__file-preview"
                  value={sshPublicKey || "현재 호스트 SSH 공개 Key 파일을 자동으로 사용합니다."}
                  rows={3}
                  readOnly
                />
              </FormGroup>
            </Form>
            <Alert
              isInline
              title="SSH Key 등록 참고사항"
              variant="info"
              icon={<InfoCircleIcon />}
              className="ct-storage-vm-wizard__info"
            >
              <Content component="p">
                SSH Key는 호스트 및 스토리지센터 가상머신 등의 ABLESTACK 구성요소 간의 암호화된 인증을 위해 사용됩니다.
              </Content>
              <Content component="p">
                호스트 간, 가상머신 간의 모든 명령은 SSH를 이용해 전달되며 이 때 SSH Key를 이용해 인증을 처리합니다.
                따라서 모든 호스트, 가상머신은 동일한 SSH Key를 사용해야 합니다.
              </Content>
            </Alert>
          </div>
        </WizardStep>

        <WizardStep name="설정확인" id="storage-vm-review">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지센터 VM의 배포를 위해 입력한 설정 정보는 다음과 같습니다. 입력한 정보를 수정하고자 하는 경우,
                해당 탭으로 이동하여 정보를 수정하십시오. 모든 정보를 확인한 후 "배포"를 시작합니다.
              </Content>
            </Content>
            <div className="ct-storage-vm-wizard__review-accordion">
              <div className="ct-storage-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-storage-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, device: !prev.device }))}
                >
                  <span>가상머신 장치 구성</span>
                  <span className={reviewOpen.device ? "ct-storage-chevron ct-storage-chevron--open" : "ct-storage-chevron"}>▾</span>
                </button>
                {reviewOpen.device && (
                  <div className="ct-storage-vm-wizard__review-body">
                    <DescriptionList isCompact className="ct-storage-vm-wizard__review-detail">
                      <DescriptionListGroup>
                        <DescriptionListTerm>CPU</DescriptionListTerm>
                        <DescriptionListDescription>{cpu} vCore</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Memory</DescriptionListTerm>
                        <DescriptionListDescription>{memory} GiB</DescriptionListDescription>
	                      </DescriptionListGroup>
	                      <DescriptionListGroup>
	                        <DescriptionListTerm>ROOT Disk</DescriptionListTerm>
	                        <DescriptionListDescription>{ROOT_DISK}</DescriptionListDescription>
	                      </DescriptionListGroup>
	                      <DescriptionListGroup>
	                        <DescriptionListTerm>Data Disk</DescriptionListTerm>
	                        <DescriptionListDescription>
	                          {selectedDiskLabels.length > 0
	                            ? selectedDiskLabels.map((disk) => `${diskModeLabel} : ${disk}`).join("\n")
	                            : "미입력"}
	                        </DescriptionListDescription>
	                      </DescriptionListGroup>
	                      <DescriptionListGroup>
	                        <DescriptionListTerm>네트워크</DescriptionListTerm>
	                        <DescriptionListDescription>
	                          {buildManagementTrafficReview()}
	                        </DescriptionListDescription>
	                        {buildStorageTrafficReview().map((line) => (
	                          <DescriptionListDescription key={line}>{line}</DescriptionListDescription>
	                        ))}
	                        <DescriptionListDescription>스토리지 NIC 구성 방식 : {storageTrafficModeLabel}</DescriptionListDescription>
	                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-storage-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-storage-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, additional: !prev.additional }))}
                >
                  <span>추가 네트워크 정보</span>
                  <span className={reviewOpen.additional ? "ct-storage-chevron ct-storage-chevron--open" : "ct-storage-chevron"}>▾</span>
                </button>
                {reviewOpen.additional && (
                  <div className="ct-storage-vm-wizard__review-body">
	                    <DescriptionList isCompact className="ct-storage-vm-wizard__review-detail">
	                      <DescriptionListGroup>
	                        <DescriptionListTerm>클러스터 구성 준비</DescriptionListTerm>
	                        <DescriptionListDescription>
	                          {hostsFileMode === "existing" ? "해당 호스트 파일 사용" : "신규 생성"}
	                        </DescriptionListDescription>
	                      </DescriptionListGroup>
	                      <DescriptionListGroup>
	                        <DescriptionListTerm>클러스터 구성 프로파일</DescriptionListTerm>
	                        <DescriptionListDescription>
                          <TextArea
                            readOnly
                            value={buildHostsPreview()}
                            rows={6}
                            className="ct-storage-vm-wizard__review-textarea"
                          />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>호스트명(SCVM)</DescriptionListTerm>
                        <DescriptionListDescription>{scvmHostname}</DescriptionListDescription>
	                      </DescriptionListGroup>
	                      <DescriptionListGroup>
	                        <DescriptionListTerm>관리네트워크</DescriptionListTerm>
	                        <DescriptionListDescription>
	                          IP Addr : {mgmtIp || "미입력"}
	                          <br />
	                          Gateway : {mgmtGateway || "미입력"}
	                          <br />
	                          DNS : {mgmtDns || "미입력"}
	                        </DescriptionListDescription>
	                      </DescriptionListGroup>
	                      <DescriptionListGroup>
	                        <DescriptionListTerm>스토리지네트워크</DescriptionListTerm>
	                        <DescriptionListDescription>
	                          서버 IP Addr : {storageIp || "미입력"}
	                          <br />
	                          복제 IP Addr : {replicaIp || "미입력"}
	                        </DescriptionListDescription>
	                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>CCVM 관리 IP</DescriptionListTerm>
                        <DescriptionListDescription>{ccvmMgmtIp}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>

              <div className="ct-storage-vm-wizard__review-section">
                <button
                  type="button"
                  className="ct-storage-vm-wizard__review-header"
                  onClick={() => setReviewOpen((prev) => ({ ...prev, ssh: !prev.ssh }))}
                >
                  <span>SSH Key 정보</span>
                  <span className={reviewOpen.ssh ? "ct-storage-chevron ct-storage-chevron--open" : "ct-storage-chevron"}>▾</span>
                </button>
                {reviewOpen.ssh && (
                  <div className="ct-storage-vm-wizard__review-body">
	                    <DescriptionList isCompact className="ct-storage-vm-wizard__review-detail">
	                      <DescriptionListGroup>
	                        <DescriptionListTerm>SSH 개인 Key 파일</DescriptionListTerm>
	                        <DescriptionListDescription>
	                          <TextArea
	                            readOnly
	                            value={sshPrivateKey || sshPrivateFilename || "현재 호스트 id_rsa 자동 사용"}
	                            rows={5}
	                            className="ct-storage-vm-wizard__review-textarea"
	                          />
	                        </DescriptionListDescription>
	                      </DescriptionListGroup>
	                      <DescriptionListGroup>
	                        <DescriptionListTerm>SSH 공개 Key 파일</DescriptionListTerm>
	                        <DescriptionListDescription>
	                          <TextArea
	                            readOnly
	                            value={sshPublicKey || sshPublicFilename || "현재 호스트 id_rsa.pub 자동 사용"}
	                            rows={4}
	                            className="ct-storage-vm-wizard__review-textarea"
	                          />
	                        </DescriptionListDescription>
	                      </DescriptionListGroup>
                    </DescriptionList>
                  </div>
                )}
              </div>
            </div>
          </div>
        </WizardStep>

        <WizardStep name="배포" id="storage-vm-deploy">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지센터 가상머신을 배포 중입니다. 전체 4단계 중 4단계 진행 중입니다.
              </Content>
            </Content>
	            <div className="ct-storage-vm-wizard__status-list">
	              <div>
	                <Label color="green" variant="outline">완료</Label>
	                <span>스토리지센터 가상머신 초기화 작업</span>
              </div>
              <div>
                <Label color="green" variant="outline">완료</Label>
                <span>cloudinit iso 파일 생성</span>
              </div>
              <div>
                <Label color="green" variant="outline">완료</Label>
                <span>스토리지센터 가상머신 구성</span>
	              </div>
	              <div>
	                <Label color={isDeployStarted ? "orange" : "blue"} variant="outline">
	                  {isDeployStarted ? "진행중" : "준비중"}
	                </Label>
	                {isDeployStarted && <Spinner size="sm" />}
	                <span>스토리지센터 가상머신 배포</span>
	              </div>
	            </div>
          </div>
        </WizardStep>

        <WizardStep name="완료" id="storage-vm-finish">
          <div className="ct-storage-vm-wizard__content">
            <Content>
              <Content component="p">
                스토리지 가상머신을 배포 완료하였습니다. 다음의 내용을 참고하여 배포된 스토리지 가상머신을 이용해
                스토리지 클러스터를 구성해야 합니다.
              </Content>
              <Content component="ul">
                <Content component="li">모든 호스트에 스토리지센터 가상머신을 배포 완료 했는지 확인합니다.</Content>
                <Content component="li">스토리지센터 접속 방법: https://ip:9090</Content>
                <Content component="li">스토리지센터에 접속하여 스토리지 클러스터를 구성하십시오.</Content>
              </Content>
              <Content component="p">
                추가 호스트 SCVM인 경우 Glue 대시보드에 접속하여 SCVM 추가 작업을 진행 해주세요.
              </Content>
              <Content component="p">마법사를 종료하려면 화면 상단의 닫기 버튼을 클릭하십시오.</Content>
            </Content>
          </div>
        </WizardStep>
      </Wizard>
    </Modal>
    <Modal
      isOpen={showDeployConfirm}
      variant="small"
      aria-label="스토리지센터 가상머신 배포 진행 확인"
      onClose={() => setShowDeployConfirm(false)}
    >
      <ModalHeader title="스토리지센터 가상머신 배포 진행" />
      <ModalBody>
        <Content component="p">스토리지센터 가상머신 배포를 진행하시겠습니까?</Content>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={executeMockDeploy}>
          실행
        </Button>
        <Button variant="link" onClick={() => setShowDeployConfirm(false)}>
          아니요
        </Button>
      </ModalFooter>
    </Modal>
    <Modal
      isOpen={showCancelConfirm}
      variant="small"
      aria-label="스토리지센터 가상머신 배포 취소 확인"
      onClose={() => setShowCancelConfirm(false)}
    >
      <ModalHeader title="스토리지센터 가상머신 배포 취소" />
      <ModalBody>
        <Content component="p">
          스토리지센터 가상머신 배포를 취소하시겠습니까? 입력된 데이터는 초기화 됩니다.
        </Content>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={handleClose}>
          실행
        </Button>
        <Button variant="link" onClick={() => setShowCancelConfirm(false)}>
          아니요
        </Button>
      </ModalFooter>
    </Modal>
    <ValidationErrorModal
      isOpen={Boolean(validationMessage)}
      message={validationMessage}
      onClose={() => setValidationMessage("")}
    />
    </>
  );
}
